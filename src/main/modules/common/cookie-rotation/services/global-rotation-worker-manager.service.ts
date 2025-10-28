/**
 * Global Cookie Rotation Worker Manager
 * Manages all cookie rotation workers for all profiles
 * Handles session health monitoring, auto-recovery, and headless fallback
 */

import { logger } from "../../../../utils/logger-backend.js";
import { CookieRepository } from "../../cookie/repository/cookie.repository.js";
import { CookieRotationMonitorRepository, type CookieRotationMonitor } from "../repository/cookie-rotation-monitor.repository.js";
import { createCookieManagerDB, type CookieManagerDB } from "../../cookie/services/cookie-manager-db.js";
import type { CookieCollection } from "../../../gemini-apis/shared/types/index.js";
import { parseCookieHeader } from "../../cookie/helpers/cookie-parser.helpers.js";
import { extractAndCreateHandler } from "../../cookie/handlers/extractAndCreate.js";
import { BrowserWindow } from "electron";
import { cookieRotationConfigService } from "./cookie-rotation-config.service.js";
import { fork, type ChildProcess } from "child_process";
import { execSync } from "child_process";
import * as path from "path";

/**
 * Worker instance tracking
 */
interface WorkerInstance {
  cookieManagerDB: CookieManagerDB | null; // null for Phase 1 forked workers
  monitorId: string;
  profileId: string;
  cookieId: string;
  userDataDir?: string;
  // Phase 1 worker process tracking
  workerProcess?: ChildProcess;
  workerType?: "legacy" | "phase1-forked";
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

      // Check if session is expired using configured requiredCookies
      const isExpired = await this.detectExpiredSession(cookies, cookie.id);

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
      const cookieManagerDB = await createCookieManagerDB(
        cookies,
        this.cookieRepository,
        cookie.profileId,
        cookie.url,
        {
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
        },
        cookie.service // Pass the service from the cookie entity
      );

      // Start the rotation worker
      cookieManagerDB.start();

