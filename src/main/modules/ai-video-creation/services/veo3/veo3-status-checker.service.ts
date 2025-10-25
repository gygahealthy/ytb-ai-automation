import { ApiResponse } from "../../../../../shared/types";
import { logger } from "../../../../utils/logger-backend";
import { profileRepository } from "../../../../storage/database";
import { COOKIE_SERVICES } from "../../../gemini-apis/shared/types";
import { cookieService } from "../../../common/cookie/services/cookie.service";
import { veo3ApiClient } from "../../apis/veo3-api.client";
import { videoGenerationRepository } from "../../repository/video-generation.repository";
import { extractVideoMetadata } from "./veo3-video-creation.service";

/**
 * VEO3 Status Checker Service
 * Handles all video status checking and refresh operations
 */
export class VEO3StatusCheckerService {
  /**
   * Check video generation status by generation ID
   * @param generationId - Generation record ID from database
   * @returns Current status and video information
   */
  async checkGenerationStatus(generationId: string): Promise<ApiResponse<any>> {
    try {
      // Get generation record from database
      const generation = await videoGenerationRepository.getById(generationId);
      if (!generation) {
        return { success: false, error: "Generation record not found" };
      }

      // If already completed or failed, return cached status
      if (generation.status === "completed" || generation.status === "failed") {
        return {
          success: true,
          data: {
            status: generation.status,
            videoUrl: generation.videoUrl,
            videoPath: generation.videoPath,
            errorMessage: generation.errorMessage,
            completedAt: generation.completedAt,
          },
        };
      }

      // Get profile to retrieve bearer token
      const profile = await profileRepository.findById(generation.profileId);
      if (!profile) {
        return { success: false, error: "Profile not found" };
      }

      logger.info(`Checking video generation status for: ${generationId}`);

      // Get cookies for the profile
      const cookieResult = await cookieService.getCookiesByProfile(generation.profileId);
      if (!cookieResult.success || !cookieResult.data || cookieResult.data.length === 0) {
        return {
          success: false,
          error: "Profile has no cookies. Please login first.",
        };
      }

      // Find the "flow" service cookie
      const flowCookie = cookieResult.data.find((c) => c.service === COOKIE_SERVICES.FLOW && c.status === "active");
      if (!flowCookie || !flowCookie.rawCookieString) {
        return {
          success: false,
          error: "Profile has no active 'flow' cookies. Please login first.",
        };
      }

      // Extract Bearer token
      const tokenResult = await veo3ApiClient.extractBearerToken(flowCookie.rawCookieString);
      if (!tokenResult.success || !tokenResult.token) {
        return {
          success: false,
          error: tokenResult.error || "Failed to extract bearer token",
        };
      }

      const bearerToken = tokenResult.token;

      // Check video status via API
      const statusResult = await veo3ApiClient.checkVideoStatus(bearerToken, generation.operationName, generation.sceneId);
      if (!statusResult.success) {
        return {
          success: false,
          error: statusResult.error || "Failed to check video status",
        };
      }

      const statusData = statusResult.data;
      const mediaStatus = statusData?.mediaStatus || statusData?.status || "UNKNOWN";
      const rawData = statusData?.raw;

      logger.info(`Video status for ${generationId}: ${mediaStatus}`);

      // Update database based on status
      if (mediaStatus === "MEDIA_GENERATION_STATUS_SUCCESSFUL" || mediaStatus === "MEDIA_GENERATION_STATUS_COMPLETED") {
        const extracted = extractVideoMetadata(rawData);
        await videoGenerationRepository.updateStatus(generationId, "completed", {
          videoUrl: extracted.videoUrl,
          rawResponse: JSON.stringify(rawData),
        });

        logger.info(`✅ Video generation completed: ${generationId}`);
        return {
          success: true,
          data: {
            status: "completed",
            videoUrl: extracted.videoUrl,
            completedAt: new Date().toISOString(),
          },
        };
      } else if (mediaStatus === "MEDIA_GENERATION_STATUS_FAILED" || mediaStatus === "FAILED") {
        const errorMessage = statusData?.error || statusData?.errorMessage || "Unknown error";
        await videoGenerationRepository.updateStatus(generationId, "failed", {
          errorMessage,
          rawResponse: JSON.stringify(rawData),
        });

        logger.error(`❌ Video generation failed: ${generationId} - ${errorMessage}`);
        return {
          success: true,
          data: {
            status: "failed",
            errorMessage,
            completedAt: new Date().toISOString(),
          },
        };
      } else {
        // Still processing
        await videoGenerationRepository.updateStatus(generationId, generation.status, {
          rawResponse: JSON.stringify(rawData),
        });

        logger.info(`⏳ Video still processing: ${generationId}`);
        return {
          success: true,
          data: {
            status: "processing",
            message: "Video is still being generated",
          },
        };
      }
    } catch (error) {
      logger.error("Failed to check generation status", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Manually refresh video status by checking the API
   * @param operationName - VEO3 operation name
   * @param generationId - Generation record ID
   * @returns Updated status information
   */
  async refreshVideoStatus(operationName: string, generationId: string): Promise<ApiResponse<any>> {
    try {
      logger.info(`Manually refreshing video status for generation: ${generationId}`);

      // Get the generation record to find profile
      const generation = await videoGenerationRepository.getById(generationId);
      if (!generation) {
        return { success: false, error: "Generation record not found" };
      }

      // Get profile to fetch cookies
      const profile = await profileRepository.findById(generation.profileId);
      if (!profile) {
        return { success: false, error: "Profile not found" };
      }

      // Get cookies for the profile
      const cookieResult = await cookieService.getCookiesByProfile(generation.profileId);
      if (!cookieResult.success || !cookieResult.data || cookieResult.data.length === 0) {
        return {
          success: false,
          error: "Profile has no cookies. Please login first.",
        };
      }

      // Find the "flow" service cookie
      const flowCookie = cookieResult.data.find((c) => c.service === COOKIE_SERVICES.FLOW && c.status === "active");
      if (!flowCookie || !flowCookie.rawCookieString) {
        return {
          success: false,
          error: "Profile has no active 'flow' cookies. Please login first.",
        };
      }

      // Extract bearer token from Flow page
      const tokenResult = await veo3ApiClient.extractBearerToken(flowCookie.rawCookieString);
      if (!tokenResult.success || !tokenResult.token) {
        return {
          success: false,
          error: tokenResult.error || "Failed to extract bearer token",
        };
      }

      // Check status via API (bearerToken, operationName, sceneId)
      const statusResult = await veo3ApiClient.checkVideoStatus(tokenResult.token, operationName, generation.sceneId);

      if (!statusResult.success) {
        return {
          success: false,
          error: statusResult.error || "Failed to check video status",
        };
      }

      const { mediaStatus, status, errorMessage } = statusResult.data;
      const actualStatus = mediaStatus || status;
      const rawData = statusResult.data?.raw;

      // Use dedicated extraction function
      const extracted = extractVideoMetadata(rawData);

      // Update database based on status
      if (
        actualStatus === "MEDIA_GENERATION_STATUS_SUCCESSFUL" ||
        actualStatus === "MEDIA_GENERATION_STATUS_COMPLETED" ||
        status === "completed"
      ) {
        await videoGenerationRepository.updateStatus(generationId, "completed", {
          videoUrl: extracted.videoUrl,
          rawResponse: JSON.stringify(rawData),
        });

        logger.info(`✅ Video status refreshed - completed: ${generationId}`);
        return {
          success: true,
          data: {
            status: "completed",
            videoUrl: extracted.videoUrl,
            completedAt: new Date().toISOString(),
          },
        };
      } else if (actualStatus === "MEDIA_GENERATION_STATUS_FAILED" || actualStatus === "FAILED" || status === "failed") {
        await videoGenerationRepository.updateStatus(generationId, "failed", {
          errorMessage: errorMessage || "Unknown error",
          rawResponse: JSON.stringify(rawData),
        });

        logger.error(`❌ Video status refreshed - failed: ${generationId}`);
        return {
          success: true,
          data: {
            status: "failed",
            errorMessage: errorMessage || "Unknown error",
            completedAt: new Date().toISOString(),
          },
        };
      } else {
        // Still processing
        await videoGenerationRepository.updateStatus(generationId, generation.status, {
          rawResponse: JSON.stringify(rawData),
        });

        logger.info(`⏳ Video status refreshed - still processing: ${generationId}`);
        return {
          success: true,
          data: {
            status: "processing",
            message: "Video is still being generated",
          },
        };
      }
    } catch (error) {
      logger.error("Failed to refresh video status", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get all video generations (paginated)
   */
  async listGenerations(limit: number = 50, offset: number = 0): Promise<ApiResponse<any[]>> {
    try {
      const generations = await videoGenerationRepository.getAll(limit, offset);

      // Enrich returned rows: if a row is completed but missing videoUrl, try to extract from stored rawResponse
      const enriched = generations.map((g: any) => {
        if (g.status === "completed" && !g.videoUrl && g.rawResponse) {
          try {
            const parsed = JSON.parse(g.rawResponse);
            const extracted = extractVideoMetadata(parsed);
            if (extracted.videoUrl) {
              g.videoUrl = extracted.videoUrl;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
        return g;
      });

      return { success: true, data: enriched };
    } catch (error) {
      logger.error("Failed to list generations", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get video generations by profile
   */
  async listGenerationsByProfile(profileId: string, limit: number = 50, offset: number = 0): Promise<ApiResponse<any[]>> {
    try {
      const generations = await videoGenerationRepository.getByProfile(profileId, limit, offset);

      const enriched = generations.map((g: any) => {
        if (g.status === "completed" && !g.videoUrl && g.rawResponse) {
          try {
            const parsed = JSON.parse(g.rawResponse);
            const extracted = extractVideoMetadata(parsed);
            if (extracted.videoUrl) {
              g.videoUrl = extracted.videoUrl;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
        return g;
      });

      return { success: true, data: enriched };
    } catch (error) {
      logger.error("Failed to list generations by profile", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get video generation by ID
   */
  async getGenerationById(generationId: string): Promise<ApiResponse<any>> {
    try {
      const generation = await videoGenerationRepository.getById(generationId);
      if (!generation) {
        return { success: false, error: "Generation not found" };
      }

      // If completed but missing videoUrl, attempt to extract from stored rawResponse
      if (generation.status === "completed" && !generation.videoUrl && generation.rawResponse) {
        try {
          const parsed = JSON.parse(generation.rawResponse);
          const extracted = extractVideoMetadata(parsed);
          if (extracted.videoUrl) {
            generation.videoUrl = extracted.videoUrl;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      return { success: true, data: generation };
    } catch (error) {
      logger.error("Failed to get generation", error);
      return { success: false, error: String(error) };
    }
  }
}

// Export singleton instance
export const veo3StatusCheckerService = new VEO3StatusCheckerService();
