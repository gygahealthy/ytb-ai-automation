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
    this.fileLogger = new WorkerFileLogger(cookieId, options?.service, options?.profileId);
    this.options = {
      performInitialRefresh: false,
      verbose: false,
      ...options,
    };

    if (this.options.verbose) {
      this.fileLogger.debug(`[CookieRotationWorker] Created for cookie ${cookieId}`);
    }
    // Also log to main logger if available
    try {
      logger.debug(`[CookieRotationWorker] Created for cookie ${cookieId}`);
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
    this.fileLogger.info(`[CookieRotationWorker] Starting worker for cookie ${this.cookieId}`);

    // Phase 2: Perform initial refresh if requested (startup scenario)
    if (this.options.performInitialRefresh) {
      this.fileLogger.info(`[CookieRotationWorker] Performing initial headless refresh for ${this.cookieId}`);
      await this.runRotationCycle({ forceHeadless: true });
    }

    // Fetch config to set up recurring interval
    const config = await cookieRotationConfigService.getCookieConfig(this.cookieId);
    if (!config) {
      this.fileLogger.error(`[CookieRotationWorker] No config found for cookie ${this.cookieId}`);
      this.isRunning = false;
      this.stats.isRunning = false;
      return;
    }

    const intervalMs = config.rotationIntervalMinutes * 60 * 1000;
    this.timer = setInterval(() => this.runRotationCycle(), intervalMs);

    this.fileLogger.info(`[CookieRotationWorker] Scheduled rotation every ${config.rotationIntervalMinutes} minutes`);
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
    this.fileLogger.info(`[CookieRotationWorker] Stopped worker for cookie ${this.cookieId}`);

    if (this.options.verbose) {
      this.logStats();
    }

    // Close the file logger
    this.fileLogger.close();
  }

  /**
   * Run a rotation cycle (Phase 1 - Config-Driven)
   * Fetches config, determines method order, executes methods in sequence
   */
  private async runRotationCycle(options?: { forceHeadless?: boolean }): Promise<void> {
    this.fileLogger.info(`[CookieRotationWorker] Running rotation cycle for ${this.cookieId}`);
    const cycleStartTime = Date.now();

    try {
      // 1. Fetch current config
      const config = await cookieRotationConfigService.getCookieConfig(this.cookieId);
      if (!config) {
        this.fileLogger.error(`[CookieRotationWorker] Config not found for ${this.cookieId}`);
        return;
      }

      // 2. Fetch current cookie data
      const { database } = await import("../../../../storage/database.js");
      const db = database.getSQLiteDatabase();
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
  }

  /**
   * Update rotation monitoring table
   */
  private async updateMonitor(method: string, success: boolean, result: RotationMethodResult): Promise<void> {
    try {
      const { database } = await import("../../../../storage/database.js");
      const db = database.getSQLiteDatabase();
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
   */
  private buildCookieString(cookies: CookieCollection): string {
    return Object.entries(cookies)
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
