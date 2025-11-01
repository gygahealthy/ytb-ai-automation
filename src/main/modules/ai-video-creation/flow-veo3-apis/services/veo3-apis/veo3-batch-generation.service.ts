import { randomBytes } from "crypto";
import { BrowserWindow } from "electron";
import { ApiResponse } from "../../../../../../shared/types";
import { logger } from "../../../../../utils/logger-backend";
import { veo3VideoCreationService } from "./veo3-video-creation.service";
import { veo3PollingManager } from "./veo3-polling-manager.service";

export interface BatchGenerationRequest {
  promptId: string;
  profileId: string;
  projectId: string;
  prompt: string;
  aspectRatio?: "VIDEO_ASPECT_RATIO_LANDSCAPE" | "VIDEO_ASPECT_RATIO_PORTRAIT" | "VIDEO_ASPECT_RATIO_SQUARE";
  model?: string;
}

export interface BatchGenerationProgress {
  promptId: string;
  success: boolean;
  generationId?: string;
  sceneId?: string;
  operationName?: string;
  error?: string;
  index: number;
  total: number;
}

export type BatchProgressCallback = (progress: BatchGenerationProgress) => void;

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
 * VEO3 Batch Generation Service
 * Handles multiple video generation requests with delays and progress tracking
 */
export class VEO3BatchGenerationService {
  /**
   * Generate multiple videos asynchronously (non-blocking)
   * Returns immediately and processes videos in the background
   *
   * @param requests - Array of video generation requests
   * @param delayMs - Delay in milliseconds between each request (default: 1500ms)
   * @param onProgress - Callback function for progress updates (optional)
   * @returns Batch ID and total count
   */
  async generateMultipleVideosAsync(
    requests: BatchGenerationRequest[],
    delayMs: number = 1500,
    onProgress?: BatchProgressCallback
  ): Promise<ApiResponse<{ batchId: string; total: number }>> {
    try {
      const batchId = randomBytes(8).toString("hex");
      logger.info(`Starting async batch (${batchId}) for ${requests.length} videos with ${delayMs}ms delay`);

      // Send immediate event to all clients that batch has started
      broadcastToAllWindows("veo3:batch:started", {
        batchId,
        total: requests.length,
        requestIds: requests.map((r) => r.promptId),
      });
      logger.info(`[Batch ${batchId}] Sent batch-started event to all clients`);

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
      logger.error("Failed to start async batch generation", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Generate multiple videos synchronously (blocking)
   * Waits for all videos to be generated before returning
   *
   * @param requests - Array of video generation requests (without promptId)
   * @param delayMs - Delay in milliseconds between each request (default: 1500ms)
   * @returns Array of generation results
   */
  async generateMultipleVideosSync(
    requests: Array<{
      profileId: string;
      projectId: string;
      prompt: string;
      aspectRatio?: "VIDEO_ASPECT_RATIO_LANDSCAPE" | "VIDEO_ASPECT_RATIO_PORTRAIT" | "VIDEO_ASPECT_RATIO_SQUARE";
      model?: string;
    }>,
    delayMs: number = 1500
  ): Promise<
    ApiResponse<
      Array<{
        success: boolean;
        generationId?: string;
        sceneId?: string;
        operationName?: string;
        error?: string;
        prompt: string;
      }>
    >
  > {
    try {
      logger.info(`Starting sync batch generation for ${requests.length} videos with ${delayMs}ms delay`);

      const results: Array<{
        success: boolean;
        generationId?: string;
        sceneId?: string;
        operationName?: string;
        error?: string;
        prompt: string;
      }> = [];

      for (let i = 0; i < requests.length; i++) {
        const request = requests[i];
        logger.info(`[${i + 1}/${requests.length}] Generating video for prompt: ${request.prompt.substring(0, 50)}...`);

        try {
          const result = await veo3VideoCreationService.startVideoGeneration(
            request.profileId,
            request.projectId,
            request.prompt,
            request.aspectRatio || "VIDEO_ASPECT_RATIO_LANDSCAPE",
            request.model // Pass the model parameter
          );

          if (result.success && result.data) {
            logger.info(`[${i + 1}/${requests.length}] ✅ Success: ${result.data.generationId}`);
            results.push({
              success: true,
              generationId: result.data.generationId,
              sceneId: result.data.sceneId,
              operationName: result.data.operationName,
              prompt: request.prompt,
            });
          } else {
            logger.error(`[${i + 1}/${requests.length}] ❌ Failed: ${result.error}`);
            results.push({
              success: false,
              error: result.error || "Unknown error",
              prompt: request.prompt,
            });
          }

          // Add delay between requests (except after the last one)
          if (i < requests.length - 1) {
            logger.info(`⏳ Waiting ${delayMs}ms before next request...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        } catch (error) {
          logger.error(`[${i + 1}/${requests.length}] ❌ Exception:`, error);
          results.push({
            success: false,
            error: String(error),
            prompt: request.prompt,
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      logger.info(`Sync batch completed: ${successCount} successful, ${failureCount} failed`);

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      logger.error("Failed to generate multiple videos", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Process batch generation in background
   * This runs asynchronously and calls onProgress for each completed request
   */
  private async processBatchInBackground(
    batchId: string,
    requests: BatchGenerationRequest[],
    delayMs: number,
    onProgress?: BatchProgressCallback
  ): Promise<void> {
    let successCount = 0;
    let failureCount = 0;

    logger.info(`[Batch ${batchId}] Background processing started`);

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      logger.info(`[Batch ${batchId}] [${i + 1}/${requests.length}] Processing promptId: ${request.promptId}`);

      try {
        const result = await veo3VideoCreationService.startVideoGeneration(
          request.profileId,
          request.projectId,
          request.prompt,
          request.aspectRatio || "VIDEO_ASPECT_RATIO_LANDSCAPE",
          request.model // Pass the model parameter
        );

        if (result.success && result.data) {
          successCount++;
          logger.info(`[Batch ${batchId}] [${i + 1}/${requests.length}] ✅ Success: ${result.data.generationId}`);

          // Add to backend polling service immediately (worker thread - non-blocking)
          veo3PollingManager.addToPolling(
            result.data.generationId,
            request.promptId,
            "generation",
            request.profileId,
            result.data.operationName,
            result.data.sceneId
          );
          logger.info(`[Batch ${batchId}] Added ${result.data.generationId} to backend polling queue (worker thread)`);

          const progressData: BatchGenerationProgress = {
            promptId: request.promptId,
            success: true,
            generationId: result.data.generationId,
            sceneId: result.data.sceneId,
            operationName: result.data.operationName,
            index: i + 1,
            total: requests.length,
          };

          // Send immediate event to ALL clients (not just the one that made the request)
          // This allows page refreshes to still receive updates
          broadcastToAllWindows("veo3:multipleVideos:progress", progressData);
          logger.info(`[Batch ${batchId}] Broadcasted progress event for promptId: ${request.promptId}`);

          // Also call the callback if provided (for the original requester)
          if (onProgress) {
            onProgress(progressData);
          }
        } else {
          failureCount++;
          logger.error(`[Batch ${batchId}] [${i + 1}/${requests.length}] ❌ Failed: ${result.error}`);

          const errorData: BatchGenerationProgress = {
            promptId: request.promptId,
            success: false,
            error: result.error || "Unknown error",
            index: i + 1,
            total: requests.length,
          };

          // Broadcast error to all clients
          broadcastToAllWindows("veo3:multipleVideos:progress", errorData);
          logger.info(`[Batch ${batchId}] Broadcasted error event for promptId: ${request.promptId}`);

          // Call progress callback with error
          if (onProgress) {
            onProgress(errorData);
          }
        }

        // Add delay between requests (except after the last one)
        if (i < requests.length - 1) {
          logger.info(`[Batch ${batchId}] ⏳ Waiting ${delayMs}ms before next request...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        failureCount++;
        logger.error(`[Batch ${batchId}] [${i + 1}/${requests.length}] ❌ Exception:`, error);

        const exceptionData: BatchGenerationProgress = {
          promptId: request.promptId,
          success: false,
          error: String(error),
          index: i + 1,
          total: requests.length,
        };

        broadcastToAllWindows("veo3:multipleVideos:progress", exceptionData);

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
    broadcastToAllWindows("veo3:batch:completed", completionData);

    logger.info(
      `[Batch ${batchId}] Background processing completed: ${successCount} successful, ${failureCount} failed out of ${requests.length} total`
    );
  }
}

// Export singleton instance
export const veo3BatchGenerationService = new VEO3BatchGenerationService();
