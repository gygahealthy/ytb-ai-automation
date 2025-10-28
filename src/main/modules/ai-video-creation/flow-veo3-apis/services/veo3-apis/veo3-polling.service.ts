import { BrowserWindow } from "electron";
import { logger } from "../../../../../utils/logger-backend";
import { videoGenerationRepository } from "../../repository/video-generation.repository";
import { videoUpscaleRepository } from "../../repository/video-upscale.repository";
import { veo3StatusCheckerService } from "./veo3-status-checker.service";
import { veo3VideoUpscaleService } from "./veo3-video-upscale.service";
import { veo3PollingManager } from "./veo3-polling-manager.service";

interface PollingJob {
  id: string; // generationId or upscaleId
  type: "generation" | "upscale";
  promptId?: string;
  attempts: number;
  lastChecked: number;
}

/**
 * VEO3 Polling Service
 * Manages background polling of video generation and upscale status independently of client
 * Broadcasts status updates to all connected clients
 */
export class VEO3PollingService {
  private pollingJobs: Map<string, PollingJob> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL_MS = 10000; // 10 seconds
  private readonly MAX_ATTEMPTS = 360; // 1 hour max (360 * 10s)

  constructor() {
    this.startPolling();
  }

  /**
   * Add a generation or upscale to the polling queue
   * @param id - generationId or upscaleId
   * @param promptId - optional promptId for client tracking
   * @param type - "generation" or "upscale" (default: "generation")
   *
   * @deprecated This method now delegates to veo3PollingManager (worker thread).
   * For new code, use veo3PollingManager.addToPolling() directly with full context.
   */
  async addToPolling(id: string, promptId?: string, type: "generation" | "upscale" = "generation") {
    logger.info(`[VEO3PollingService] Delegating ${type} ${id} to worker thread manager`);

    try {
      // Fetch record to get required context for worker
      let profileId: string;
      let operationName: string;
      let sceneId: string;

      if (type === "upscale") {
        const upscale = await videoUpscaleRepository.getById(id);
        if (!upscale) {
          logger.error(`[VEO3PollingService] Upscale ${id} not found in database`);
          return;
        }
        profileId = upscale.profileId;
        operationName = upscale.operationName;
        sceneId = upscale.sceneId;
      } else {
        const generation = await videoGenerationRepository.getById(id);
        if (!generation) {
          logger.error(`[VEO3PollingService] Generation ${id} not found in database`);
          return;
        }
        profileId = generation.profileId;
        operationName = generation.operationName;
        sceneId = generation.sceneId;
      }

      // Delegate to worker thread manager (non-blocking)
      veo3PollingManager.addToPolling(id, promptId, type, profileId, operationName, sceneId);

      logger.info(`[VEO3PollingService] Delegated ${type} ${id} to worker thread`);
    } catch (error) {
      logger.error(`[VEO3PollingService] Failed to delegate ${type} ${id}:`, error);
    }
  }

  /**
   * Remove a generation or upscale from the polling queue
   * @deprecated This method now delegates to veo3PollingManager (worker thread)
   */
  removeFromPolling(id: string) {
    logger.info(`[VEO3PollingService] Delegating removal of ${id} to worker thread`);
    veo3PollingManager.removeFromPolling(id);
  }

  /**
   * Start the background polling process
   */
  private startPolling() {
    if (this.pollingInterval) {
      logger.warn("[VEO3PollingService] Polling already started");
      return;
    }

    logger.info("[VEO3PollingService] Starting background polling service");

    this.pollingInterval = setInterval(async () => {
      if (this.pollingJobs.size === 0) {
        return;
      }

      logger.info(`[VEO3PollingService] Checking ${this.pollingJobs.size} generation(s)...`);

      const now = Date.now();
      const jobsToCheck = Array.from(this.pollingJobs.values()).filter((job) => now - job.lastChecked >= this.POLL_INTERVAL_MS);

      for (const job of jobsToCheck) {
        await this.checkAndBroadcast(job);
      }
    }, this.POLL_INTERVAL_MS);

    logger.info("[VEO3PollingService] Background polling service started");
  }

