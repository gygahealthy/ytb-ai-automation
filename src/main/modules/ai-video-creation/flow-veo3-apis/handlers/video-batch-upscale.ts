import { IpcRegistration } from "../../../../../core/ipc/types";
import { veo3BatchUpscaleService } from "../services/veo3-apis/veo3-batch-upscale.service";
import { logger } from "../../../../utils/logger-backend";

/**
 * Export all batch upscale handler registrations
 */
export const videoBatchUpscaleRegistrations: IpcRegistration[] = [
  // Upscale multiple videos asynchronously
  {
    channel: "veo3:upscale:multipleAsync",
    description: "Upscale multiple videos async with delays (returns immediately, sends progress events)",
    handler: async (req: { requests: Array<{ sourceGenerationId: string; model?: string }>; delayMs?: number }) => {
      try {
        logger.info(`[IPC] Starting async batch upscale for ${(req as any).requests?.length || 0} videos`);
        return await veo3BatchUpscaleService.upscaleMultipleVideosAsync((req as any).requests, (req as any).delayMs || 1500);
      } catch (error) {
        logger.error("[IPC] Error starting async batch upscale", error);
        return { success: false, error: String(error) };
      }
    },
  },

  // Upscale multiple videos synchronously
  {
    channel: "veo3:upscale:multipleSync",
    description: "Upscale multiple videos sync (blocking until all upscales are initiated)",
    handler: async (req: { requests: Array<{ sourceGenerationId: string; model?: string }>; delayMs?: number }) => {
      try {
        logger.info(`[IPC] Starting sync batch upscale for ${(req as any).requests?.length || 0} videos`);
        return await veo3BatchUpscaleService.upscaleMultipleVideosSync((req as any).requests, (req as any).delayMs || 1500);
      } catch (error) {
        logger.error("[IPC] Error starting sync batch upscale", error);
        return { success: false, error: String(error) };
      }
    },
  },
];
