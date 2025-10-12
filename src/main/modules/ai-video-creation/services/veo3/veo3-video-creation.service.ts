import { randomBytes } from "crypto";
import { ApiResponse } from "../../../../../shared/types";
import { Logger } from "../../../../../shared/utils/logger";
import { profileRepository } from "../../../../storage/database";
import { veo3ApiClient } from "../../apis/veo3-api.client";
import { videoGenerationRepository } from "../../repository/video-generation.repository";

const logger = new Logger("VEO3VideoCreationService");

/**
 * Extract video metadata from VEO3 API response
 * Handles the complex nested structure of the API response
 */
export interface ExtractedVideoMetadata {
  mediaGenerationId?: string;
  fifeUrl?: string;
  servingBaseUri?: string;
  videoUrl: string;
  status: string;
}

export function extractVideoMetadata(rawData: any): ExtractedVideoMetadata {
  logger.info("[extractVideoMetadata] Starting extraction from raw data");

  const operation = rawData?.operations?.[0];
  if (!operation) {
    logger.warn("[extractVideoMetadata] No operation found in response");
    return { videoUrl: "", status: "UNKNOWN" };
  }

  // Extract status
  const status = operation?.status || "UNKNOWN";
  logger.info(`[extractVideoMetadata] Status: ${status}`);

  // Extract from operation.operation.metadata.video (primary source)
  const metadata = operation?.operation?.metadata;
  const video = metadata?.video;

  const mediaGenerationId = video?.mediaGenerationId || operation?.mediaGenerationId;
  const fifeUrl = video?.fifeUrl;
  const servingBaseUri = video?.servingBaseUri;

  // Fallback video URL extraction
  const videoUrl =
    fifeUrl || servingBaseUri || video?.url || operation?.videoUrl || operation?.fireUrl || operation?.servingUrl || "";

  // Log what we found
  logger.info(`[extractVideoMetadata] Extracted values:`);
  logger.info(`  - mediaGenerationId: ${mediaGenerationId ? mediaGenerationId.substring(0, 40) + "..." : "NOT FOUND"}`);
  logger.info(`  - fifeUrl: ${fifeUrl ? fifeUrl.substring(0, 60) + "..." : "NOT FOUND"}`);
  logger.info(`  - servingBaseUri: ${servingBaseUri ? servingBaseUri.substring(0, 60) + "..." : "NOT FOUND"}`);
  logger.info(`  - videoUrl (final): ${videoUrl ? videoUrl.substring(0, 60) + "..." : "NOT FOUND"}`);

  return {
    mediaGenerationId,
    fifeUrl,
    servingBaseUri,
    videoUrl,
    status,
  };
}

/**
 * VEO3 Video Creation Service
 * Handles all video generation and status tracking operations
 */
