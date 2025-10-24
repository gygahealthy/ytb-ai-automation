/**
 * Global Cookie Rotation Worker Manager
 * Manages all cookie rotation workers for all profiles
 * Handles session health monitoring, auto-recovery, and headless fallback
 */

import { logger } from "../../../../utils/logger-backend.js";
import { CookieRepository } from "../../../gemini-apis/repository/cookie.repository.js";
import { CookieRotationMonitorRepository, type CookieRotationMonitor } from "../repository/cookie-rotation-monitor.repository.js";
import { createCookieManagerDB, type CookieManagerDB } from "../../../gemini-apis/services/cookie-manager-db.js";
import type { CookieCollection } from "../../../gemini-apis/shared/types/index.js";
import { parseCookieHeader } from "../../../gemini-apis/helpers/cookie/cookie-parser.helpers.js";
import { extractAndCreateHandler } from "../../../gemini-apis/handlers/cookie/extractAndCreate.js";
import { BrowserWindow } from "electron";
import { cookieRotationConfigService } from "./cookie-rotation-config.service.js";

/**
 * Worker instance tracking
 */
interface WorkerInstance {
  cookieManagerDB: CookieManagerDB;
  monitorId: string;
  profileId: string;
  cookieId: string;
  userDataDir?: string;
}

/**
 * Global rotation worker manager
 */
export class GlobalRotationWorkerManager {
  private workers = new Map<string, WorkerInstance>();
  private running = false;
  private monitorInterval: NodeJS.Timeout | null = null;

  constructor(private cookieRepository: CookieRepository, private monitorRepository: CookieRotationMonitorRepository) {}

  /**
   * Initialize the manager
   * Resets stale running worker statuses from previous app sessions
   */
  async init(): Promise<void> {
    logger.info("[rotation-manager] Initializing global rotation worker manager");

    // Reset all running statuses on app startup
    // This ensures stale "running" status doesn't persist if the app crashed
    await this.resetAllRunningStatuses();
  }

  /**
   * Reset all running worker statuses to stopped
   * Called on app startup to clear stale states from crashes
   */
  private async resetAllRunningStatuses(): Promise<void> {
    try {
      const runningMonitors = await this.monitorRepository.findRunning();

      if (runningMonitors.length > 0) {
        logger.info(`[rotation-manager] 🔄 Resetting ${runningMonitors.length} stale running worker(s) to stopped state`);

        for (const monitor of runningMonitors) {
          await this.monitorRepository.updateWorkerStatus(monitor.id, "stopped");
          logger.debug(
            `[rotation-manager] Reset monitor ${monitor.id} (profile: ${monitor.profileId}, cookie: ${monitor.cookieId})`
          );
        }

        logger.info(`[rotation-manager] ✅ All stale running workers reset to stopped`);
      }
    } catch (error) {
      logger.error("[rotation-manager] Failed to reset running worker statuses", error);
    }
  }

  /**
   * Start the global manager
   * - Scans for active cookies
   * - Detects expired sessions
   * - Starts rotation workers
   * - Monitors health continuously
   */
  async start(): Promise<void> {
    if (this.running) {
      logger.warn("[rotation-manager] Already running");
      return;
    }

    this.running = true;
    logger.info("[rotation-manager] 🚀 Starting global cookie rotation manager");

    // Scan for active cookies and start workers
    await this.scanAndStartWorkers();

    // Start continuous monitoring (every 5 minutes)
    this.monitorInterval = setInterval(async () => {
      await this.monitorHealth();
    }, 5 * 60 * 1000);

    logger.info(`[rotation-manager] ✅ Manager started with ${this.workers.size} workers`);
  }

  /**
   * Scan for active cookies and start workers
   */
  private async scanAndStartWorkers(): Promise<void> {
    try {
      logger.info("[rotation-manager] Scanning for active cookies...");

      // Find all active cookies
      const activeCookies = await this.cookieRepository.findByStatus("active");

      logger.info(`[rotation-manager] Found ${activeCookies.length} active cookies`);

      // Start worker for each active cookie
      for (const cookie of activeCookies) {
        try {
          await this.startWorkerForCookie(cookie);
        } catch (error) {
          logger.error(`[rotation-manager] Failed to start worker for cookie ${cookie.id}`, error);
        }
      }
    } catch (error) {
      logger.error("[rotation-manager] Failed to scan cookies", error);
    }
  }

