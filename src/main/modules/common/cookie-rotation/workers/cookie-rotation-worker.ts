/**
 * Cookie Rotation Worker (Phase 1 - Config-Driven)
 * Manages scheduled cookie rotation and refresh tasks with configurable methods
 *
 * Phase 1 Changes:
 * - Config-driven: reads enabledRotationMethods and rotationMethodOrder from DB
 * - Method abstraction: uses RotationMethodRegistry to execute methods
 * - Fallback logic: tries methods in order until one succeeds
 * - Initial refresh support: performInitialRefresh option for startup workers
 */

import type { CookieCollection } from "../../../gemini-apis/shared/types/index.js";
import { logger } from "../../../../utils/logger-backend.js";
import { rotationMethodRegistry } from "../methods/index.js";
import { cookieRotationConfigService } from "../services/cookie-rotation-config.service.js";
import type { RotationMethodResult, RotationMethodType } from "../types/rotation-method.types.js";
import { EventEmitter } from "events";
import { WorkerFileLogger } from "./worker-file-logger.js";
import { profileRotationCoordinator } from "../helpers/profile-rotation-coordinator.js";

/**
 * Worker configuration options
 */
export interface CookieRotationWorkerOptions {
  // Perform initial refresh before starting regular rotation (Phase 2 startup)
  performInitialRefresh?: boolean;

  // Enable verbose logging
  verbose?: boolean;

  // HTTP proxy URL (optional)
  proxy?: string;

  // Cookie service/type (e.g., "gemini", "chatgpt")
  service?: string;

  // Profile ID this cookie belongs to
  profileId?: string;

  // Profile name for logging context
  profileName?: string;

  // Parent-provided config (avoids DB fetch in child process)
  config?: {
    cookieId: string;
    launchWorkerOnStartup: boolean;
    enabledRotationMethods: Array<"refreshCreds" | "rotateCookie" | "headless">;
    rotationMethodOrder: Array<"refreshCreds" | "rotateCookie" | "headless">;
    rotationIntervalMinutes: number;
    // Logging context fields
    profileId?: string;
    profileName?: string;
    service?: string;
  };
}

/**
 * Worker statistics
 */
export interface WorkerStats {
  isRunning: boolean;
  rotations: number;
  rotationErrors: number;
  lastRotation?: Date;
  lastRotationDuration?: number;
  lastSuccessfulMethod?: RotationMethodType;
}

/**
 * Cookie Rotation Worker
 * Config-driven worker that executes rotation methods based on per-cookie configuration
 */
export class CookieRotationWorker extends EventEmitter {
  private cookieId: string;
  private isRunning = false;
  private timer: NodeJS.Timeout | null = null;
  private options: CookieRotationWorkerOptions;
  private fileLogger: WorkerFileLogger;

  // Statistics
  private stats: WorkerStats = {
    isRunning: false,
    rotations: 0,
    rotationErrors: 0,
  };

  constructor(cookieId: string, options?: CookieRotationWorkerOptions) {
    super();
    this.cookieId = cookieId;
    // Use profile name from options or config for better logging context
    const profileName = options?.profileName || options?.config?.profileName;
    const service = options?.service || options?.config?.service;
    this.fileLogger = new WorkerFileLogger(cookieId, service, options?.profileId);
    this.options = {
      performInitialRefresh: false,
      verbose: false,
      ...options,
    };

    const logContext = profileName ? `[${profileName}/${service || "unknown"}] ` : "";
    if (this.options.verbose) {
      this.fileLogger.debug(`${logContext}[CookieRotationWorker] Created for cookie ${cookieId}`);
    }
    // Also log to main logger if available
    try {
      logger.debug(`${logContext}[CookieRotationWorker] Created for cookie ${cookieId}`);
    } catch (e) {
      // Ignore if logger not available in forked process
    }
  }