      // Store worker instance
      this.workers.set(key, {
        cookieManagerDB,
        monitorId: monitor.id,
        profileId: cookie.profileId,
        cookieId: cookie.id,
        userDataDir: undefined, // Will be loaded on-demand for headless refresh
        workerType: "legacy",
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
      // Handle Phase 1 forked worker
      if (worker.workerType === "phase1-forked" && worker.workerProcess) {
        worker.workerProcess.send({ cmd: "stop" });
        // Give it a moment to gracefully stop, then force kill if needed
        setTimeout(() => {
          if (worker.workerProcess && !worker.workerProcess.killed) {
            worker.workerProcess.kill();
          }
        }, 2000);
      } else if (worker.cookieManagerDB) {
        // Handle legacy worker
        worker.cookieManagerDB.stop();
      }

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
      // Prepare rotation config with requiredCookies if available
      const rotationConfig: any = {};
      if (cookie.requiredCookies && cookie.requiredCookies.length > 0) {
        rotationConfig.requiredCookies = cookie.requiredCookies;
        logger.info(`[rotation-manager] Using configured requiredCookies for headless refresh`, {
          requiredCookies: cookie.requiredCookies,
        });
      }

      // Call unified extraction handler with headless=true (background mode)
      const result = await extractAndCreateHandler({
        profileId: cookie.profileId,
        service: cookie.service,
        url: cookie.url || "https://gemini.google.com",
        headless: true, // Use headless mode for automatic refresh
        rotationConfig: Object.keys(rotationConfig).length > 0 ? rotationConfig : undefined,
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
   * Uses configured requiredCookies if available, otherwise defaults to Google/Gemini cookies
   */
  private async detectExpiredSession(cookies: CookieCollection, cookieId?: string): Promise<boolean> {
    // Try to load requiredCookies from cookie configuration
    let requiredCookies: string[] = ["__Secure-1PSID", "__Secure-1PSIDTS"]; // Default for backward compatibility

    if (cookieId) {
      try {
        const cookie = await this.cookieRepository.findById(cookieId);
        if (cookie?.requiredCookies && cookie.requiredCookies.length > 0) {
          requiredCookies = cookie.requiredCookies;
          logger.debug(`[rotation-manager] Using configured requiredCookies for session detection`, {
            cookieId,
            requiredCookies,
          });
        }
      } catch (error) {
        logger.warn(`[rotation-manager] Failed to load requiredCookies for ${cookieId}, using defaults`, error);
      }
    }

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
   * Forcefully terminates all spawned Chrome processes
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

    // Stop all workers (both legacy and forked)
    const workerStopPromises: Promise<void>[] = [];

    for (const [key, worker] of this.workers.entries()) {
      const stopPromise = (async () => {
        try {
          // Handle Phase 1 forked worker
          if (worker.workerType === "phase1-forked" && worker.workerProcess) {
            logger.info(`[rotation-manager] Stopping forked worker ${key} (PID: ${worker.workerProcess.pid})`);

            // Send graceful stop message
            try {
              worker.workerProcess.send({ cmd: "stop" });
            } catch (e) {
              logger.debug(`[rotation-manager] Could not send stop to worker ${key}`);
            }

            // Force kill after timeout with proper process cleanup
            await new Promise<void>((resolve) => {
              setTimeout(() => {
                if (worker.workerProcess && !worker.workerProcess.killed) {
                  logger.warn(`[rotation-manager] Force killing worker process ${key} (PID: ${worker.workerProcess.pid})`);

                  try {
                    if (process.platform === "win32") {
                      // Windows: use taskkill with /T to kill process tree (children too)
                      execSync(`taskkill /F /PID ${worker.workerProcess.pid} /T 2>nul || true`, {
                        windowsHide: true,
                        timeout: 2000,
                      });
                    } else {
                      // Unix: use SIGKILL
                      worker.workerProcess.kill("SIGKILL");
                    }
                  } catch (killErr) {
                    logger.debug(`[rotation-manager] Error killing worker process:`, killErr);
                  }
                }
                resolve();
              }, 1500);
            });
          } else if (worker.cookieManagerDB) {
            // Handle legacy worker
            logger.info(`[rotation-manager] Stopping legacy worker for cookie ${key}`);
            worker.cookieManagerDB.stop();
          }

          // Update status
          await this.monitorRepository.updateWorkerStatus(worker.monitorId, "stopped");
        } catch (error) {
          logger.error(`[rotation-manager] Failed to stop worker ${key}:`, error);
        }
      })();

      workerStopPromises.push(stopPromise);
    }

    // Wait for all workers to stop (with timeout)
    try {
      await Promise.race([
        Promise.all(workerStopPromises),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Worker cleanup timeout")), 10000)),
      ]);
    } catch (timeoutError) {
      logger.warn("[rotation-manager] Worker cleanup timed out, forcing exit", timeoutError);
    }

    // Force kill any remaining Chrome processes on Windows
    if (process.platform === "win32") {
      try {
        logger.info("[rotation-manager] Force killing any remaining Chrome processes");
        execSync("taskkill /F /IM chrome.exe 2>nul || true", {
          windowsHide: true,
          timeout: 3000,
        });
      } catch (error) {
        logger.debug("[rotation-manager] Failed to force kill Chrome (may have already exited)");
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
   * Phase 1: Now accepts options for initial refresh and forks a separate process
   */
  async startWorkerByIds(profileId: string, cookieId: string, options?: { performInitialRefresh?: boolean }): Promise<void> {
    const cookie = await this.cookieRepository.findById(cookieId);
    if (!cookie) {
      throw new Error(`Cookie ${cookieId} not found`);
    }

    if (cookie.profileId !== profileId) {
      throw new Error(`Cookie ${cookieId} does not belong to profile ${profileId}`);
    }

    // Check if worker already exists
    const workerKey = `${profileId}-${cookieId}`;
    if (this.workers.has(workerKey)) {
      logger.warn(`[rotation-manager] Worker already running for ${workerKey}`);
      return;
    }

    // Use Phase 1 CookieRotationWorker in a separate process if options provided
    if (options?.performInitialRefresh) {
      logger.info(`[rotation-manager] Starting Phase 1 worker (forked process) with initial refresh for ${cookieId}`);

      // Find or create monitor
      let monitor = await this.monitorRepository.findByProfileAndCookie(profileId, cookieId);
      if (!monitor) {
        monitor = await this.createMonitor(profileId, cookieId);
      }

      // Update monitor to initializing
      await this.monitorRepository.updateWorkerStatus(monitor.id, "initializing");

      // Fork the worker process
      const workerProcessPath = path.join(__dirname, "../workers/cookie-rotation-worker-process.js");

      // Pass worker log directory and DB path via environment variables
      const { app } = await import("electron");
      const workerLogDir = path.join(app.getPath("userData"), "logs");
      const APP_FOLDER_NAME = "veo3-automation";
      const dbDir = path.join(app.getPath("appData"), APP_FOLDER_NAME);
      const dbPath = path.join(dbDir, "veo3-automation.db");

      const workerProcess = fork(workerProcessPath, [], {
        stdio: ["inherit", "inherit", "inherit", "ipc"],
        env: {
          ...process.env,
          NODE_ENV: process.env.NODE_ENV || "production",
          WORKER_LOG_DIR: workerLogDir,
          DB_PATH: dbPath,
        },
      });

      // Handle worker process messages
      workerProcess.on("message", async (msg: any) => {
        try {
          if (msg.type === "ready") {
            logger.info(`[rotation-manager] Worker process ready for ${cookieId}`);
          } else if (msg.type === "started") {
            logger.info(`[rotation-manager] Worker process started for ${msg.cookieId}`);
            await this.monitorRepository.updateWorkerStatus(monitor!.id, "running");
          } else if (msg.type === "stopped") {
            logger.info(`[rotation-manager] Worker process stopped for ${cookieId}`);
            await this.monitorRepository.updateWorkerStatus(monitor!.id, "stopped");
            this.workers.delete(workerKey);
          } else if (msg.type === "status") {
            logger.debug(`[rotation-manager] Worker status: ${msg.status}`);
          } else if (msg.type === "rotationSuccess") {
            logger.info(`[rotation-manager] Rotation success for ${cookieId}`);
          } else if (msg.type === "rotationError") {
            logger.warn(`[rotation-manager] Rotation error for ${cookieId}: ${msg.error}`);
          } else if (msg.type === "error") {
            logger.error(`[rotation-manager] Worker process error for ${cookieId}: ${msg.error}`);
            await this.monitorRepository.updateWorkerStatus(monitor!.id, "stopped");
            this.workers.delete(workerKey);
          }
        } catch (error) {
          logger.error(`[rotation-manager] Failed to handle worker message:`, error);
        }
      });

      // Handle worker process exit
      workerProcess.on("exit", async (code, signal) => {
        logger.info(`[rotation-manager] Worker process exited for ${cookieId} (code: ${code}, signal: ${signal})`);
        try {
          await this.monitorRepository.updateWorkerStatus(monitor!.id, "stopped");
        } catch (e) {
          // ignore
        }
        this.workers.delete(workerKey);
      });

      // Handle worker process errors
      workerProcess.on("error", async (err) => {
        logger.error(`[rotation-manager] Worker process spawn error for ${cookieId}:`, err);
        try {
          await this.monitorRepository.updateWorkerStatus(monitor!.id, "stopped");
        } catch (e) {
          // ignore
        }
        this.workers.delete(workerKey);
      });

      // Wait for ready signal, then send start command
      const readyPromise = new Promise<void>((resolve) => {
        const handler = (msg: any) => {
          if (msg.type === "ready") {
            workerProcess.off("message", handler);
            resolve();
          }
        };
        workerProcess.on("message", handler);
      });

      await readyPromise;

      // Fetch config in parent to pass to child (avoids uninitialized service in forked process)
      const config = await cookieRotationConfigService.getCookieConfig(cookieId);
      if (!config) {
        logger.warn(`[rotation-manager] No config found for cookie ${cookieId}, worker may fail`);
      }

      // Fetch profile name for logging context
      const profileEntity = await this.getProfile(profileId);
      const profileName = profileEntity?.name || profileId;

      // Send start command with options and config (including logging context)
      workerProcess.send({
        cmd: "start",
        cookieId,
        options: {
          performInitialRefresh: true,
          verbose: true,
          service: cookie.service,
          profileId: cookie.profileId,
          profileName, // Pass profile name for logging context in child
          config: config
            ? {
                ...config,
                // Include logging context in config for access in worker methods
                profileId: cookie.profileId,
                profileName,
                service: cookie.service,
              }
            : undefined, // Pass parent-fetched config to avoid DB access in child
        },
      });

      // Store worker reference
      this.workers.set(workerKey, {
        cookieManagerDB: null, // Phase 1 forked worker doesn't use in-process CookieManagerDB
        monitorId: monitor.id,
        profileId,
        cookieId,
        userDataDir: profileEntity?.userDataDir,
        workerProcess,
        workerType: "phase1-forked",
      });

      logger.info(`[rotation-manager] ✅ Phase 1 worker (forked process) started for ${workerKey}`);
    } else {
      // Fall back to legacy behavior for backward compatibility
      await this.startWorkerForCookie(cookie);
    }
  }

  /**
   * Initialize startup workers (Phase 2)
   * Identifies all cookies marked for startup and launches their rotation workers.
   * Each worker will be instructed to perform an immediate initial refresh.
   * Staggers startup for cookies sharing the same profile to prevent browser launch conflicts.
   */
  async initializeStartupWorkers(): Promise<void> {
    logger.info("[rotation-manager] Initializing startup cookie rotation workers...");
    try {
      const startupCookies = await this.cookieRepository.findWithRotationEnabledOnStartup();
      if (startupCookies.length === 0) {
        logger.info("[rotation-manager] No cookies are configured for startup rotation.");
        return;
      }

      logger.info(`[rotation-manager] Found ${startupCookies.length} cookie(s) to start on launch.`);

      // Group cookies by profileId to stagger same-profile launches
      const cookiesByProfile = new Map<string, typeof startupCookies>();
      for (const cookie of startupCookies) {
        const profileId = cookie.profileId;
        if (!cookiesByProfile.has(profileId)) {
          cookiesByProfile.set(profileId, []);
        }
        cookiesByProfile.get(profileId)!.push(cookie);
      }

      logger.info(`[rotation-manager] Cookies grouped across ${cookiesByProfile.size} profile(s)`);

      // Start workers with staggered delays for same-profile cookies
      const startPromises: Promise<void>[] = [];
      let globalDelay = 0;

      for (const [profileId, profileCookies] of cookiesByProfile.entries()) {
        logger.info(`[rotation-manager] Profile ${profileId} has ${profileCookies.length} cookie(s) to start`);

        for (let i = 0; i < profileCookies.length; i++) {
          const cookie = profileCookies[i];
          const staggerDelay = globalDelay + i * 3000; // 3 second stagger per cookie in same profile

          startPromises.push(
            (async () => {
              if (staggerDelay > 0) {
                logger.info(
                  `[rotation-manager] Delaying start for ${cookie.id} (${cookie.service}) by ${staggerDelay}ms to avoid profile conflict`
                );
                await new Promise((resolve) => setTimeout(resolve, staggerDelay));
              }

              logger.info(`[rotation-manager] Starting worker for cookie: ${cookie.id} (${cookie.service})`);
              await this.startWorkerByIds(cookie.profileId, cookie.id, {
                performInitialRefresh: true,
              });
            })()
          );
        }

        // Add inter-profile delay (1 second after last cookie of this profile)
        globalDelay += profileCookies.length * 3000 + 1000;
      }

      // Wait for all workers to start (in staggered manner)
      await Promise.allSettled(startPromises);

      logger.info("[rotation-manager] ✅ Startup cookie rotation workers initialized (background)");
    } catch (error) {
      logger.error("[rotation-manager] Failed to initialize startup cookie workers.", error);
    }
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

    // Initialize cookie-rotation module's config service holder with repositories
    try {
      cookieRotationConfigService.init(cookieRepository, monitorRepository);
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