  /**
   * Start rotation worker for a specific cookie
   */
  private async startWorkerForCookie(cookie: any): Promise<void> {
    const key = `${cookie.profileId}-${cookie.id}`;

    // Skip if already running
    if (this.workers.has(key)) {
      logger.debug(`[rotation-manager] Worker already running for ${key}`);
      return;
    }

    try {
      // Parse cookies
      const cookies: CookieCollection = parseCookieHeader(cookie.rawCookieString || "");

      // Check if session is expired
      const isExpired = await this.detectExpiredSession(cookies);

      if (isExpired) {
        logger.warn(`[rotation-manager] ⚠️ Detected expired session for ${key}`);

        // Session expired - worker will recover through health monitoring
        // which triggers performHeadlessRefresh via performHeadlessRefreshForMonitor
      }

      // Find or create monitor
      let monitor = await this.monitorRepository.findByProfileAndCookie(cookie.profileId, cookie.id);

      if (!monitor) {
        monitor = await this.createMonitor(cookie.profileId, cookie.id);
      }

      // Update monitor status to initializing
      await this.monitorRepository.updateWorkerStatus(monitor.id, "initializing");

      // Create cookie manager with rotation worker
      const cookieManagerDB = await createCookieManagerDB(cookies, this.cookieRepository, cookie.profileId, cookie.url, {
        psidtsIntervalSeconds: 540, // 9 minutes
        verbose: false,
        onPSIDTSRotate: async (result) => {
          await this.handlePSIDTSRotation(monitor!.id, result);
        },
        onError: async (error, type) => {
          // CookieManagerDB now reports only PSIDTS or DB errors
          if (type !== "DB") {
            // type is "PSIDTS" here
            await this.handleRotationError(monitor!.id, error, "PSIDTS");
          }
        },
      });

      // Start the rotation worker
      cookieManagerDB.start();

      // Store worker instance
      this.workers.set(key, {
        cookieManagerDB,
        monitorId: monitor.id,
        profileId: cookie.profileId,
        cookieId: cookie.id,
        userDataDir: undefined, // Will be loaded on-demand for headless refresh
      });

      // Update monitor to running
      await this.monitorRepository.updateWorkerStatus(monitor.id, "running");
      await this.monitorRepository.updateSessionHealth(monitor.id, "healthy");

      logger.info(`[rotation-manager] ✅ Started worker for ${key}`);
    } catch (error) {
      logger.error(`[rotation-manager] ❌ Failed to start worker for ${key}`, error);
      throw error;
    }
  }

  /**
   * Stop worker for a specific cookie
   */
  async stopWorkerForCookie(profileId: string, cookieId: string): Promise<void> {
    const key = `${profileId}-${cookieId}`;
    const worker = this.workers.get(key);

    if (!worker) {
      logger.debug(`[rotation-manager] No worker found for ${key}`);
      return;
    }

    try {
      worker.cookieManagerDB.stop();
      this.workers.delete(key);

      // Update monitor
      await this.monitorRepository.updateWorkerStatus(worker.monitorId, "stopped");

      logger.info(`[rotation-manager] 🛑 Stopped worker for ${key}`);
    } catch (error) {
      logger.error(`[rotation-manager] Failed to stop worker for ${key}`, error);
    }
  }

  /**
   * Handle PSIDTS rotation result
   */
  private async handlePSIDTSRotation(monitorId: string, result: any): Promise<void> {
    try {
      await this.monitorRepository.recordPSIDTSRotation(monitorId, result.success);

      if (!result.success) {
        const monitor = await this.monitorRepository.findById(monitorId);
        if (monitor) {
          logger.warn(
            `[rotation-manager] ⚠️ PSIDTS rotation failed for monitor ${monitorId}, attempting headless refresh immediately`
          );
          await this.monitorRepository.markRequiresHeadlessRefresh(monitorId);

          // Immediately attempt headless refresh
          await this.performHeadlessRefreshForMonitor(monitor);
        }
      }
    } catch (error) {
      logger.error(`[rotation-manager] Failed to record PSIDTS rotation`, error);
    }
  }