  /**
   * Start the worker
   * Begins rotation tasks based on configuration
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.fileLogger.warn(`[CookieRotationWorker] Worker for ${this.cookieId} is already running`);
      return;
    }

    this.isRunning = true;
    this.stats.isRunning = true;
    this.emit("statusChanged", "running");

    const profileName = this.options.profileName || this.options.config?.profileName;
    const service = this.options.service || this.options.config?.service;
    const logContext = profileName ? `[${profileName}/${service || "unknown"}] ` : "";

    this.fileLogger.info(`${logContext}Starting worker for cookie ${this.cookieId}`);

    // Prefer parent-provided config (avoids uninitialized service in forked process)
    let config = this.options.config;
    if (!config) {
      // Fallback: fetch from service (only works if service is initialized)
      const fetchedConfig = await cookieRotationConfigService.getCookieConfig(this.cookieId);
      if (!fetchedConfig) {
        this.fileLogger.error(`${logContext}No config found for cookie ${this.cookieId}`);
        this.isRunning = false;
        this.stats.isRunning = false;
        return;
      }
      config = fetchedConfig;
    } else {
      this.fileLogger.debug(`${logContext}Using parent-provided config`);
    }

    const intervalMs = config.rotationIntervalMinutes * 60 * 1000;
    this.timer = setInterval(() => this.runRotationCycle(), intervalMs);

    this.fileLogger.info(`${logContext}Scheduled rotation every ${config.rotationIntervalMinutes} minutes`);

    // Phase 2: Perform initial refresh if requested (startup scenario)
    // CRITICAL: Honor the staggered startup delays by NOT using setImmediate
    // The coordinator's promise chaining will serialize rotations per profile
    if (this.options.performInitialRefresh) {
      this.fileLogger.info(`${logContext}Performing initial headless refresh (background)`);
      // Start rotation immediately (coordinator will handle serialization)
      // Do NOT use setImmediate - it would bypass staggered delays
      this.runRotationCycle({ forceHeadless: true }).catch((error) => {
        this.fileLogger.error(`${logContext}Initial refresh failed:`, error);
        this.emit("rotationError", error instanceof Error ? error.message : "Initial refresh failed");
      });
    }
  }

  /**
   * Stop the worker
   */
  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    this.stats.isRunning = false;
    this.emit("statusChanged", "stopped");

    const profileName = this.options.profileName || this.options.config?.profileName;
    const service = this.options.service || this.options.config?.service;
    const logContext = profileName ? `[${profileName}/${service || "unknown"}] ` : "";

    this.fileLogger.info(`${logContext}Stopped worker for cookie ${this.cookieId}`);

    if (this.options.verbose) {
      this.logStats();
    }

