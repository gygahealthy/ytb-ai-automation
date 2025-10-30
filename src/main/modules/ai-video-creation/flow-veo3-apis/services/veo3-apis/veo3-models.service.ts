import { Logger } from "../../../../../../shared/utils/logger";
import { veo3ModelsApiClient } from "../../apis/veo3/veo3-models-api.client";
import { VEO3Model } from "../../../../../../shared/types/veo3-models";

const logger = new Logger("VEO3ModelsService");

/**
 * VEO3 Models Service
 * Business logic for managing VEO3 video model configurations
 */
export class VEO3ModelsService {
  /**
   * Fetch all video models from VEO3 API
   * @param cookie - Authentication cookie string from profile
   */
  async syncModels(cookie: string): Promise<{ success: boolean; data?: VEO3Model[]; error?: string }> {
    try {
      logger.info("Syncing VEO3 models from API");

      const result = await veo3ModelsApiClient.getVideoModels(cookie);

      if (!result.success || !result.data) {
        logger.error(`Failed to sync models: ${result.error}`);
        return {
          success: false,
          error: result.error || "Failed to fetch models from API",
        };
      }

      const models = result.data.result.data.json.result.videoModels;
      logger.info(`Successfully synced ${models.length} models`);

      return {
        success: true,
        data: models,
      };
    } catch (error) {
      logger.error("Error syncing models", error);
      return {
        success: false,
        error: String(error),
      };
    }
  }
}

export const veo3ModelsService = new VEO3ModelsService();
