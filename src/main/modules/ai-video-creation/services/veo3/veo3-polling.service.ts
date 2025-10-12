import { BrowserWindow } from "electron";
import { logger } from "../../../../utils/logger-backend";
import { videoGenerationRepository } from "../../repository/video-generation.repository";
import { veo3StatusCheckerService } from "./veo3-status-checker.service";

interface PollingJob {
  generationId: string;
  promptId?: string;
  attempts: number;
  lastChecked: number;
}

/**
 * VEO3 Polling Service
 * Manages background polling of video generation status independently of client
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
   * Add a generation to the polling queue
   */
  addToPolling(generationId: string, promptId?: string) {
    if (this.pollingJobs.has(generationId)) {
      logger.info(`[VEO3PollingService] Generation ${generationId} already in polling queue`);
      return;
    }

    this.pollingJobs.set(generationId, {
      generationId,
      promptId,
      attempts: 0,
      lastChecked: 0,
    });

    logger.info(`[VEO3PollingService] Added generation ${generationId} to polling queue (promptId: ${promptId || 'none'})`);
    logger.info(`[VEO3PollingService] Queue size: ${this.pollingJobs.size}`);
  }

  /**
   * Remove a generation from the polling queue
   */
  removeFromPolling(generationId: string) {
    const removed = this.pollingJobs.delete(generationId);
    if (removed) {
      logger.info(`[VEO3PollingService] Removed generation ${generationId} from polling queue`);
      logger.info(`[VEO3PollingService] Queue size: ${this.pollingJobs.size}`);
    }
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
      const jobsToCheck = Array.from(this.pollingJobs.values()).filter(
        (job) => now - job.lastChecked >= this.POLL_INTERVAL_MS
      );

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
    const { generationId, promptId, attempts } = job;
    
    job.attempts++;
    job.lastChecked = Date.now();

    const timestamp = new Date().toLocaleTimeString();
    logger.info(`[VEO3PollingService] [${timestamp}] Checking generation ${generationId} (attempt ${job.attempts}/${this.MAX_ATTEMPTS})`);

    try {
      const result = await veo3StatusCheckerService.checkGenerationStatus(generationId);

      if (!result.success || !result.data) {
        logger.error(`[VEO3PollingService] Failed to check status: ${result.error}`);
        
        // If too many attempts, remove from queue
        if (job.attempts >= this.MAX_ATTEMPTS) {
          logger.error(`[VEO3PollingService] Max attempts reached for ${generationId}, removing from queue`);
          this.removeFromPolling(generationId);
          
          // Broadcast failure
          this.broadcastStatusUpdate({
            generationId,
            promptId,
            status: "failed",
            error: "Max polling attempts reached",
          });
        }
        
        return;
      }

      const { status, videoUrl, errorMessage, completedAt } = result.data;
      logger.info(`[VEO3PollingService] Status for ${generationId}: ${status}`);

      if (status === "completed") {
        logger.info(`[VEO3PollingService] ✅ Video completed! URL: ${videoUrl?.substring(0, 50)}...`);
        
        // Remove from polling queue
        this.removeFromPolling(generationId);
        
        // Broadcast completion to all clients
        this.broadcastStatusUpdate({
          generationId,
          promptId,
          status: "completed",
          videoUrl,
          completedAt,
          progress: 100,
        });
        
      } else if (status === "failed") {
        logger.error(`[VEO3PollingService] ❌ Video failed: ${errorMessage}`);
        
        // Remove from polling queue
        this.removeFromPolling(generationId);
        
        // Broadcast failure to all clients
        this.broadcastStatusUpdate({
          generationId,
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
        this.broadcastStatusUpdate({
          generationId,
          promptId,
          status: "processing",
          progress: estimatedProgress,
        });
      }
      
    } catch (error) {
      logger.error(`[VEO3PollingService] Error checking generation ${generationId}:`, error);
      
      // If too many attempts, remove from queue
      if (job.attempts >= this.MAX_ATTEMPTS) {
        logger.error(`[VEO3PollingService] Max attempts reached for ${generationId}, removing from queue`);
        this.removeFromPolling(generationId);
        
        this.broadcastStatusUpdate({
          generationId,
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
  private broadcastStatusUpdate(data: {
    generationId: string;
    promptId?: string;
    status: string;
    videoUrl?: string;
    error?: string;
    completedAt?: string;
    progress?: number;
  }) {
    const windows = BrowserWindow.getAllWindows();
    
    logger.info(`[VEO3PollingService] Broadcasting status update to ${windows.length} window(s):`, {
      generationId: data.generationId,
      promptId: data.promptId,
      status: data.status,
    });
    
    windows.forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send("veo3:generation:status", data);
      }
    });
  }

  /**
   * Get current queue status
   */
  getQueueStatus() {
    return {
      size: this.pollingJobs.size,
      jobs: Array.from(this.pollingJobs.values()).map(job => ({
        generationId: job.generationId,
        promptId: job.promptId,
        attempts: job.attempts,
        maxAttempts: this.MAX_ATTEMPTS,
      })),
    };
  }

  /**
   * Restore polling for all pending/processing generations on startup
   */
  async restorePendingGenerations() {
    try {
      logger.info("[Polling] Restoring pending generations from database...");
      
      // Get all generations with pending or processing status
      const allGenerations = await videoGenerationRepository.getAll(1000, 0);
      const pendingGenerations = allGenerations.filter(
        (gen: any) => gen.status === "pending" || gen.status === "processing"
      );
      
      logger.info(`[Polling] Found ${pendingGenerations.length} pending/processing generation(s)`);
      
      for (const gen of pendingGenerations) {
        // Note: promptId is not stored in VideoGeneration table, only in the request
        // So we'll add without promptId for restored generations
        this.addToPolling(gen.id);
      }
      
      logger.info(`[Polling] Restored ${pendingGenerations.length} generation(s) to polling queue`);
    } catch (error) {
      logger.error("[Polling] Failed to restore pending generations:", error);
    }
  }
}

// Export singleton instance
export const veo3PollingService = new VEO3PollingService();