    // Close the file logger
    this.fileLogger.close();
  }

  /**
   * Get worker-safe database instance
   * Uses DB_PATH env var set by parent process instead of Electron app.getPath()
   */
  private async getWorkerSafeDatabase(): Promise<any> {
    const dbPath = process.env.DB_PATH;
    if (!dbPath) {
      throw new Error("DB_PATH environment variable not set. Worker process must receive DB path from parent.");
    }

    // Import SQLiteDatabase directly (not the singleton Database class which uses app.getPath())
    const { SQLiteDatabase } = await import("../../../../storage/sqlite-database.js");
    const db = new SQLiteDatabase(dbPath);
    await db.waitForInit();
    return db;
  }

  /**
   * Run a rotation cycle (Phase 1 - Config-Driven)
   * Fetches config, determines method order, executes methods in sequence
   */
  private async runRotationCycle(options?: { forceHeadless?: boolean }): Promise<void> {
    const profileName = this.options.profileName || this.options.config?.profileName;
    const service = this.options.service || this.options.config?.service;
    const logContext = profileName ? `[${profileName}/${service || "unknown"}] ` : "";

    // Get profileId for coordination
    const profileId = this.options.profileId || this.options.config?.profileId;
    if (!profileId) {
      this.fileLogger.error(`${logContext}No profileId available for rotation coordination`);
      return;
    }

    // Use profile rotation coordinator to prevent simultaneous rotations on same profile
    return profileRotationCoordinator.executeRotation(profileId, this.cookieId, async () => {
      // REMOVED: Random jitter is counterproductive with promise chaining
      // The coordinator already ensures serial execution via promise chains
      // Jitter could cause second cookie to start Chrome before first cookie finishes
      // The 4-second cleanup delay at the end is sufficient

      this.fileLogger.info(`${logContext}Running rotation cycle`);
      const cycleStartTime = Date.now();

      try {
        // 1. Get config (prefer parent-provided, fallback to service)
        let config = this.options.config;
        if (!config) {
          const fetchedConfig = await cookieRotationConfigService.getCookieConfig(this.cookieId);
          if (!fetchedConfig) {
            this.fileLogger.error(`${logContext}Config not found for ${this.cookieId}`);
            return;
          }
          config = fetchedConfig;
        }

        // 2. Fetch current cookie data
        const db = await this.getWorkerSafeDatabase();
        const { CookieRepository } = await import("../../cookie/repository/cookie.repository.js");
        const cookieRepository = new CookieRepository(db);
        const cookie = await cookieRepository.findById(this.cookieId);
        if (!cookie) {
          this.fileLogger.error(`[CookieRotationWorker] Cookie ${this.cookieId} not found in DB`);
          return;
        }

        // 3. Parse cookies into CookieCollection
        const cookies = this.parseCookieString(cookie.rawCookieString || "");

        // 4. Determine method order
        let methodsToTry = config.enabledRotationMethods.filter((method) => config.rotationMethodOrder.includes(method));

        // Sort by the order specified in rotationMethodOrder
        methodsToTry.sort((a, b) => {
          return config.rotationMethodOrder.indexOf(a) - config.rotationMethodOrder.indexOf(b);
        });

        // If forceHeadless, put headless first (Phase 2 startup behavior)
        if (options?.forceHeadless && methodsToTry.includes("headless")) {
          methodsToTry = ["headless", ...methodsToTry.filter((m) => m !== "headless")];
        }

        if (methodsToTry.length === 0) {
          this.fileLogger.warn(`[CookieRotationWorker] No rotation methods enabled for ${this.cookieId}`);
          return;
        }

        this.fileLogger.info(`[CookieRotationWorker] Attempting methods in order: ${methodsToTry.join(" → ")}`);

        // 5. Try each method until one succeeds
        let lastResult: RotationMethodResult | null = null;

        for (const methodName of methodsToTry) {
          const method = rotationMethodRegistry.get(methodName);
          if (!method) {
            this.fileLogger.warn(`[CookieRotationWorker] Method ${methodName} not found in registry`);
            continue;
          }

          this.fileLogger.info(`[CookieRotationWorker] Trying method: ${methodName}`);
          const result = await method.execute(cookies, {
            proxy: this.options.proxy,
            cookieId: this.cookieId,
            profileId: cookie.profileId,
          });

          lastResult = result;

          if (result.success) {
            this.fileLogger.info(`[CookieRotationWorker] ✅ Method ${methodName} succeeded in ${result.duration}ms`);

            // Update cookies in database
            if (result.updatedCookies) {
              const updatedCookieString = this.buildCookieString({
                ...cookies,
                ...result.updatedCookies,
              });
              await cookieRepository.update(this.cookieId, {
                rawCookieString: updatedCookieString,
                lastRotatedAt: new Date().toISOString(),
              });
            }

            // Update stats
            this.stats.rotations++;
            this.stats.lastRotation = new Date();
            this.stats.lastRotationDuration = Date.now() - cycleStartTime;
            this.stats.lastSuccessfulMethod = methodName;

            // Update monitoring table
            await this.updateMonitor(methodName, true, result);

            // Emit success event
            this.emit("rotationSuccess", result);

            return; // Success - exit early
          } else {
            this.fileLogger.warn(`[CookieRotationWorker] ⚠️ Method ${methodName} failed: ${result.error}`);
            this.emit("rotationError", result.error || "Unknown error");
          }
        }

        // All methods failed
        this.fileLogger.error(`[CookieRotationWorker] ❌ All rotation methods failed for ${this.cookieId}`);
        this.stats.rotationErrors++;

        if (lastResult) {
          await this.updateMonitor("unknown", false, lastResult);
        }

        this.emit("rotationError", "All rotation methods failed");
      } catch (error) {
        this.fileLogger.error(`[CookieRotationWorker] Rotation cycle error for ${this.cookieId}:`, error);
        this.stats.rotationErrors++;
        this.emit("rotationError", error instanceof Error ? error.message : "Unknown error");
      }
    }); // End of profileRotationCoordinator.executeRotation
  }

  /**
   * Update rotation monitoring table
   */
  private async updateMonitor(method: string, success: boolean, result: RotationMethodResult): Promise<void> {
    try {
      const db = await this.getWorkerSafeDatabase();
      const { CookieRotationMonitorRepository } = await import("../repository/cookie-rotation-monitor.repository.js");
      const monitorRepo = new CookieRotationMonitorRepository(db);

      // Record the rotation attempt with method-specific tracking
      await monitorRepo.recordRotationAttempt(this.cookieId, method as RotationMethodType, success, result.error);

      if (this.options.verbose) {
        this.fileLogger.debug(`[CookieRotationWorker] Monitor updated: method=${method}, success=${success}`);
      }
    } catch (error) {
      this.fileLogger.warn(`[CookieRotationWorker] Failed to update monitor:`, error);
    }
  }

  /**
   * Parse cookie string to CookieCollection
   */
  private parseCookieString(cookieString: string): CookieCollection {
    const cookies: Partial<CookieCollection> = {};
    const pairs = cookieString.split(";").map((p) => p.trim());
    for (const pair of pairs) {
      const [key, ...valueParts] = pair.split("=");
      if (key && valueParts.length > 0) {
        cookies[key.trim()] = valueParts.join("=").trim();
      }
    }
    return cookies as CookieCollection;
  }

  /**
   * Build cookie string from CookieCollection
   * Filters out metadata properties that should NOT be included as cookies
   */
  private buildCookieString(cookies: CookieCollection): string {
    // Metadata properties that should NOT be serialized as cookies
    const metadataKeys = new Set(["rawCookieString", "cookieString"]);

    return Object.entries(cookies)
      .filter(([key, _]) => !metadataKeys.has(key)) // Filter out metadata
      .map(([key, value]) => `${key}=${value}`)
      .join("; ");
  }

  /**
   * Log statistics
   */
  private logStats(): void {
    this.fileLogger.info("📊 Worker statistics:");
    this.fileLogger.info(`   • Rotations: ${this.stats.rotations} (${this.stats.rotationErrors} errors)`);
    if (this.stats.lastRotation) {
      this.fileLogger.info(`   • Last rotation: ${this.stats.lastRotation.toLocaleTimeString()}`);
    }
    if (this.stats.lastSuccessfulMethod) {
      this.fileLogger.info(`   • Last successful method: ${this.stats.lastSuccessfulMethod}`);
    }
  }

  /**
   * Get current statistics
   */
  getStats(): WorkerStats {
    return { ...this.stats };
  }

  /**
   * Check if worker is running
   */
  isWorkerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Force immediate rotation
   */
  async forceRotation(): Promise<void> {
    this.fileLogger.info(`[CookieRotationWorker] Forcing immediate rotation for ${this.cookieId}`);
    await this.runRotationCycle();
  }
}

// Legacy exports for backward compatibility
export async function createCookieRotationWorker(
  cookieId: string,
  options?: CookieRotationWorkerOptions
): Promise<CookieRotationWorker> {
  const worker = new CookieRotationWorker(cookieId, options);
  return worker;
}

export { type CookieRotationWorkerOptions as CookieRotationWorkerConfig };
