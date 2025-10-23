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

import type { CookieCollection, RotationResult } from "../shared/types/index.js";
import { logger } from "../../../utils/logger-backend.js";
import { rotate1psidts, startAutoRotation, type RotationControl } from "../helpers/cookie-rotation/cookie-rotation.helpers.js";

/**
 * Worker configuration options
 */
export interface CookieRotationWorkerConfig {
  // PSIDTS rotation interval in seconds (default: 540 = 9 minutes)
  // This is the session-sensitive cookie that refreshes Google's session
  rotationInterval?: number;

  // Enable verbose logging
  verbose?: boolean;

  // HTTP proxy URL (optional)
  proxy?: string;

  // Callbacks for monitoring rotation events
  onRotationStart?: () => void;
  onRotationSuccess?: (result: RotationResult) => void;
  onRotationError?: (error: string) => void;

  onError?: (type: "PSIDTS", error: string) => void;
}

/**
 * Required worker configuration (all values filled)
 */
interface RequiredCookieRotationWorkerConfig {
  rotationInterval: number;
  verbose: boolean;
  proxy?: string;
  onRotationStart: (() => void) | undefined;
  onRotationSuccess: ((result: RotationResult) => void) | undefined;
  onRotationError: ((error: string) => void) | undefined;
  onError: ((type: "PSIDTS", error: string) => void) | undefined;
}

/**
 * Worker control interface
 */
export interface CookieRotationWorkerControl {
  stop: () => void;
  isRunning: () => boolean;
  getStats: () => WorkerStats;
  forceRotation: () => Promise<void>;
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
}

/**
 * Cookie Rotation Worker
 * Manages scheduled cookie rotation and refresh tasks
 */
export class CookieRotationWorker {
  private cookies: CookieCollection;
  private config: Omit<
    RequiredCookieRotationWorkerConfig,
    "onRotationStart" | "onRotationSuccess" | "onRotationError" | "onError"
  > & {
    onRotationStart?: () => void;
    onRotationSuccess?: (result: RotationResult) => void;
    onRotationError?: (error: string) => void;
    onError?: (type: "PSIDTS", error: string) => void;
  };
  private running = false;

  private rotationControl: RotationControl | null = null;

  // Statistics
  private stats: WorkerStats = {
    isRunning: false,
    rotations: 0,
    rotationErrors: 0,
  };

  constructor(cookies: CookieCollection, config: CookieRotationWorkerConfig = {}) {
    this.cookies = cookies;
    this.config = {
      rotationInterval: config.rotationInterval ?? 540, // 9 minutes
      verbose: config.verbose ?? false,
      proxy: config.proxy,
      onRotationStart: config.onRotationStart,
      onRotationSuccess: config.onRotationSuccess,
      onRotationError: config.onRotationError,
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

    logger.info(`✅ Worker started with interval:`);
    logger.info(`   • PSIDTS rotation: ${this.config.rotationInterval}s (${this.formatInterval(this.config.rotationInterval)})`);

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

    logger.info("🛑 Worker stopped");
    this.logStats();
  }

  /**
   * Start rotation task
   */
  private startRotationTask(): void {
    this.rotationControl = startAutoRotation(this.cookies, this.config.rotationInterval, {
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
    });
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
   * Get control interface
   */
  private getControl(): CookieRotationWorkerControl {
    return {
      stop: () => this.stopInternal(),
      isRunning: () => this.running,
      getStats: () => ({ ...this.stats }),
      forceRotation: () => this.forceRotation(),
    };
  }

  /**
   * Log configuration
   */
  private logConfig(): void {
    if (this.config.verbose) {
      logger.debug("🔧 Worker configuration:");
      logger.debug(`   • rotationInterval: ${this.config.rotationInterval}s`);
      logger.debug(`   • proxy: ${this.config.proxy || "none"}`);
    }
  }

  /**
   * Log statistics
   */
  private logStats(): void {
    logger.info("📊 Worker statistics:");
    logger.info(`   • Rotations: ${this.stats.rotations} (${this.stats.rotationErrors} errors)`);

    if (this.stats.lastRotation) {
      logger.info(`   • Last rotation: ${this.stats.lastRotation.toLocaleTimeString()}`);
    }
  }

  /**
   * Format interval to human readable string
   */
  private formatInterval(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
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

    if (newConfig.verbose !== undefined) {
      this.config.verbose = newConfig.verbose;
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
export function createDefaultWorker(cookies: CookieCollection, proxy?: string): CookieRotationWorker {
  return new CookieRotationWorker(cookies, {
    rotationInterval: 540, // 9 minutes (Python repo: auto_refresh_interval_minutes = 9)
    verbose: false,
    proxy,
  });
}

/**
 * Pre-configured aggressive worker for high-traffic services
 * Rotates more frequently to maintain fresh sessions
 */
export function createAggressiveWorker(cookies: CookieCollection, proxy?: string): CookieRotationWorker {
  return new CookieRotationWorker(cookies, {
    rotationInterval: 300, // 5 minutes
    verbose: false,
    proxy,
  });
}

/**
 * Pre-configured conservative worker for low-traffic services
 * Reduces rotation frequency to minimize server hits
 */
export function createConservativeWorker(cookies: CookieCollection, proxy?: string): CookieRotationWorker {
  return new CookieRotationWorker(cookies, {
    rotationInterval: 900, // 15 minutes
    verbose: false,
    proxy,
  });
}