  /**
   * Stop the background polling process
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      logger.info("[VEO3PollingService] Background polling service stopped");
    }
  }

  /**
   * Check status and broadcast to all clients
   */
  private async checkAndBroadcast(job: PollingJob) {
    const { id, type, promptId } = job;

    job.attempts++;
    job.lastChecked = Date.now();

    const timestamp = new Date().toLocaleTimeString();
    logger.info(`[VEO3PollingService] [${timestamp}] Checking ${type} ${id} (attempt ${job.attempts}/${this.MAX_ATTEMPTS})`);

    try {
      let result: any;

      if (type === "upscale") {
        result = await veo3VideoUpscaleService.checkUpscaleStatus(id);
      } else {
        result = await veo3StatusCheckerService.checkGenerationStatus(id);
      }

      if (!result.success || !result.data) {
        logger.error(`[VEO3PollingService] Failed to check ${type} status: ${result.error}`);

        // If too many attempts, remove from queue
        if (job.attempts >= this.MAX_ATTEMPTS) {
          logger.error(`[VEO3PollingService] Max attempts reached for ${type} ${id}, removing from queue`);
          this.removeFromPolling(id);

          // Broadcast failure
          this.broadcastStatusUpdate(type, {
            id,
            promptId,
            status: "failed",
            error: "Max polling attempts reached",
          });
        }

        return;
      }

      const { status, videoUrl, errorMessage, completedAt } = result.data;
      logger.info(`[VEO3PollingService] Status for ${type} ${id}: ${status}`);

      if (status === "completed") {
        logger.info(`[VEO3PollingService] ✅ ${type} completed! URL: ${videoUrl?.substring(0, 50)}...`);

        // Remove from polling queue
        this.removeFromPolling(id);

        // Broadcast completion to all clients
        this.broadcastStatusUpdate(type, {
          id,
          promptId,
          status: "completed",
          videoUrl,
          completedAt,
          progress: 100,
        });
      } else if (status === "failed") {
        logger.error(`[VEO3PollingService] ❌ ${type} failed: ${errorMessage}`);

        // Remove from polling queue
        this.removeFromPolling(id);

        // Broadcast failure to all clients
        this.broadcastStatusUpdate(type, {
          id,
          promptId,
          status: "failed",
          error: errorMessage,
          progress: 0,
        });
      } else {
        // Still processing
        logger.info(`[VEO3PollingService] ⏳ Still processing (status: ${status})...`);

        // Broadcast processing status with estimated progress
        const estimatedProgress = Math.min(95, Math.floor((job.attempts / this.MAX_ATTEMPTS) * 100));
        this.broadcastStatusUpdate(type, {
          id,
          promptId,
          status: "processing",
          progress: estimatedProgress,
        });
      }
    } catch (error) {
      logger.error(`[VEO3PollingService] Error checking ${type} ${id}:`, error);

      // If too many attempts, remove from queue
      if (job.attempts >= this.MAX_ATTEMPTS) {
        logger.error(`[VEO3PollingService] Max attempts reached for ${type} ${id}, removing from queue`);
        this.removeFromPolling(id);

        this.broadcastStatusUpdate(type, {
          id,
          promptId,
          status: "failed",
          error: String(error),
        });
      }
    }
  }

  /**
   * Broadcast status update to all browser windows
   */
  private broadcastStatusUpdate(
    type: "generation" | "upscale",
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

    // Use different channels for generations vs upscales
    const channel = type === "upscale" ? "veo3:upscale:status" : "veo3:generation:status";

    // For backward compatibility, keep generationId/upscaleId in data
    const payload = type === "upscale" ? { upscaleId: data.id, ...data } : { generationId: data.id, ...data };

    logger.info(`[VEO3PollingService] Broadcasting ${type} status update to ${windows.length} window(s):`, {
      id: data.id,
      promptId: data.promptId,
      status: data.status,
    });

    windows.forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, payload);
      }
    });
  }

  /**
   * Get current queue status
   * @deprecated This method now delegates to veo3PollingManager (worker thread)
   */
  async getQueueStatus() {
    logger.info(`[VEO3PollingService] Delegating queue status to worker thread`);
    return await veo3PollingManager.getQueueStatus();
  }

  /**
   * Restore polling for all pending/processing generations and upscales on startup
   * @deprecated This method now delegates to veo3PollingManager (worker thread)
   */
  async restorePendingGenerations() {
    logger.info("[VEO3PollingService] Delegating pending job restoration to worker thread");

    try {
      // Initialize worker thread manager if not already done
      await veo3PollingManager.initialize();

      // Delegate to worker thread (non-blocking)
      await veo3PollingManager.restorePendingJobs();

      logger.info("[VEO3PollingService] Worker thread initialized and jobs restored");
    } catch (error) {
      logger.error("[VEO3PollingService] Failed to initialize worker thread:", error);
    }
  }
}

// Export singleton instance
export const veo3PollingService = new VEO3PollingService();
