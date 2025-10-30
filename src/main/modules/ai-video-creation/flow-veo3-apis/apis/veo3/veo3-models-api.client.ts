import { Logger } from "../../../../../../shared/utils/logger";
import { buildVEO3Headers } from "../../helpers/veo3-headers.helper";
import { VEO3ModelsAPIResponse } from "../../../../../../shared/types/veo3-models";

const logger = new Logger("VEO3ModelsApiClient");

/**
 * VEO3 Models API Client
 * Handles fetching available video models from Google Labs VEO3 API
 */
export class VEO3ModelsApiClient {
  private readonly baseUrl = "https://labs.google/fx/api/trpc";

  /**
   * Get all available video models from VEO3
   * @param cookie - Authentication cookie string from profile
   */
  async getVideoModels(cookie: string): Promise<{ success: boolean; data?: VEO3ModelsAPIResponse; error?: string }> {
    try {
      // Build the input parameter (null input for getVideoModelConfig)
      const inputParam = {
        json: null,
        meta: {
          values: ["undefined"],
        },
      };

      // URL encode the input parameter
      const encodedInput = encodeURIComponent(JSON.stringify(inputParam));
      const url = `${this.baseUrl}/videoFx.getVideoModelConfig?input=${encodedInput}`;

      logger.info(`Fetching VEO3 video models configuration`);
      logger.info(`VEO3 endpoint: ${url}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          ...buildVEO3Headers(cookie),
          priority: "u=1, i",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Failed to fetch video models: ${response.status} - ${errorText}`);
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // Read raw response text for debugging and parsing
      const rawText = await response.text();
      logger.info(`VEO3 models raw response length: ${rawText.length} bytes`);

      let data: VEO3ModelsAPIResponse | null = null;
      try {
        data = JSON.parse(rawText) as VEO3ModelsAPIResponse;
      } catch (parseErr) {
        logger.error("Failed to parse VEO3 models response JSON", parseErr);
        return {
          success: false,
          error: "Failed to parse response JSON",
        };
      }

      // Extract video models from response
      const models = data?.result?.data?.json?.result?.videoModels || [];
      logger.info(`Successfully fetched ${models.length} video models`);

      return {
        success: true,
        data,
      };
    } catch (error) {
      logger.error("Error fetching video models", error);
      return {
        success: false,
        error: String(error),
      };
    }
  }
}

export const veo3ModelsApiClient = new VEO3ModelsApiClient();
