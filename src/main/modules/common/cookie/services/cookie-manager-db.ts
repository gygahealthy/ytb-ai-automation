/**
 * Consolidated Database-Integrated Cookie Manager
 * Combines PSIDTS rotation, SIDCC refresh, and database persistence
 * Integrates cookie lifecycle management with the database repository
 */

import type {
  CookieCollection,
  RotationResult,
  ValidationResult,
  CookieService,
} from "@modules/gemini-apis/shared/types/index.js";
import { COOKIE_SERVICES } from "@modules/gemini-apis/shared/types/index.js";
import { cookiesToHeader, validateRequiredCookies, mergeCookies } from "../helpers/cookie-parser.helpers.js";
import { startAutoRotation, type RotationControl } from "@modules/common/cookie-rotation/helpers/cookie-rotation.helpers.js";
import type { CookieRepository } from "../repository/cookie.repository.js";
import type { Cookie } from "@modules/gemini-apis/shared/types/index.js";
import { logger } from "@/main/utils/logger-backend.js";

/**
 * Extended options for database-integrated cookie manager
 */
export interface CookieManagerDBOptions {
  // Rotation intervals
  psidtsIntervalSeconds?: number; // Default: 540 (9 minutes)

  // Validation options
  autoValidate?: boolean;
  validateOnInit?: boolean;

  // Proxy (optional)
  proxy?: string | undefined;

  // Callbacks
  onPSIDTSRotate?: (result: RotationResult) => void;
  onError?: (error: string, type: "PSIDTS" | "DB") => void;
  onCookiesSaved?: (count: number) => void;

  // Verbose logging
  verbose?: boolean;
}

/**
 * Cookie manager control interface
 */
export interface CookieManagerDBControl {
  stop: () => void;
  isRunning: () => boolean;
  getStats: () => {
    psidtsRotations: number;
    psidtsErrors: number;
    dbErrors: number;
    lastPSIDTSRotation?: Date;
    lastDBSync?: Date;
  };
}

/**
 * Consolidated cookie manager with database integration
 */
export class CookieManagerDB {
  private cookies: CookieCollection;
  private options: Required<CookieManagerDBOptions>;
  private running = false;
  private initialized = false;

  private psidtsControl: RotationControl | null = null;

  // Required cookies for Gemini API
  private readonly REQUIRED_COOKIES = ["__Secure-1PSID", "__Secure-1PSIDTS"];

  // Per-page required cookies loaded from database (overrides REQUIRED_COOKIES if set)
  private requiredCookies: string[] | undefined = undefined;

  // Statistics
  private stats = {
    psidtsRotations: 0,
    psidtsErrors: 0,
    dbErrors: 0,
    lastPSIDTSRotation: undefined as Date | undefined,
    lastDBSync: undefined as Date | undefined,
  };

  private dbEntity: Cookie | null = null;

  constructor(
    cookies: CookieCollection,
    private cookieRepository: CookieRepository,
    private profileId: string,
    private domain: string = "gemini.google.com",
    options: CookieManagerDBOptions = {},
    private service: CookieService = COOKIE_SERVICES.GEMINI
  ) {
    this.cookies = { ...cookies };
    this.options = {
      psidtsIntervalSeconds: options.psidtsIntervalSeconds ?? 540,
      autoValidate: options.autoValidate ?? false,
      validateOnInit: options.validateOnInit ?? true,
      proxy: options.proxy === undefined ? undefined : options.proxy,
      onPSIDTSRotate: options.onPSIDTSRotate ?? (() => {}),
      onError: options.onError ?? (() => {}),
      onCookiesSaved: options.onCookiesSaved ?? (() => {}),
      verbose: options.verbose ?? false,
    } as Required<CookieManagerDBOptions>;

    if (this.options.verbose) {
      logger.info("🔧 CookieManagerDB initialized with options", {
        psidtsInterval: this.options.psidtsIntervalSeconds,
        profileId,
        domain,
      });
    }
  }

