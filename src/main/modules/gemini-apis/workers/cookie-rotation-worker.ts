/**
 * Cookie Rotation Worker
 * Manages scheduled cookie rotation and refresh tasks with configurable intervals
 * Inspired by HanaokaYuzu/Gemini-API Python implementation
 *
 * Usage:
 *   const worker = new CookieRotationWorker(cookies, { rotationInterval: 540, refreshInterval: 120 });
 *   const control = worker.start();
 *   // ...later
 *   control.stop();
 */

import type {
  CookieCollection,
  RotationResult,
} from "../shared/types/index.js";
import { logger } from "../../../utils/logger-backend.js";
import {
  rotate1psidts,
  refreshCreds,
  startAutoRotation,
  type RotationControl,
} from "../helpers/cookie-rotation.helpers.js";

/**
 * Worker configuration options
 */
export interface CookieRotationWorkerConfig {
  // PSIDTS rotation interval in seconds (default: 540 = 9 minutes)
  // This is the session-sensitive cookie that refreshes Google's session
  rotationInterval?: number;

  // SIDCC/PSIDCC refresh interval in seconds (default: 120 = 2 minutes)
  // These are security cookies that need frequent refresh
  refreshInterval?: number;

  // Enable verbose logging
  verbose?: boolean;

  // HTTP proxy URL (optional)
  proxy?: string;

  // API key for refreshCreds (default: public Gemini API key)
  apiKey?: string;

  // Callbacks for monitoring rotation events
  onRotationStart?: () => void;
  onRotationSuccess?: (result: RotationResult) => void;
  onRotationError?: (error: string) => void;

  onRefreshStart?: () => void;
  onRefreshSuccess?: (
    result: RotationResult & { updatedCookies?: Record<string, string> }
  ) => void;
  onRefreshError?: (error: string) => void;

  onError?: (type: "PSIDTS" | "SIDCC", error: string) => void;
}

/**
 * Required worker configuration (all values filled)
 */
interface RequiredCookieRotationWorkerConfig {
  rotationInterval: number;
  refreshInterval: number;
  verbose: boolean;
  proxy?: string;
  apiKey: string;
  onRotationStart: (() => void) | undefined;
  onRotationSuccess: ((result: RotationResult) => void) | undefined;
  onRotationError: ((error: string) => void) | undefined;
  onRefreshStart: (() => void) | undefined;
  onRefreshSuccess:
    | ((
        result: RotationResult & { updatedCookies?: Record<string, string> }
      ) => void)
    | undefined;
  onRefreshError: ((error: string) => void) | undefined;
  onError: ((type: "PSIDTS" | "SIDCC", error: string) => void) | undefined;
}

/**
 * Worker control interface
 */
export interface CookieRotationWorkerControl {
  stop: () => void;
  isRunning: () => boolean;
  getStats: () => WorkerStats;
  forceRotation: () => Promise<void>;
  forceRefresh: () => Promise<void>;
}

/**
 * Worker statistics
 */
export interface WorkerStats {
  isRunning: boolean;
  rotations: number;
  refreshes: number;
  rotationErrors: number;
  refreshErrors: number;
  lastRotation?: Date;
  lastRefresh?: Date;
  lastRotationDuration?: number;
  lastRefreshDuration?: number;
}

/**
 * Cookie Rotation Worker
 * Manages scheduled cookie rotation and refresh tasks
 */
export class CookieRotationWorker {
  private cookies: CookieCollection;
  private config: Omit<
    RequiredCookieRotationWorkerConfig,
    | "onRotationStart"
    | "onRotationSuccess"
    | "onRotationError"
    | "onRefreshStart"
    | "onRefreshSuccess"
    | "onRefreshError"
    | "onError"
  > & {
    onRotationStart?: () => void;
    onRotationSuccess?: (result: RotationResult) => void;
    onRotationError?: (error: string) => void;
    onRefreshStart?: () => void;
    onRefreshSuccess?: (
      result: RotationResult & { updatedCookies?: Record<string, string> }
    ) => void;
    onRefreshError?: (error: string) => void;
    onError?: (type: "PSIDTS" | "SIDCC", error: string) => void;
  };
  private running = false;