export class VEO3VideoCreationService {
  /**
   * Start video generation process
   * @param profileId - Profile ID to get cookies from
   * @param projectId - VEO3 Flow project ID
   * @param prompt - Text prompt for video generation
   * @param aspectRatio - Video aspect ratio
   */
  async startVideoGeneration(
    profileId: string,
    projectId: string,
    prompt: string,
    aspectRatio:
      | "VIDEO_ASPECT_RATIO_LANDSCAPE"
      | "VIDEO_ASPECT_RATIO_PORTRAIT"
      | "VIDEO_ASPECT_RATIO_SQUARE" = "VIDEO_ASPECT_RATIO_LANDSCAPE"
  ): Promise<ApiResponse<{ generationId: string; sceneId: string; operationName: string }>> {
    try {
      // Get profile to retrieve cookies
      const profile = await profileRepository.findById(profileId);
      if (!profile) {
        return { success: false, error: "Profile not found" };
      }

      if (!profile.cookies) {
        return { success: false, error: "Profile has no cookies. Please login first." };
      }

      if (!profile.isLoggedIn) {
        return { success: false, error: "Profile is not logged in. Please login first." };
      }

      // Check if cookies are expired
      if (profile.cookieExpires && new Date(profile.cookieExpires) < new Date()) {
        return { success: false, error: "Profile cookies have expired. Please login again." };
      }

      logger.info(`Starting video generation for profile: ${profile.name}, project: ${projectId}`);

      // Step 1: Extract Bearer token from Flow page
      const tokenResult = await veo3ApiClient.extractBearerToken(profile.cookies);
      if (!tokenResult.success || !tokenResult.token) {
        return { success: false, error: tokenResult.error || "Failed to extract bearer token" };
      }

      const bearerToken = tokenResult.token;
      logger.info(`Bearer token extracted successfully`);

      // Step 2: Call video generation API
      const generateResult = await veo3ApiClient.generateVideo(bearerToken, projectId, prompt, aspectRatio);
      if (!generateResult.success) {
        return { success: false, error: generateResult.error || "Failed to start video generation" };
      }

      const { sceneId, seed, data } = generateResult;
      const operationName = data?.name || data?.operationName || "";

      if (!sceneId || !seed || !operationName) {
        return { success: false, error: "Invalid response from video generation API" };
      }

      logger.info(`Video generation started: operationName=${operationName}, sceneId=${sceneId}, seed=${seed}`);

      // Step 3: Persist to database
      const generationId = randomBytes(16).toString("hex");
      await videoGenerationRepository.create({
        id: generationId,
        profileId,
        projectId,
        sceneId,
        operationName,
        prompt,
        seed,
        aspectRatio,
        status: "pending",
        rawResponse: JSON.stringify(data),
      });

      logger.info(`Video generation record created: ${generationId}`);

      return {
        success: true,
        data: {
          generationId,
          sceneId,
          operationName,
        },
      };
    } catch (error) {
      logger.error("Failed to start video generation", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Check video generation status
   * @param generationId - Generation record ID
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

      // Get profile to retrieve cookies and bearer token
      const profile = await profileRepository.findById(generation.profileId);
      if (!profile) {
        return { success: false, error: "Profile not found" };
      }

      if (!profile.cookies) {
        return { success: false, error: "Profile has no cookies. Please login first." };
      }

      logger.info(`Checking video generation status for: ${generationId}`);

      // Extract Bearer token
      const tokenResult = await veo3ApiClient.extractBearerToken(profile.cookies);
      if (!tokenResult.success || !tokenResult.token) {
        return { success: false, error: tokenResult.error || "Failed to extract bearer token" };
      }

      const bearerToken = tokenResult.token;

      // Check video status via API
      const statusResult = await veo3ApiClient.checkVideoStatus(bearerToken, generation.operationName, generation.sceneId);
      if (!statusResult.success) {
        return { success: false, error: statusResult.error || "Failed to check video status" };
      }

      const statusData = statusResult.data;
      const mediaStatus = statusData?.mediaStatus || statusData?.status || "UNKNOWN";
      const rawData = statusData?.raw;

      logger.info(`Video status for ${generationId}: ${mediaStatus}`);

      // Update database based on status
      if (mediaStatus === "MEDIA_GENERATION_STATUS_SUCCESSFUL" || mediaStatus === "MEDIA_GENERATION_STATUS_COMPLETED") {
        // Use dedicated extraction function
        const extracted = extractVideoMetadata(rawData);

        await videoGenerationRepository.updateStatus(generationId, "completed", {
          mediaGenerationId: extracted.mediaGenerationId,
          fifeUrl: extracted.fifeUrl,
          servingBaseUri: extracted.servingBaseUri,
          videoUrl: extracted.videoUrl,
          rawResponse: JSON.stringify(statusData),
        });

        logger.info(`Video generation completed: ${generationId}`);
        logger.info(`Video URL: ${extracted.videoUrl}`);

        return {
          success: true,
          data: {
            status: "completed",
            videoUrl: extracted.videoUrl,
            mediaGenerationId: extracted.mediaGenerationId,
            fifeUrl: extracted.fifeUrl,
            servingBaseUri: extracted.servingBaseUri,
            completedAt: new Date().toISOString(),
          },
        };
      } else if (mediaStatus === "MEDIA_GENERATION_STATUS_FAILED" || mediaStatus === "FAILED") {
        const errorMessage = statusData?.error || statusData?.errorMessage || "Video generation failed";

        await videoGenerationRepository.updateStatus(generationId, "failed", {
          errorMessage,
          rawResponse: JSON.stringify(statusData),
        });

        logger.error(`Video generation failed: ${generationId} - ${errorMessage}`);

        return {
          success: false,
          error: errorMessage,
        };
      } else {
        // Still processing
        await videoGenerationRepository.updateStatus(generationId, "processing", {
          rawResponse: JSON.stringify(statusData),
        });

        return {
          success: true,
          data: {
            status: "processing",
          },
        };
      }
    } catch (error) {
      logger.error("Failed to check generation status", error);
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
        try {
          if ((g.status === "completed" || g.status === "failed") && (!g.videoUrl || g.videoUrl === "") && g.rawResponse) {
            const parsed = typeof g.rawResponse === "string" ? JSON.parse(g.rawResponse) : g.rawResponse;
            // statusResult.data was stored in rawResponse previously; prefer parsed.raw (the operation payload) if present
            const rawData = parsed?.raw || parsed;
            const extracted = extractVideoMetadata(rawData);
            if (extracted?.videoUrl) g.videoUrl = extracted.videoUrl;
            if (extracted?.fifeUrl) g.fifeUrl = extracted.fifeUrl;
            if (extracted?.servingBaseUri) g.servingBaseUri = extracted.servingBaseUri;
          }
        } catch (e) {
          logger.warn("Failed to enrich generation with extracted video metadata", e);
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
        try {
          if ((g.status === "completed" || g.status === "failed") && (!g.videoUrl || g.videoUrl === "") && g.rawResponse) {
            const parsed = typeof g.rawResponse === "string" ? JSON.parse(g.rawResponse) : g.rawResponse;
            const rawData = parsed?.raw || parsed;
            const extracted = extractVideoMetadata(rawData);
            if (extracted?.videoUrl) g.videoUrl = extracted.videoUrl;
            if (extracted?.fifeUrl) g.fifeUrl = extracted.fifeUrl;
            if (extracted?.servingBaseUri) g.servingBaseUri = extracted.servingBaseUri;
          }
        } catch (e) {
          logger.warn("Failed to enrich generation with extracted video metadata", e);
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
      try {
        if ((generation.status === "completed" || generation.status === "failed") && (!generation.videoUrl || generation.videoUrl === "") && generation.rawResponse) {
          const parsed = typeof generation.rawResponse === "string" ? JSON.parse(generation.rawResponse) : generation.rawResponse;
          const rawData = parsed?.raw || parsed;
          const extracted = extractVideoMetadata(rawData);
          if (extracted?.videoUrl) generation.videoUrl = extracted.videoUrl;
          if (extracted?.fifeUrl) generation.fifeUrl = extracted.fifeUrl;
          if (extracted?.servingBaseUri) generation.servingBaseUri = extracted.servingBaseUri;
        }
      } catch (e) {
        logger.warn("Failed to enrich generation with extracted video metadata", e);
      }

      return { success: true, data: generation };
    } catch (error) {
      logger.error("Failed to get generation", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Manually refresh video status by checking the API
   */
  async refreshVideoStatus(operationName: string, generationId: string): Promise<ApiResponse<any>> {
    try {
      logger.info(`Manually refreshing video status for generation: ${generationId}`);

      // Get the generation record to find profile
      const generation = await videoGenerationRepository.getById(generationId);
      if (!generation) {
        return { success: false, error: "Generation not found" };
      }

      // Get profile to fetch cookies
      const profile = await profileRepository.findById(generation.profileId);
      if (!profile) {
        return { success: false, error: "Profile not found" };
      }

      // Extract bearer token from Flow page
      if (!profile.cookies) {
        return { success: false, error: "Profile has no cookies" };
      }

      const tokenResult = await veo3ApiClient.extractBearerToken(profile.cookies);
      if (!tokenResult.success || !tokenResult.token) {
        return { success: false, error: tokenResult.error || "Failed to extract bearer token" };
      }

      // Check status via API (bearerToken, operationName, sceneId)
      const statusResult = await veo3ApiClient.checkVideoStatus(tokenResult.token, operationName, generation.sceneId);

      if (!statusResult.success) {
        logger.error(`Failed to check video status: ${statusResult.error}`);
        return statusResult;
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
          mediaGenerationId: extracted.mediaGenerationId,
          fifeUrl: extracted.fifeUrl,
          servingBaseUri: extracted.servingBaseUri,
          videoUrl: extracted.videoUrl,
          rawResponse: JSON.stringify(statusResult.data),
        });

        logger.info(`Video generation completed: ${generationId}`);

        return {
          success: true,
          data: {
            status: "completed",
            videoUrl: extracted.videoUrl,
            mediaGenerationId: extracted.mediaGenerationId,
            fifeUrl: extracted.fifeUrl,
            servingBaseUri: extracted.servingBaseUri,
            mediaStatus: actualStatus,
          },
        };
      } else if (actualStatus === "MEDIA_GENERATION_STATUS_FAILED" || actualStatus === "FAILED" || status === "failed") {
        await videoGenerationRepository.updateStatus(generationId, "failed", {
          errorMessage,
          rawResponse: JSON.stringify(statusResult.data),
        });

        logger.error(`Video generation failed: ${generationId} - ${errorMessage}`);

        return {
          success: false,
          error: errorMessage,
          data: {
            status: "failed",
            errorMessage,
          },
        };
      } else {
        // Still processing
        await videoGenerationRepository.updateStatus(generationId, "processing", {
          rawResponse: JSON.stringify(statusResult.data),
        });

        return {
          success: true,
          data: {
            status: "processing",
            mediaStatus: actualStatus,
          },
        };
      }
    } catch (error) {
      logger.error("Failed to refresh video status", error);
      return { success: false, error: String(error) };
    }
  }
}

export const veo3VideoCreationService = new VEO3VideoCreationService();