  /**
   * Initialize the cookie manager
   * Validates cookies and loads from database if available
   */
  async init(): Promise<void> {
    if (this.initialized) {
      logger.warn("Cookie manager already initialized");
      return;
    }

    try {
      if (this.options.validateOnInit) {
        const validation = this.validate();
        if (!validation.valid) {
          throw new Error(`Cookie validation failed: ${validation.error}`);
        }
      }

      // Try to load from database
      await this.loadFromDatabase();

      this.initialized = true;
      logger.info("✅ CookieManagerDB initialized");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`❌ Failed to initialize CookieManagerDB: ${message}`);
      this.options.onError(message, "DB");
      throw error;
    }
  }

  /**
   * Load cookies from database
   */
  private async loadFromDatabase(): Promise<void> {
    try {
      // Try to find by profile and service first (more reliable)
      let entity = await this.cookieRepository.findActiveByProfileAndService(this.profileId, this.service);

      // Fallback: Try finding by profile and URL if service lookup fails
      if (!entity) {
        logger.debug(`[CookieManagerDB] No entity found by service '${this.service}', trying URL '${this.domain}'`);
        entity = await this.cookieRepository.findByProfileAndUrl(this.profileId, this.domain);
      }

      if (entity) {
        this.dbEntity = entity;
        logger.debug(`📦 Loaded cookie entity from database:`, {
          id: entity.id,
          service: entity.service,
          url: entity.url,
          status: entity.status,
          lastRotated: entity.lastRotatedAt,
          requiredCookies: entity.requiredCookies,
        });

        // Load required cookies for validation (if set)
        if (entity.requiredCookies && entity.requiredCookies.length > 0) {
          this.requiredCookies = entity.requiredCookies;
          logger.info(
            `✅ Loaded ${this.requiredCookies.length} required cookies from database: ${this.requiredCookies.join(", ")}`
          );
        }

        // Update in-memory cookies with database values
        if (entity.rawCookieString) {
          // Parse raw cookie string if available
          this.mergeDatabaseCookies(entity);
        }
      } else {
        logger.debug(`⚠️ No cookie entity found in database for profile: ${this.profileId}, service: ${this.service}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(`⚠️ Failed to load cookies from database: ${message}`);
      // Don't throw - continue with in-memory cookies
    }
  }

  /**
   * Merge database cookies with in-memory cookies
   */
  private mergeDatabaseCookies(entity: Cookie): void {
    if (entity.rawCookieString) {
      try {
        const cookieHeader = entity.rawCookieString;
        for (const part of cookieHeader.split(";")) {
          const trimmed = part.trim();
          if (trimmed && trimmed.includes("=")) {
            const [name, value] = trimmed.split("=", 2);
            this.cookies[name.trim()] = value.trim();
          }
        }
      } catch (error) {
        logger.warn("⚠️ Failed to parse database cookies");
      }
    }

    // Do NOT seed __Secure-1PSIDTS from stored geminiToken here.
    // The rotation worker is the single source of truth for PSIDTS values.
    // If rawCookieString exists we parse and merge it above; avoid overriding
    // the runtime rotation with the persisted geminiToken.
  }

  /**
   * Validate cookies
   */
  /**
   * Validate cookies against required cookies from database or default
   */
  validate(): ValidationResult {
    const cookiesToValidate = this.requiredCookies || this.REQUIRED_COOKIES;
    const result = validateRequiredCookies(this.cookies, cookiesToValidate);

    if (!result.valid) {
      return result;
    }

    // Only validate PSIDTS for Gemini service
    if (this.service === COOKIE_SERVICES.GEMINI) {
      const psidts = this.cookies["__Secure-1PSIDTS"];
      if (!psidts || psidts === "undefined") {
        return {
          valid: false,
          error: "__Secure-1PSIDTS is undefined or empty",
        };
      }
    }

    return { valid: true };
  }

  /**
   * Validate current cookies against database-loaded required cookies
   * Returns validation result with missing cookies if validation fails
   */
  validateCurrentCookies(): ValidationResult {
    const cookiesToValidate = this.requiredCookies || this.REQUIRED_COOKIES;

    logger.debug(`[CookieManagerDB] Validating current cookies`, {
      requiredCookies: cookiesToValidate,
      currentCookies: Object.keys(this.cookies),
    });

    return validateRequiredCookies(this.cookies, cookiesToValidate);
  }

  /**
   * Start rotation and refresh cycles
   */
  start(): CookieManagerDBControl {
    if (this.running) {
      throw new Error("Cookie manager is already running");
    }

    if (!this.initialized) {
      throw new Error("Cookie manager not initialized. Call init() first.");
    }

    this.running = true;
    logger.info("🚀 Starting cookie manager with database integration...");

    // Start PSIDTS auto-rotation
    this.psidtsControl = startAutoRotation(this.cookies, this.options.psidtsIntervalSeconds, {
      proxy: this.options.proxy,
      onRotate: (result: RotationResult) => {
        this.handlePSIDTSRotation(result);
      },
    });

    logger.info(`📊 Cookie manager configuration:`);
    logger.info(
      `   - PSIDTS rotation: every ${this.options.psidtsIntervalSeconds}s (${Math.round(
        this.options.psidtsIntervalSeconds / 60
      )} min)`
    );

    return {
      stop: () => this.stop(),
      isRunning: () => this.running,
      getStats: () => ({ ...this.stats }),
    };
  }

  /**
   * Handle PSIDTS rotation result
   */
  private async handlePSIDTSRotation(result: RotationResult): Promise<void> {
    if (result.success) {
      this.stats.psidtsRotations++;
      this.stats.lastPSIDTSRotation = new Date();

      if (result.newPSIDTS) {
        this.cookies["__Secure-1PSIDTS"] = result.newPSIDTS;
        logger.info(`✅ PSIDTS rotated successfully`);

        // Validate cookies after rotation
        const validation = this.validateCurrentCookies();
        if (!validation.valid) {
          logger.warn(`⚠️ Cookie validation failed after rotation`, {
            error: validation.error,
            missing: (validation as any).missing,
          });
        } else {
          logger.debug(`✅ Cookie validation passed after rotation`);
        }

        // Save to database
        try {
          await this.updateDatabaseRotation(
            {
              lastRotatedAt: new Date().toISOString(),
              status: "active",
            },
            "PSIDTS"
          );
        } catch (error) {
          this.stats.dbErrors++;
          const message = error instanceof Error ? error.message : String(error);
          logger.warn(`⚠️ Failed to save PSIDTS rotation to database: ${message}`);
          this.options.onError(message, "DB");
        }
      }
    } else {
      this.stats.psidtsErrors++;
      logger.warn(`⚠️ PSIDTS rotation failed: ${result.error}`);
      this.options.onError(result.error || "Unknown error", "PSIDTS");
    }

    this.options.onPSIDTSRotate(result);
  }

  /**
   * Update database with rotation data
   */
  private async updateDatabaseRotation(
    data: {
      lastRotatedAt: string;
      rawCookieString?: string;
      status?: "active" | "expired" | "renewal_failed";
    },
    rotationType: "PSIDTS"
  ): Promise<void> {
    if (!this.dbEntity?.id) {
      logger.debug(`⏭️ Skipping database update - no entity ID for ${rotationType}`);
      return;
    }

    try {
      await this.cookieRepository.updateRotation(this.dbEntity.id, {
        lastRotatedAt: data.lastRotatedAt,
        rawCookieString: data.rawCookieString,
        status: data.status,
      });

      logger.debug(`📝 Database updated for ${rotationType} rotation`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to update database: ${message}`);
      throw error;
    }
  }

  /**
   * Stop all rotation and refresh activities
   */
  stop(): void {
    if (!this.running) return;

    this.running = false;

    if (this.psidtsControl) {
      this.psidtsControl.stop();
    }

    logger.info("🛑 Cookie manager stopped");
    logger.info(
      `📊 Final stats: PSIDTS(${this.stats.psidtsRotations}/${this.stats.psidtsErrors}) ` + `DB(${this.stats.dbErrors})`
    );
  }

  /**
   * Get current cookies
   */
  getCookies(): CookieCollection {
    return { ...this.cookies };
  }

  /**
   * Get cookie header string for HTTP requests
   */
  getCookieHeader(): string {
    return cookiesToHeader(this.cookies);
  }

  /**
   * Update cookies in-memory
   */
  updateCookies(newCookies: Partial<CookieCollection>): void {
    this.cookies = mergeCookies(this.cookies, newCookies);

    if (this.options.verbose) {
      logger.debug(`🔄 Updated in-memory cookies: ${Object.keys(newCookies).join(", ")}`);
    }
  }

  /**
   * Get manager state
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  isRunning(): boolean {
    return this.running;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stop();
    this.initialized = false;
    logger.info("🧹 CookieManagerDB cleaned up");
  }

  /**
   * Get database entity reference
   */
  getDatabaseEntity(): Cookie | null {
    return this.dbEntity;
  }

  /**
   * Get statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

/**
 * Factory function to create cookie manager
 */
export async function createCookieManagerDB(
  cookies: CookieCollection,
  cookieRepository: CookieRepository,
  profileId: string,
  domain?: string,
  options?: CookieManagerDBOptions,
  service?: CookieService
): Promise<CookieManagerDB> {
  const manager = new CookieManagerDB(cookies, cookieRepository, profileId, domain, options, service);
  await manager.init();
  return manager;
}