  private rotationControl: RotationControl | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  // Statistics
  private stats: WorkerStats = {
    isRunning: false,
    rotations: 0,
    refreshes: 0,
    rotationErrors: 0,
    refreshErrors: 0,
  };

  constructor(
    cookies: CookieCollection,
    config: CookieRotationWorkerConfig = {}
  ) {
    this.cookies = cookies;
    this.config = {
      rotationInterval: config.rotationInterval ?? 540, // 9 minutes
      refreshInterval: config.refreshInterval ?? 120, // 2 minutes
      verbose: config.verbose ?? false,
      proxy: config.proxy,
      apiKey: config.apiKey ?? "AIzaSyBWW50ghQ5qHpMg1gxHV7U9t0wHE0qIUk4",
      onRotationStart: config.onRotationStart,
      onRotationSuccess: config.onRotationSuccess,
      onRotationError: config.onRotationError,
      onRefreshStart: config.onRefreshStart,
      onRefreshSuccess: config.onRefreshSuccess,
      onRefreshError: config.onRefreshError,
      onError: config.onError,
    };

    this.logConfig();
  }

  /**
   * Start the worker
   * Begins both rotation and refresh tasks
   */
  start(): CookieRotationWorkerControl {
    if (this.running) {
      logger.warn("⚠️ Worker is already running");
      return this.getControl();
    }

    this.running = true;
    this.stats.isRunning = true;

    logger.info("🚀 Starting cookie rotation worker...");

    // Start PSIDTS rotation
    this.startRotationTask();

    // Start SIDCC refresh
    this.startRefreshTask();

    logger.info(`✅ Worker started with intervals:`);
    logger.info(
      `   • PSIDTS rotation: ${
        this.config.rotationInterval
      }s (${this.formatInterval(this.config.rotationInterval)})`
    );
    logger.info(
      `   • SIDCC refresh: ${
        this.config.refreshInterval
      }s (${this.formatInterval(this.config.refreshInterval)})`
    );

    return this.getControl();
  }

  /**
   * Stop the worker
   */
  private stopInternal(): void {
    if (!this.running) return;

    this.running = false;
    this.stats.isRunning = false;

    // Stop rotation
    if (this.rotationControl) {
      this.rotationControl.stop();
      this.rotationControl = null;
    }

    // Stop refresh
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    logger.info("🛑 Worker stopped");
    this.logStats();
  }

  /**
   * Start rotation task
   */
  private startRotationTask(): void {
    this.rotationControl = startAutoRotation(
      this.cookies,
      this.config.rotationInterval,
      {
        proxy: this.config.proxy,
        onRotate: (result: RotationResult) => {
          if (result.success) {
            this.stats.rotations++;
            this.stats.lastRotation = new Date();

            if (this.config.verbose) {
              logger.debug(`✅ PSIDTS rotation successful`);
            }

            this.config.onRotationSuccess?.(result);
          } else {
            this.stats.rotationErrors++;
            logger.warn(`⚠️ PSIDTS rotation failed: ${result.error}`);

            this.config.onRotationError?.(result.error || "Unknown error");
            this.config.onError?.("PSIDTS", result.error || "Unknown error");
          }
        },
      }
    );
  }

