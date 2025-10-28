import { IpcRegistration } from "../../../../../core/ipc/types";
import { veo3VideoUpscaleService } from "../services/veo3-apis/veo3-video-upscale.service";
import { veo3PollingService } from "../services/veo3-apis/veo3-polling.service";
import { logger } from "../../../../utils/logger-backend";

/**
 * Export all upscale handler registrations
 */
export const videoUpscaleRegistrations: IpcRegistration[] = [
  // Start video upscale
  {
    channel: "veo3:upscale:start",
    description: "Start video upscale to higher resolution",
    handler: async (req: { sourceGenerationId: string; model?: string }) => {
      try {
        logger.info(`[IPC] Starting video upscale for generation: ${req.sourceGenerationId}`);

        const result = await veo3VideoUpscaleService.startVideoUpscale(
          req.sourceGenerationId,
          req.model || "veo_2_1080p_upsampler_8s"
        );

        if (result.success && result.data) {
          // Add to polling service for automatic status tracking
          veo3PollingService.addToPolling(result.data.upscaleId, undefined, "upscale");
          logger.info(`[IPC] Added upscale ${result.data.upscaleId} to polling queue`);
        }

        return result;
      } catch (error) {
        logger.error("[IPC] Error starting video upscale", error);
        return { success: false, error: String(error) };
      }
    },
  },

  // Check upscale status
  {
    channel: "veo3:upscale:checkStatus",
    description: "Check upscale status",
    handler: async (req: { upscaleId: string }) => {
      try {
        logger.info(`[IPC] Checking upscale status for: ${req.upscaleId}`);
        return await veo3VideoUpscaleService.checkUpscaleStatus(req.upscaleId);
      } catch (error) {
        logger.error("[IPC] Error checking upscale status", error);
        return { success: false, error: String(error) };
      }
    },
  },

  // Get upscale by ID
  {
    channel: "veo3:upscale:getById",
    description: "Get upscale by ID",
    handler: async (req: { upscaleId: string }) => {
      try {
        logger.info(`[IPC] Getting upscale by ID: ${req.upscaleId}`);
        return await veo3VideoUpscaleService.getUpscaleById(req.upscaleId);
      } catch (error) {
        logger.error("[IPC] Error getting upscale", error);
        return { success: false, error: String(error) };
      }
    },
  },

  // Get upscales by source generation ID
  {
    channel: "veo3:upscale:getBySourceGeneration",
    description: "Get upscales by source generation ID",
    handler: async (req: { sourceGenerationId: string }) => {
      try {
        logger.info(`[IPC] Getting upscales for source generation: ${req.sourceGenerationId}`);
        return await veo3VideoUpscaleService.getUpscalesBySourceGeneration(req.sourceGenerationId);
      } catch (error) {
        logger.error("[IPC] Error getting upscales by source generation", error);
        return { success: false, error: String(error) };
      }
    },
  },

  // Get upscales by profile ID
  {
    channel: "veo3:upscale:getByProfile",
    description: "Get upscales by profile ID",
    handler: async (req: { profileId: string; limit?: number; offset?: number }) => {
      try {
        logger.info(`[IPC] Getting upscales for profile: ${req.profileId}`);
        return await veo3VideoUpscaleService.getUpscalesByProfile(req.profileId, req.limit || 50, req.offset || 0);
      } catch (error) {
        logger.error("[IPC] Error getting upscales by profile", error);
        return { success: false, error: String(error) };
      }
    },
  },
];
