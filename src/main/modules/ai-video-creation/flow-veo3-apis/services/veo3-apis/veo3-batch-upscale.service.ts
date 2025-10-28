import { randomBytes } from "crypto";
import { BrowserWindow } from "electron";
import { ApiResponse } from "../../../../../../shared/types";
import { logger } from "../../../../../utils/logger-backend";
import { veo3VideoUpscaleService } from "./veo3-video-upscale.service";
import { veo3PollingManager } from "./veo3-polling-manager.service";
import { videoUpscaleRepository } from "../../repository/video-upscale.repository";

export interface BatchUpscaleRequest {
  sourceGenerationId: string;
  model?: string;
}

export interface BatchUpscaleProgress {
  sourceGenerationId: string;
  success: boolean;
  upscaleId?: string;
  sceneId?: string;
  operationName?: string;
  error?: string;
  index: number;
  total: number;
}

export type BatchUpscaleProgressCallback = (progress: BatchUpscaleProgress) => void;

/**
 * Broadcast an event to all browser windows
 */
function broadcastToAllWindows(channel: string, data: any) {
  const windows = BrowserWindow.getAllWindows();
  windows.forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, data);
    }
  });
}

/**
 * VEO3 Batch Upscale Service
 * Handles multiple video upscale requests with delays and progress tracking
 */