  /**
   * Start refresh task
   */
  private startRefreshTask(): void {
    // NOTE: refreshCreds endpoint from Google appears to not provide useful cookie updates
    // The RotateCookies endpoint is sufficient for maintaining the session
    // We keep this task for compatibility but it's mostly a no-op
    const refreshLoop = async () => {
      if (!this.running) return;

      this.config.onRefreshStart?.();

      const startTime = Date.now();

      try {
        const result = await refreshCreds(this.cookies, {
          apiKey: this.config.apiKey,
          proxy: this.config.proxy,
        });

        const duration = Date.now() - startTime;
        this.stats.lastRefreshDuration = duration;

        if (result.success) {
          this.stats.refreshes++;
          this.stats.lastRefresh = new Date();

          // Update cookies if any were returned
          if (
            result.updatedCookies &&
            Object.keys(result.updatedCookies).length > 0
          ) {
            Object.assign(this.cookies, result.updatedCookies);
          }

          if (this.config.verbose) {
            logger.debug(`✅ SIDCC refresh completed (${duration}ms)`);
          }

          this.config.onRefreshSuccess?.(result);
        } else {
          // Don't count as error since refreshCreds doesn't provide useful updates
          // Just log debug info
          if (this.config.verbose) {
            logger.debug(
              `ⓘ SIDCC refresh: ${result.error} (${duration}ms) - this is expected behavior`
            );
          }

          this.config.onRefreshSuccess?.(result);
        }
      } catch (error) {
        this.stats.refreshErrors++;
        const message =
          error instanceof Error ? error.message : "Unknown error";
        logger.debug(`ⓘ SIDCC refresh error (expected): ${message}`);

        this.config.onRefreshError?.(message);
      }

      // Schedule next refresh
      if (this.running) {
        this.refreshTimer = setTimeout(
          refreshLoop,
          this.config.refreshInterval * 1000
        );
      }
    };

    // Start first refresh with slight delay
    this.refreshTimer = setTimeout(refreshLoop, 1000);
  }