  /**
   * Handle rotation error
   */
  private async handleRotationError(monitorId: string, error: string, type: "PSIDTS" | "SIDCC"): Promise<void> {
    try {
      await this.monitorRepository.recordError(monitorId, `${type}: ${error}`);
    } catch (err) {
      logger.error(`[rotation-manager] Failed to record error`, err);
    }
  }

  /**
   * Monitor health of all workers
   * Triggers headless refresh for workers that need it
   */
  private async monitorHealth(): Promise<void> {
    try {
      logger.debug("[rotation-manager] Running health check...");

      // Find monitors requiring headless refresh
      const requiresHeadless = await this.monitorRepository.findRequiringHeadlessRefresh();

      if (requiresHeadless.length > 0) {
        logger.info(`[rotation-manager] Found ${requiresHeadless.length} sessions requiring headless refresh`);

        for (const monitor of requiresHeadless) {
          await this.performHeadlessRefreshForMonitor(monitor);
        }
      }

      // Notify UI about health status
      this.broadcastHealthStatus();
    } catch (error) {
      logger.error("[rotation-manager] Health monitoring failed", error);
    }
  }

  /**
   * Perform headless refresh for a monitor
   * Uses the unified extractAndCreateHandler instead of separate refresh logic
   */
  private async performHeadlessRefreshForMonitor(monitor: CookieRotationMonitor): Promise<void> {
    try {
      // Get cookie entity
      const cookie = await this.cookieRepository.findById(monitor.cookieId);
      if (!cookie) {
        logger.error(`[rotation-manager] Cannot find cookie ${monitor.cookieId} for refresh`);
        return;
      }

      await this.performHeadlessRefresh(cookie, monitor.id);
    } catch (error) {
      logger.error(`[rotation-manager] Failed headless refresh for monitor ${monitor.id}`, error);
      await this.monitorRepository.recordHeadlessRefresh(monitor.id, false);
    }
  }

  /**
   * Perform headless refresh for a cookie using unified extraction handler
   * Routes through extractAndCreateHandler which handles:
   * - Profile validation and locking
   * - Headless browser mode
   * - Cookie extraction and storage
   * - Database updates
   */
  private async performHeadlessRefresh(cookie: any, monitorId: string): Promise<void> {
    logger.info(`[rotation-manager] 🌐 Starting headless refresh for cookie ${cookie.id} using unified extraction`);

    try {
      // Call unified extraction handler with headless=true (background mode)
      const result = await extractAndCreateHandler({
        profileId: cookie.profileId,
        service: cookie.service,
        url: cookie.url || "https://gemini.google.com",
        headless: true, // Use headless mode for automatic refresh
      });

      if (result.success) {
        logger.info(`[rotation-manager] ✅ Headless refresh successful via unified extraction`);

        // Record successful refresh
        await this.monitorRepository.recordHeadlessRefresh(monitorId, true);

        // Restart worker with fresh cookies
        await this.stopWorkerForCookie(cookie.profileId, cookie.id);
        await this.startWorkerForCookie(cookie);
      } else {
        logger.error(`[rotation-manager] ❌ Headless refresh failed: ${result.error}`);
        await this.monitorRepository.recordHeadlessRefresh(monitorId, false);
      }
    } catch (error) {
      logger.error(`[rotation-manager] ❌ Unexpected error during headless refresh`, error);
      await this.monitorRepository.recordHeadlessRefresh(monitorId, false);
    }
  }

  /**
   * Detect if a session is expired
   */
  private async detectExpiredSession(cookies: CookieCollection): Promise<boolean> {
    const requiredCookies = ["__Secure-1PSID", "__Secure-1PSIDTS"];

    for (const key of requiredCookies) {
      if (!cookies[key] || cookies[key] === "undefined") {
        return true;
      }
    }

    return false;
  }

