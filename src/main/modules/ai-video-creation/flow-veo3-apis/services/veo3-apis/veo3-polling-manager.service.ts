/**
 * VEO3 Polling Manager Service
 *
 * Manages the dedicated polling worker thread for video generation and upscale status checks.
 * This service acts as a bridge between the main process and the worker thread.
 *
 * Benefits:
 * - Non-blocking: Polling runs in separate thread
 * - Scalable: Can handle 100+ concurrent items
 * - Efficient: Self-throttling and exponential backoff
 * - Resilient: Automatic restart on worker failure
 */

import { Worker } from "worker_threads";
import { BrowserWindow } from "electron";
import path from "path";
import { logger } from "../../../../../utils/logger-backend";
import { database } from "../../../../../storage/database";
import { videoGenerationRepository } from "../../repository/video-generation.repository";
import { videoUpscaleRepository } from "../../repository/video-upscale.repository";

export class VEO3PollingManagerService {
  private worker: Worker | null = null;
  private isInitialized = false;
  private workerPath: string;

  constructor() {
    // Worker path will be in dist/main/modules/.../workers/ after build
    this.workerPath = path.join(__dirname, "../../workers/veo3-polling.worker.js");
  }

  /**
   * Initialize the polling worker thread
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn("[PollingManager] Already initialized");
      return;
    }

    try {
      logger.info("[PollingManager] Starting polling worker thread...");

      // Get database path from the database singleton
      const dbPath = database.getBasePath();

      // Create worker thread
      this.worker = new Worker(this.workerPath, {
        env: {
          ...process.env,
          DB_PATH: dbPath,
        },
      });

      // Handle worker messages
      this.worker.on("message", (message: any) => {
        this.handleWorkerMessage(message);
      });

      // Handle worker errors
      this.worker.on("error", (error: Error) => {
        logger.error("[PollingManager] Worker error:", error);
        this.handleWorkerError(error);
      });

      // Handle worker exit
      this.worker.on("exit", (code: number) => {
        logger.warn(`[PollingManager] Worker exited with code ${code}`);
        if (code !== 0) {
          this.handleWorkerCrash(code);
        }
      });

      // Wait for initialization
      await this.waitForInitialization();

      this.isInitialized = true;
      logger.info("[PollingManager] Polling worker initialized successfully");
    } catch (error) {
      logger.error("[PollingManager] Failed to initialize worker:", error);
      throw error;
    }
  }

  /**
   * Wait for worker to send initialization message
   */
  private waitForInitialization(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Worker initialization timeout"));
      }, 10000); // 10 second timeout

      const handler = (message: any) => {
        if (message.type === "initialized") {
          clearTimeout(timeout);
          this.worker?.off("message", handler);
          resolve();
        } else if (message.type === "error") {
          clearTimeout(timeout);
          this.worker?.off("message", handler);
          reject(new Error(message.error));
        }
      };

      this.worker?.on("message", handler);
    });
  }

  /**
   * Handle messages from worker thread
   */
  private handleWorkerMessage(message: any) {
    try {
      if (message.type === "statusUpdate") {
        this.broadcastStatusUpdate(message.jobType, message.data);
      } else if (message.type === "queueStatus") {
        logger.info("[PollingManager] Queue status:", message.data);
      } else if (message.type === "error") {
        logger.error("[PollingManager] Worker reported error:", message.error);
      }
    } catch (error) {
      logger.error("[PollingManager] Error handling worker message:", error);
    }
  }

  /**
   * Broadcast status update to all browser windows
   */
  private broadcastStatusUpdate(
    jobType: "generation" | "upscale",
    data: {
      id: string;
      promptId?: string;
      status: string;
      videoUrl?: string;
      error?: string;
      completedAt?: string;
      progress?: number;
    }
  ) {
    const windows = BrowserWindow.getAllWindows();
    const channel = jobType === "upscale" ? "veo3:upscale:status" : "veo3:generation:status";

    // For backward compatibility
    const payload = jobType === "upscale" ? { upscaleId: data.id, ...data } : { generationId: data.id, ...data };

    logger.info(`[PollingManager] Broadcasting ${jobType} status:`, {
      id: data.id,
      status: data.status,
      promptId: data.promptId,
    });

    windows.forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, payload);
      }
    });
  }

  /**
   * Handle worker error (non-fatal)
   */
  private handleWorkerError(error: Error) {
    logger.error("[PollingManager] Worker encountered error, attempting recovery:", error);

    // Worker is still running, just log the error
    // The worker has its own retry logic for individual jobs
  }

  /**
   * Handle worker crash (fatal)
   */
  private async handleWorkerCrash(exitCode: number) {
    logger.error(`[PollingManager] Worker crashed with code ${exitCode}, restarting...`);

    this.isInitialized = false;
    this.worker = null;

    // Wait a bit before restarting
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      await this.initialize();

      // Restore pending jobs after restart
      await this.restorePendingJobs();

      logger.info("[PollingManager] Worker restarted successfully");
    } catch (error) {
      logger.error("[PollingManager] Failed to restart worker:", error);
    }
  }

  /**
   * Add a job to the polling queue
   */
  addToPolling(
    id: string,
    promptId: string | undefined,
    type: "generation" | "upscale",
    profileId: string,
    operationName: string,
    sceneId: string
  ): void {
    if (!this.isInitialized || !this.worker) {
      logger.error("[PollingManager] Worker not initialized, cannot add job");
      return;
    }

    this.worker.postMessage({
      cmd: "add",
      id,
      type,
      promptId,
      profileId,
      operationName,
      sceneId,
    });

    logger.info(`[PollingManager] Added ${type} ${id} to worker queue`);
  }

  /**
   * Remove a job from the polling queue
   */
  removeFromPolling(id: string): void {
    if (!this.isInitialized || !this.worker) {
      return;
    }

    this.worker.postMessage({
      cmd: "remove",
      id,
    });

    logger.info(`[PollingManager] Removed ${id} from worker queue`);
  }

  /**
   * Get current queue status
   */
  async getQueueStatus(): Promise<any> {
    if (!this.isInitialized || !this.worker) {
      return { size: 0, jobs: [] };
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ size: 0, jobs: [] });
      }, 5000);

      const handler = (message: any) => {
        if (message.type === "queueStatus") {
          clearTimeout(timeout);
          this.worker?.off("message", handler);
          resolve(message.data);
        }
      };

      this.worker?.on("message", handler);
      this.worker?.postMessage({ cmd: "getQueue" });
    });
  }

  /**
   * Restore pending generations and upscales from database
   */
  async restorePendingJobs(): Promise<void> {
    try {
      logger.info("[PollingManager] Restoring pending jobs from database...");

      // Get pending/processing generations
      const allGenerations = await videoGenerationRepository.getAll(1000, 0);
      const pendingGenerations = allGenerations.filter((gen: any) => gen.status === "pending" || gen.status === "processing");

      logger.info(`[PollingManager] Found ${pendingGenerations.length} pending generation(s)`);

      for (const gen of pendingGenerations) {
        this.addToPolling(gen.id, undefined, "generation", gen.profileId, gen.operationName, gen.sceneId);
      }

      // Get pending/processing upscales
      const allUpscales = await videoUpscaleRepository.getAll(1000, 0);
      const pendingUpscales = allUpscales.filter((ups: any) => ups.status === "pending" || ups.status === "processing");

      logger.info(`[PollingManager] Found ${pendingUpscales.length} pending upscale(s)`);

      for (const ups of pendingUpscales) {
        this.addToPolling(ups.id, undefined, "upscale", ups.profileId, ups.operationName, ups.sceneId);
      }

      logger.info(
        `[PollingManager] Restored ${pendingGenerations.length} generation(s) and ${pendingUpscales.length} upscale(s)`
      );
    } catch (error) {
      logger.error("[PollingManager] Failed to restore pending jobs:", error);
    }
  }

  /**
   * Shutdown the worker thread
   */
  async shutdown(): Promise<void> {
    if (!this.worker) {
      return;
    }

    logger.info("[PollingManager] Shutting down polling worker...");

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        logger.warn("[PollingManager] Worker shutdown timeout, forcing termination");
        this.worker?.terminate();
        resolve();
      }, 5000);

      this.worker?.once("exit", () => {
        clearTimeout(timeout);
        logger.info("[PollingManager] Worker shut down successfully");
        resolve();
      });

      this.worker?.postMessage({ cmd: "shutdown" });
    });
  }
}

// Export singleton instance
export const veo3PollingManager = new VEO3PollingManagerService();