  /**
   * Force immediate rotation
   */
  async forceRotation(): Promise<void> {
    logger.info("🔄 Forcing immediate PSIDTS rotation...");

    try {
      const result = await rotate1psidts(this.cookies, {
        proxy: this.config.proxy,
        skipCache: true,
      });

      if (result.success) {
        // If we got a new PSIDTS value, update it
        if (result.newPSIDTS) {
          this.cookies["__Secure-1PSIDTS"] = result.newPSIDTS;
        }

        this.stats.rotations++;
        this.stats.lastRotation = new Date();

        logger.info("✅ Force rotation successful");
        this.config.onRotationSuccess?.(result);
      } else {
        logger.warn(`⚠️ Force rotation failed: ${result.error}`);
        this.config.onRotationError?.(result.error || "Unknown error");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error(`💥 Force rotation error: ${message}`);
      this.config.onRotationError?.(message);
    }
  }

  /**
   * Force immediate refresh
   */
  async forceRefresh(): Promise<void> {
    logger.info("🔄 Forcing immediate SIDCC refresh...");

    const startTime = Date.now();

    try {
      const result = await refreshCreds(this.cookies, {
        apiKey: this.config.apiKey,
        proxy: this.config.proxy,
        skipCache: true,
      });

      const duration = Date.now() - startTime;
      this.stats.lastRefreshDuration = duration;

      // refreshCreds endpoint doesn't return useful cookies,
      // but if it returns 200, consider it a success
      if (result.success || (result.status === 200 && !result.error)) {
        if (result.updatedCookies) {
          Object.assign(this.cookies, result.updatedCookies);
        }

        this.stats.refreshes++;
        this.stats.lastRefresh = new Date();

        logger.info(`✅ Force refresh completed (${duration}ms)`);
        this.config.onRefreshSuccess?.(result);
      } else {
        logger.debug(
          `ⓘ Force refresh: ${result.error} (${duration}ms) - expected behavior`
        );
        this.config.onRefreshSuccess?.(result);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.debug(`ⓘ Force refresh error (expected): ${message}`);
      this.config.onRefreshError?.(message);
    }
  }

  /**
   * Get control interface
   */
  private getControl(): CookieRotationWorkerControl {
    return {
      stop: () => this.stopInternal(),
      isRunning: () => this.running,
      getStats: () => ({ ...this.stats }),
      forceRotation: () => this.forceRotation(),
      forceRefresh: () => this.forceRefresh(),
    };
  }

  /**
   * Log configuration
   */
  private logConfig(): void {
    if (this.config.verbose) {
      logger.debug("🔧 Worker configuration:");
      logger.debug(`   • rotationInterval: ${this.config.rotationInterval}s`);
      logger.debug(`   • refreshInterval: ${this.config.refreshInterval}s`);
      logger.debug(`   • proxy: ${this.config.proxy || "none"}`);
    }
  }

  /**
   * Log statistics
   */
  private logStats(): void {
    logger.info("📊 Worker statistics:");
    logger.info(
      `   • Rotations: ${this.stats.rotations} (${this.stats.rotationErrors} errors)`
    );
    logger.info(
      `   • Refreshes: ${this.stats.refreshes} (${this.stats.refreshErrors} errors)`
    );

    if (this.stats.lastRotation) {
      logger.info(
        `   • Last rotation: ${this.stats.lastRotation.toLocaleTimeString()}`
      );
    }

    if (this.stats.lastRefresh) {
      logger.info(
        `   • Last refresh: ${this.stats.lastRefresh.toLocaleTimeString()}`
      );
    }
  }

  /**
   * Format interval to human readable string
   */
  private formatInterval(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor(
      (seconds % 3600) / 60
    )}m`;
  }

  /**
   * Get current statistics
   */
  getStats(): WorkerStats {
    return { ...this.stats };
  }

  /**
   * Get current cookies
   */
  getCookies(): CookieCollection {
    return { ...this.cookies };
  }

  /**
   * Update cookies
   */
  updateCookies(newCookies: Partial<CookieCollection>): void {
    Object.assign(this.cookies, newCookies);

    if (this.config.verbose) {
      logger.debug(`🔄 Cookies updated: ${Object.keys(newCookies).join(", ")}`);
    }
  }

  /**
   * Update configuration
   * Note: Changes take effect on next cycle
   */
  updateConfig(newConfig: Partial<CookieRotationWorkerConfig>): void {
    if (newConfig.rotationInterval !== undefined) {
      this.config.rotationInterval = newConfig.rotationInterval;
    }

    if (newConfig.refreshInterval !== undefined) {
      this.config.refreshInterval = newConfig.refreshInterval;
    }

    if (newConfig.verbose !== undefined) {
      this.config.verbose = newConfig.verbose;
    }

    if (newConfig.apiKey !== undefined) {
      this.config.apiKey = newConfig.apiKey;
    }

    if (this.config.verbose) {
      logger.debug("🔧 Worker configuration updated");
    }
  }
}

// Re-export startAutoRotation from cookie-rotation.service for use within this module
// Note: startAutoRotation is called from startRotationTask()
export { startAutoRotation };
export async function createCookieRotationWorker(
  cookies: CookieCollection,
  config?: CookieRotationWorkerConfig
): Promise<CookieRotationWorker> {
  const worker = new CookieRotationWorker(cookies, config);
  return worker;
}

/**
 * Pre-configured worker with default intervals
 * Suitable for always-on services
 */
export function createDefaultWorker(
  cookies: CookieCollection,
  proxy?: string
): CookieRotationWorker {
  return new CookieRotationWorker(cookies, {
    rotationInterval: 540, // 9 minutes (Python repo: auto_refresh_interval_minutes = 9)
    refreshInterval: 120, // 2 minutes (Python repo: refresh request every ~2min)
    verbose: false,
    proxy,
  });
}

/**
 * Pre-configured aggressive worker for high-traffic services
 * Rotates more frequently to maintain fresh sessions
 */
export function createAggressiveWorker(
  cookies: CookieCollection,
  proxy?: string
): CookieRotationWorker {
  return new CookieRotationWorker(cookies, {
    rotationInterval: 300, // 5 minutes
    refreshInterval: 60, // 1 minute
    verbose: false,
    proxy,
  });
}

/**
 * Pre-configured conservative worker for low-traffic services
 * Reduces rotation frequency to minimize server hits
 */
export function createConservativeWorker(
  cookies: CookieCollection,
  proxy?: string
): CookieRotationWorker {
  return new CookieRotationWorker(cookies, {
    rotationInterval: 900, // 15 minutes
    refreshInterval: 180, // 3 minutes
    verbose: false,
    proxy,
  });
}