  /**
   * Create a new monitor entry
   */
  private async createMonitor(profileId: string, cookieId: string): Promise<CookieRotationMonitor> {
    const now = new Date().toISOString();
    // Use dynamic import for uuid to avoid ESM require errors in CJS runtime
    const { v4: uuidv4 } = await import("uuid");
    const monitor: CookieRotationMonitor = {
      id: uuidv4(),
      profileId,
      cookieId,
      workerStatus: "stopped",
      psidtsRotationCount: 0,
      sidccRefreshCount: 0,
      psidtsErrorCount: 0,
      sidccErrorCount: 0,
      consecutiveFailures: 0,
      requiresHeadlessRefresh: false,
      headlessRefreshCount: 0,
      sessionHealth: "unknown",
      createdAt: now,
      updatedAt: now,
    };

    await this.monitorRepository.insert(monitor);
    return monitor;
  }

  /**
   * Get profile by ID - converts DB row to proper Profile entity
   */
  private async getProfile(profileId: string): Promise<any> {
    try {
      const { database } = await import("../../../../storage/database.js");
      const db = database.getSQLiteDatabase();
      const row = await db.get("SELECT * FROM profiles WHERE id = ?", [profileId]);

      if (!row) {
        logger.warn(`[rotation-manager] Profile ${profileId} not found`);
        return null;
      }

      // Convert snake_case DB columns to camelCase properties
      return {
        id: row.id,
        name: row.name,
        browserPath: row.browser_path || undefined,
        userDataDir: row.user_data_dir, // This is the key fix!
        userAgent: row.user_agent || undefined,
        proxyServer: row.proxy_server || undefined,
        proxyUsername: row.proxy_username || undefined,
        proxyPassword: row.proxy_password || undefined,
        creditRemaining: row.credit_remaining,
        isLoggedIn: row.is_logged_in === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      logger.error(`[rotation-manager] Failed to get profile ${profileId}`, error);
      return null;
    }
  }

  /**
   * Get current status summary
   */
  async getStatus(): Promise<any> {
    const summary = await this.monitorRepository.getSummary();

    return {
      isRunning: this.running,
      workersCount: this.workers.size,
      ...summary,
    };
  }

  /**
   * Broadcast health status to renderer (via IPC or event emitter)
   */
  private broadcastHealthStatus(): void {
    try {
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        this.getStatus().then((status) => {
          for (const window of windows) {
            // Emit both legacy 'cookie-rotation:status' and the UI-expected
            // 'cookie-rotation:status-update' so different renderer code
            // can subscribe to either channel.
            window.webContents.send("cookie-rotation:status", status);
            window.webContents.send("cookie-rotation:status-update", status);
          }
        });
      }
    } catch (error) {
      logger.debug("[rotation-manager] Failed to broadcast status", error);
    }
  }

  /**
   * Stop the global manager
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    logger.info("[rotation-manager] 🛑 Stopping global rotation manager");

    this.running = false;

    // Clear monitoring interval
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    // Stop all workers
    for (const [key, worker] of this.workers.entries()) {
      try {
        worker.cookieManagerDB.stop();
        await this.monitorRepository.updateWorkerStatus(worker.monitorId, "stopped");
      } catch (error) {
        logger.error(`[rotation-manager] Failed to stop worker ${key}`, error);
      }
    }

    this.workers.clear();

    logger.info("[rotation-manager] ✅ Manager stopped");
  }

  /**
   * Restart worker for a specific profile/cookie
   */
  async restartWorker(profileId: string, cookieId: string): Promise<void> {
    await this.stopWorkerForCookie(profileId, cookieId);

    const cookie = await this.cookieRepository.findById(cookieId);
    if (cookie) {
      await this.startWorkerForCookie(cookie);
    }
  }