export class VEO3BatchUpscaleService {
  /**
   * Upscale multiple videos asynchronously (non-blocking)
   * Returns immediately and processes upscales in the background
   *
   * @param requests - Array of upscale requests
   * @param delayMs - Delay in milliseconds between each request (default: 1500ms)
   * @param onProgress - Callback function for progress updates (optional)
   * @returns Batch ID and total count
   */
  async upscaleMultipleVideosAsync(
    requests: BatchUpscaleRequest[],
    delayMs: number = 1500,
    onProgress?: BatchUpscaleProgressCallback
  ): Promise<ApiResponse<{ batchId: string; total: number }>> {
    try {
      const batchId = randomBytes(8).toString("hex");
      logger.info(`Starting async upscale batch (${batchId}) for ${requests.length} videos with ${delayMs}ms delay`);

      // Send immediate event to all clients that batch has started
      broadcastToAllWindows("veo3:batch:upscale:started", {
        batchId,
        total: requests.length,
        sourceGenerationIds: requests.map((r) => r.sourceGenerationId),
      });
      logger.info(`[Upscale Batch ${batchId}] Sent batch-started event to all clients`);

      // Process in background - return immediately
      this.processBatchInBackground(batchId, requests, delayMs, onProgress);

      return {
        success: true,
        data: {
          batchId,
          total: requests.length,
        },
      };
    } catch (error) {
      logger.error("Failed to start async upscale batch", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Upscale multiple videos synchronously (blocking)
   * Waits for all upscales to be initiated before returning
   *
   * @param requests - Array of upscale requests
   * @param delayMs - Delay in milliseconds between each request (default: 1500ms)
   * @returns Array of upscale results
   */
  async upscaleMultipleVideosSync(
    requests: BatchUpscaleRequest[],
    delayMs: number = 1500
  ): Promise<
    ApiResponse<
      Array<{
        success: boolean;
        upscaleId?: string;
        sceneId?: string;
        operationName?: string;
        error?: string;
        sourceGenerationId: string;
      }>
    >
  > {
    try {
      logger.info(`Starting sync upscale batch for ${requests.length} videos with ${delayMs}ms delay`);

      const results: Array<{
        success: boolean;
        upscaleId?: string;
        sceneId?: string;
        operationName?: string;
        error?: string;
        sourceGenerationId: string;
      }> = [];

      for (let i = 0; i < requests.length; i++) {
        const request = requests[i];
        logger.info(`[${i + 1}/${requests.length}] Upscaling video: ${request.sourceGenerationId}`);

        try {
          const result = await veo3VideoUpscaleService.startVideoUpscale(
            request.sourceGenerationId,
            request.model || "veo_2_1080p_upsampler_8s"
          );

          if (result.success && result.data) {
            logger.info(`[${i + 1}/${requests.length}] ✅ Success: ${result.data.upscaleId}`);
            results.push({
              success: true,
              upscaleId: result.data.upscaleId,
              sceneId: result.data.sceneId,
              operationName: result.data.operationName,
              sourceGenerationId: request.sourceGenerationId,
            });
          } else {
            logger.error(`[${i + 1}/${requests.length}] ❌ Failed: ${result.error}`);
            results.push({
              success: false,
              error: result.error || "Unknown error",
              sourceGenerationId: request.sourceGenerationId,
            });
          }

          // Add delay between requests (except after the last one)
          if (i < requests.length - 1) {
            logger.info(`⏳ Waiting ${delayMs}ms before next upscale...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        } catch (error) {
          logger.error(`[${i + 1}/${requests.length}] ❌ Exception:`, error);
          results.push({
            success: false,
            error: String(error),
            sourceGenerationId: request.sourceGenerationId,
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      logger.info(`Sync upscale batch completed: ${successCount} successful, ${failureCount} failed`);

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      logger.error("Failed to upscale multiple videos", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Process upscale batch in background
   * This runs asynchronously and calls onProgress for each completed request
   */
  private async processBatchInBackground(
    batchId: string,
    requests: BatchUpscaleRequest[],
    delayMs: number,
    onProgress?: BatchUpscaleProgressCallback
  ): Promise<void> {
    let successCount = 0;
    let failureCount = 0;

    logger.info(`[Upscale Batch ${batchId}] Background processing started`);

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      logger.info(`[Upscale Batch ${batchId}] [${i + 1}/${requests.length}] Processing: ${request.sourceGenerationId}`);

      try {
        const result = await veo3VideoUpscaleService.startVideoUpscale(
          request.sourceGenerationId,
          request.model || "veo_2_1080p_upsampler_8s"
        );

        if (result.success && result.data) {
          successCount++;
          logger.info(`[Upscale Batch ${batchId}] [${i + 1}/${requests.length}] ✅ Success: ${result.data.upscaleId}`);

          // Add to backend polling service immediately (worker thread - non-blocking)
          // Fetch upscale record to get profileId
          const upscaleRecord = await videoUpscaleRepository.getById(result.data.upscaleId);
          if (upscaleRecord) {
            veo3PollingManager.addToPolling(
              result.data.upscaleId,
              undefined,
              "upscale",
              upscaleRecord.profileId,
              result.data.operationName,
              result.data.sceneId
            );
            logger.info(`[Upscale Batch ${batchId}] Added ${result.data.upscaleId} to backend polling queue (worker thread)`);
          }

          const progressData: BatchUpscaleProgress = {
            sourceGenerationId: request.sourceGenerationId,
            success: true,
            upscaleId: result.data.upscaleId,
            sceneId: result.data.sceneId,
            operationName: result.data.operationName,
            index: i + 1,
            total: requests.length,
          };

          // Send immediate event to ALL clients
          broadcastToAllWindows("veo3:batch:upscale:progress", progressData);
          logger.info(`[Upscale Batch ${batchId}] Broadcasted progress event for: ${request.sourceGenerationId}`);

          // Also call the callback if provided
          if (onProgress) {
            onProgress(progressData);
          }
        } else {
          failureCount++;
          logger.error(`[Upscale Batch ${batchId}] [${i + 1}/${requests.length}] ❌ Failed: ${result.error}`);

          const errorData: BatchUpscaleProgress = {
            sourceGenerationId: request.sourceGenerationId,
            success: false,
            error: result.error || "Unknown error",
            index: i + 1,
            total: requests.length,
          };

          // Broadcast error to all clients
          broadcastToAllWindows("veo3:batch:upscale:progress", errorData);
          logger.info(`[Upscale Batch ${batchId}] Broadcasted error event for: ${request.sourceGenerationId}`);

          // Call progress callback with error
          if (onProgress) {
            onProgress(errorData);
          }
        }

        // Add delay between requests (except after the last one)
        if (i < requests.length - 1) {
          logger.info(`[Upscale Batch ${batchId}] ⏳ Waiting ${delayMs}ms before next upscale...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        failureCount++;
        logger.error(`[Upscale Batch ${batchId}] [${i + 1}/${requests.length}] ❌ Exception:`, error);

        const exceptionData: BatchUpscaleProgress = {
          sourceGenerationId: request.sourceGenerationId,
          success: false,
          error: String(error),
          index: i + 1,
          total: requests.length,
        };

        broadcastToAllWindows("veo3:batch:upscale:progress", exceptionData);

        if (onProgress) {
          onProgress(exceptionData);
        }
      }
    }

    const completionData = {
      batchId,
      successCount,
      failureCount,
      total: requests.length,
    };

    // Broadcast batch completion to all clients
    broadcastToAllWindows("veo3:batch:upscale:completed", completionData);

    logger.info(
      `[Upscale Batch ${batchId}] Background processing completed: ${successCount} successful, ${failureCount} failed out of ${requests.length} total`
    );
  }
}

// Export singleton instance
export const veo3BatchUpscaleService = new VEO3BatchUpscaleService();
