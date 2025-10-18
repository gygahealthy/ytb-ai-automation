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
} from "../shared/types/index.js";
import { COOKIE_SERVICES } from "../shared/types/index.js";
import {
  cookiesToHeader,
  validateRequiredCookies,
  mergeCookies,
} from "../helpers/cookie-parser.helpers.js";
import { logger } from "../../../utils/logger-backend.js";
import {
  rotate1psidts,
  refreshCreds,
  startAutoRotation,
  type RotationControl,
} from "../helpers/cookie-rotation.helpers.js";
import type { CookieRepository } from "../repository/cookie.repository.js";
import type { Cookie } from "../shared/types/index.js";

/**
 * Extended options for database-integrated cookie manager
 */
export interface CookieManagerDBOptions {
  // Rotation intervals
  psidtsIntervalSeconds?: number; // Default: 540 (9 minutes)
  sidccIntervalSeconds?: number; // Default: 120 (2 minutes)

  // Validation options
  autoValidate?: boolean;
  validateOnInit?: boolean;

  // Proxy (optional)
  proxy?: string | undefined;

  // API key for SIDCC refresh
  apiKey?: string;

  // Callbacks
  onPSIDTSRotate?: (result: RotationResult) => void;
  onSIDCCRefresh?: (
    result: RotationResult & { updatedCookies?: Record<string, string> }
  ) => void;
  onError?: (error: string, type: "PSIDTS" | "SIDCC" | "DB") => void;
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
    sidccRefreshes: number;
    psidtsErrors: number;
    sidccErrors: number;
    dbErrors: number;
    lastPSIDTSRotation?: Date;
    lastSIDCCRefresh?: Date;
    lastDBSync?: Date;
  };
  forceRotation: () => Promise<{
    psidtsResult: RotationResult;
    sidccResult: RotationResult & { updatedCookies?: Record<string, string> };
  }>;
  syncToDatabase: () => Promise<void>;
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
  private sidccInterval: NodeJS.Timeout | null = null;

  // Required cookies for Gemini API
  private readonly REQUIRED_COOKIES = ["__Secure-1PSID", "__Secure-1PSIDTS"];

  // Statistics
  private stats = {
    psidtsRotations: 0,
    sidccRefreshes: 0,
    psidtsErrors: 0,
    sidccErrors: 0,
    dbErrors: 0,
    lastPSIDTSRotation: undefined as Date | undefined,
    lastSIDCCRefresh: undefined as Date | undefined,
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
      sidccIntervalSeconds: options.sidccIntervalSeconds ?? 120,
      autoValidate: options.autoValidate ?? false,
      validateOnInit: options.validateOnInit ?? true,
      proxy: options.proxy === undefined ? undefined : options.proxy,
      apiKey: options.apiKey ?? "AIzaSyBWW50ghQ5qHpMg1gxHV7U9t0wHE0qIUk4",
      onPSIDTSRotate: options.onPSIDTSRotate ?? (() => {}),
      onSIDCCRefresh: options.onSIDCCRefresh ?? (() => {}),
      onError: options.onError ?? (() => {}),
      onCookiesSaved: options.onCookiesSaved ?? (() => {}),
      verbose: options.verbose ?? false,
    } as Required<CookieManagerDBOptions>;

    if (this.options.verbose) {
      logger.info("🔧 CookieManagerDB initialized with options", {
        psidtsInterval: this.options.psidtsIntervalSeconds,
        sidccInterval: this.options.sidccIntervalSeconds,
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
      const entity = await this.cookieRepository.findByProfileAndUrl(
        this.profileId,
        this.domain
      );

      if (entity) {
        this.dbEntity = entity;
        logger.debug(`📦 Loaded cookie entity from database:`, {
          id: entity.id,
          status: entity.status,
          lastRotated: entity.lastRotatedAt,
        });

        // Update in-memory cookies with database values
        if (entity.rawCookieString) {
          // Parse raw cookie string if available
          this.mergeDatabaseCookies(entity);
        }
      } else {
        logger.debug(
          `⚠️ No cookie entity found in database for profile: ${this.profileId}`
        );
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

    // Update from structured fields if available
    if (entity.geminiToken) {
      this.cookies["__Secure-1PSIDTS"] = entity.geminiToken;
    }
  }

  /**
   * Validate cookies
   */
  validate(): ValidationResult {
    const result = validateRequiredCookies(this.cookies, this.REQUIRED_COOKIES);

    if (!result.valid) {
      return result;
    }

    const psidts = this.cookies["__Secure-1PSIDTS"];
    if (!psidts || psidts === "undefined") {
      return {
        valid: false,
        error: "__Secure-1PSIDTS is undefined or empty",
      };
    }

    return { valid: true };
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
    this.psidtsControl = startAutoRotation(
      this.cookies,
      this.options.psidtsIntervalSeconds,
      {
        proxy: this.options.proxy,
        onRotate: (result: RotationResult) => {
          this.handlePSIDTSRotation(result);
        },
      }
    );

    // Start SIDCC auto-refresh
    this.startSIDCCRefresh();

    logger.info(`📊 Cookie manager configuration:`);
    logger.info(
      `   - PSIDTS rotation: every ${
        this.options.psidtsIntervalSeconds
      }s (${Math.round(this.options.psidtsIntervalSeconds / 60)} min)`
    );
    logger.info(
      `   - SIDCC refresh: every ${
        this.options.sidccIntervalSeconds
      }s (${Math.round(this.options.sidccIntervalSeconds / 60)} min)`
    );

    return {
      stop: () => this.stop(),
      isRunning: () => this.running,
      getStats: () => ({ ...this.stats }),
      forceRotation: () => this.forceRotation(),
      syncToDatabase: () => this.syncToDatabase(),
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

        // Save to database
        try {
          await this.updateDatabaseRotation(
            {
              lastRotatedAt: new Date().toISOString(),
              geminiToken: result.newPSIDTS,
              status: "active",
            },
            "PSIDTS"
          );
        } catch (error) {
          this.stats.dbErrors++;
          const message =
            error instanceof Error ? error.message : String(error);
          logger.warn(
            `⚠️ Failed to save PSIDTS rotation to database: ${message}`
          );
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
   * Start SIDCC refresh cycle
   */
  private startSIDCCRefresh(): void {
    this.sidccInterval = setInterval(async () => {
      if (!this.running) return;

      logger.debug("⏰ SIDCC auto-refresh triggered");

      try {
        const result = await refreshCreds(this.cookies, {
          apiKey: this.options.apiKey,
          proxy: this.options.proxy,
        });

        if (result.success && result.updatedCookies) {
          this.stats.sidccRefreshes++;
          this.stats.lastSIDCCRefresh = new Date();

          // Update in-memory cookies
          Object.assign(this.cookies, result.updatedCookies);

          logger.info(
            `✅ SIDCC refreshed: updated ${
              Object.keys(result.updatedCookies).length
            } cookies`
          );

          // Save to database
          try {
            await this.updateDatabaseRotation(
              {
                lastRotatedAt: new Date().toISOString(),
                status: "active",
                rawCookieString: cookiesToHeader(this.cookies),
              },
              "SIDCC"
            );
          } catch (error) {
            this.stats.dbErrors++;
            const message =
              error instanceof Error ? error.message : String(error);
            logger.warn(
              `⚠️ Failed to save SIDCC refresh to database: ${message}`
            );
            this.options.onError(message, "DB");
          }
        } else {
          this.stats.sidccErrors++;
          logger.warn(`⚠️ SIDCC refresh failed: ${result.error}`);
          this.options.onError(result.error || "Unknown error", "SIDCC");
        }

        this.options.onSIDCCRefresh(result);
      } catch (error) {
        this.stats.sidccErrors++;
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`💥 SIDCC refresh error: ${message}`);
        this.options.onError(message, "SIDCC");
      }
    }, this.options.sidccIntervalSeconds * 1000);
  }

  /**
   * Update database with rotation data
   */
  private async updateDatabaseRotation(
    data: {
      lastRotatedAt: string;
      geminiToken?: string;
      rawCookieString?: string;
      status?: "active" | "expired" | "renewal_failed";
    },
    rotationType: "PSIDTS" | "SIDCC"
  ): Promise<void> {
    if (!this.dbEntity?.id) {
      logger.debug(
        `⏭️ Skipping database update - no entity ID for ${rotationType}`
      );
      return;
    }

    try {
      await this.cookieRepository.updateRotation(this.dbEntity.id, {
        lastRotatedAt: data.lastRotatedAt,
        geminiToken: data.geminiToken,
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
   * Force immediate rotation of both cookie types
   */
  async forceRotation(): Promise<{
    psidtsResult: RotationResult;
    sidccResult: RotationResult & { updatedCookies?: Record<string, string> };
  }> {
    logger.info("🔄 Forcing immediate cookie rotation...");

    const [psidtsResult, sidccResult] = await Promise.all([
      rotate1psidts(this.cookies, {
        proxy: this.options.proxy,
        skipCache: true,
      }),
      refreshCreds(this.cookies, {
        skipCache: true,
        apiKey: this.options.apiKey,
        proxy: this.options.proxy,
      }),
    ]);

    // Update cookies and database
    if (psidtsResult.success && psidtsResult.newPSIDTS) {
      this.cookies["__Secure-1PSIDTS"] = psidtsResult.newPSIDTS;
      this.stats.psidtsRotations++;
      this.stats.lastPSIDTSRotation = new Date();

      try {
        await this.updateDatabaseRotation(
          {
            lastRotatedAt: new Date().toISOString(),
            geminiToken: psidtsResult.newPSIDTS,
            status: "active",
          },
          "PSIDTS"
        );
      } catch (error) {
        this.stats.dbErrors++;
      }
    }

    if (sidccResult.success && sidccResult.updatedCookies) {
      Object.assign(this.cookies, sidccResult.updatedCookies);
      this.stats.sidccRefreshes++;
      this.stats.lastSIDCCRefresh = new Date();

      try {
        await this.updateDatabaseRotation(
          {
            lastRotatedAt: new Date().toISOString(),
            rawCookieString: cookiesToHeader(this.cookies),
            status: "active",
          },
          "SIDCC"
        );
      } catch (error) {
        this.stats.dbErrors++;
      }
    }

    logger.info(`📊 Force rotation results:`);
    logger.info(
      `   - PSIDTS: ${
        psidtsResult.success ? "✅ Success" : `❌ ${psidtsResult.error}`
      }`
    );
    logger.info(
      `   - SIDCC: ${
        sidccResult.success ? "✅ Success" : `❌ ${sidccResult.error}`
      }`
    );

    return { psidtsResult, sidccResult };
  }

  /**
   * Sync all cookies to database
   */
  async syncToDatabase(): Promise<void> {
    try {
      const cookieHeader = cookiesToHeader(this.cookies);

      if (this.dbEntity?.id) {
        // Update existing entity
        await this.cookieRepository.updateRotation(this.dbEntity.id, {
          lastRotatedAt: new Date().toISOString(),
          rawCookieString: cookieHeader,
          status: "active",
        });
        logger.info(`✅ Synced cookies to database (updated)`);
      } else {
        // Create new entity
        const { v4: uuidv4 } = await import("uuid");
        const now = new Date().toISOString();

        const newEntity: Cookie = {
          id: uuidv4(),
          profileId: this.profileId,
          url: this.domain,
          service: this.service,
          geminiToken: this.cookies["__Secure-1PSIDTS"],
          rawCookieString: cookieHeader,
          lastRotatedAt: now,
          rotationIntervalMinutes: this.options.psidtsIntervalSeconds / 60,
          status: "active",
          createdAt: now,
          updatedAt: now,
        };

        await this.cookieRepository.insert(newEntity);
        this.dbEntity = newEntity;
        logger.info(`✅ Synced cookies to database (created)`);
      }

      this.stats.lastDBSync = new Date();
      this.options.onCookiesSaved(Object.keys(this.cookies).length);
    } catch (error) {
      this.stats.dbErrors++;
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`❌ Failed to sync cookies to database: ${message}`);
      this.options.onError(message, "DB");
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

    if (this.sidccInterval) {
      clearInterval(this.sidccInterval);
      this.sidccInterval = null;
    }

    logger.info("🛑 Cookie manager stopped");
    logger.info(
      `📊 Final stats: PSIDTS(${this.stats.psidtsRotations}/${this.stats.psidtsErrors}) ` +
        `SIDCC(${this.stats.sidccRefreshes}/${this.stats.sidccErrors}) ` +
        `DB(${this.stats.dbErrors})`
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
      logger.debug(
        `🔄 Updated in-memory cookies: ${Object.keys(newCookies).join(", ")}`
      );
    }
  }

  /**
   * Get specific cookie value
   */
  getCookie(name: keyof CookieCollection): string | undefined {
    return this.cookies[name];
  }

  /**
   * Set specific cookie value
   */
  setCookie(name: keyof CookieCollection, value: string): void {
    this.cookies[name] = value;
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
  const manager = new CookieManagerDB(
    cookies,
    cookieRepository,
    profileId,
    domain,
    options,
    service
  );
  await manager.init();
  return manager;
}