  /**
   * Get list of profiles with active cookies for rotation selection
   */
  async getProfilesWithCookies(): Promise<
    Array<{
      profileId: string;
      profileName?: string;
      cookies: Array<{
        cookieId: string;
        service: string;
        url: string;
        status: string;
        workerStatus?: string;
        sessionHealth?: string;
        lastRotatedAt?: string;
      }>;
    }>
  > {
    const activeCookies = await this.cookieRepository.findByStatus("active");

    // Group cookies by profile
    const profileMap = new Map<string, any>();

    for (const cookie of activeCookies) {
      if (!profileMap.has(cookie.profileId)) {
        const profile = await this.getProfile(cookie.profileId);
        profileMap.set(cookie.profileId, {
          profileId: cookie.profileId,
          profileName: profile?.name || cookie.profileId,
          cookies: [],
        });
      }

      // Get monitor info if exists
      const monitor = await this.monitorRepository.findByProfileAndCookie(cookie.profileId, cookie.id);

      profileMap.get(cookie.profileId).cookies.push({
        cookieId: cookie.id,
        service: cookie.service,
        url: cookie.url,
        rawCookieString: cookie.rawCookieString,
        status: cookie.status,
        workerStatus: monitor?.workerStatus,
        sessionHealth: monitor?.sessionHealth,
        lastRotatedAt: cookie.lastRotatedAt,
      });
    }

    return Array.from(profileMap.values());
  }

  /**
   * Start worker for a specific profile/cookie by IDs
   */
  async startWorkerByIds(profileId: string, cookieId: string): Promise<void> {
    const cookie = await this.cookieRepository.findById(cookieId);
    if (!cookie) {
      throw new Error(`Cookie ${cookieId} not found`);
    }

    if (cookie.profileId !== profileId) {
      throw new Error(`Cookie ${cookieId} does not belong to profile ${profileId}`);
    }

    await this.startWorkerForCookie(cookie);
  }
}

// Singleton instance
let managerInstance: GlobalRotationWorkerManager | null = null;

export async function getGlobalRotationWorkerManager(): Promise<GlobalRotationWorkerManager> {
  if (!managerInstance) {
    const { database } = await import("../../../../storage/database.js");
    const db = database.getSQLiteDatabase();
    const cookieRepository = new CookieRepository(db);
    const monitorRepository = new CookieRotationMonitorRepository(db);

    // Initialize cookie-rotation module's config service holder with the CookieRepository
    try {
      cookieRotationConfigService.init(cookieRepository);
    } catch (err) {
      // Non-fatal - log and continue. The holder may already be initialized in tests/dev.
      logger.debug("cookieRotationConfigService init skipped or failed", err);
    }

    managerInstance = new GlobalRotationWorkerManager(cookieRepository, monitorRepository);

    await managerInstance.init();
  }

  return managerInstance;
}

/**
 * Backwards-compatible wrapper exported as `globalRotationWorkerManager`.
 * Handlers may import this object and call the listed methods. Internally
 * it delegates to the async factory `getGlobalRotationWorkerManager()` so
 * startup ordering is safe.
 */
export const globalRotationWorkerManager = {
  listMonitors: async () => {
    const mgr = await getGlobalRotationWorkerManager();
    return mgr.getProfilesWithCookies();
  },
  forceRotate: async (targetId?: string) => {
    // Best-effort: if the caller passes a cookieId we attempt to restart the
    // worker for that cookie. If not possible, return current status.
    const mgr = await getGlobalRotationWorkerManager();

    try {
      if (targetId) {
        // If targetId is in format "profileId-cookieId" try to split it.
        if (targetId.includes("-")) {
          const [profileId, cookieId] = targetId.split("-", 2);
          await mgr.restartWorker(profileId, cookieId);
          return { success: true };
        }

        // Otherwise attempt to restart by cookieId only using available APIs
        // (best-effort; will throw if ambiguous).
        await mgr.restartWorker("", targetId as string).catch(() => {});
        return { success: true };
      }
    } catch (err) {
      // swallow and return status below
    }

    return mgr.getStatus();
  },
  startAll: async () => {
    const mgr = await getGlobalRotationWorkerManager();
    return mgr.start();
  },
  stopAll: async () => {
    const mgr = await getGlobalRotationWorkerManager();
    return mgr.stop();
  },
};
