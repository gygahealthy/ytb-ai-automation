import { randomBytes } from "crypto";
import { ApiResponse } from "../../../../../../shared/types";
import { logger } from "../../../../../utils/logger-backend";
import { profileRepository } from "../../../../profile-management/repository/profile.repository";
import { COOKIE_SERVICES } from "../../../../gemini-apis/shared/types";
import { cookieService } from "../../../../common/cookie/services/cookie.service";
import { veo3ApiClient } from "../../apis/veo3-api.client";
import { veo3ImageToVideoApiClient, type ImageReference } from "../../apis/veo3/veo3-image-to-video-api.client";
import { videoGenerationRepository } from "../../repository/video-generation.repository";
import { veo3PollingManager } from "./veo3-polling-manager.service";

// Re-export ImageReference for backward compatibility
export type { ImageReference } from "../../apis/veo3/veo3-image-to-video-api.client";

/**
 * VEO3 Image-to-Video Generation Service
 *
 * Handles video generation from reference images (up to 3 images)
 * Using VEO3's batchAsyncGenerateVideoReferenceImages endpoint
 */
export class VEO3ImageToVideoService {
  /**
   * Generate video from reference images
   *
   * @param profileId - Profile ID for authentication
   * @param projectId - VEO3 project ID
   * @param prompt - Text prompt for video generation
   * @param imageReferences - Array of image references (1-3 images)
   * @param aspectRatio - Video aspect ratio
   * @param model - VEO3 model key (default: veo_3_1_i2v_s_fast_ultra)
   * @returns Generation ID, scene ID, and operation name
   */
  async generateVideoFromImages(
    profileId: string,
    projectId: string,
    prompt: string,
    imageReferences: ImageReference[],
    aspectRatio:
      | "VIDEO_ASPECT_RATIO_LANDSCAPE"
      | "VIDEO_ASPECT_RATIO_PORTRAIT"
      | "VIDEO_ASPECT_RATIO_SQUARE" = "VIDEO_ASPECT_RATIO_LANDSCAPE",
    model: string = "veo_3_1_i2v_s_fast_ultra"
  ): Promise<
    ApiResponse<{
      generationId: string;
      sceneId: string;
      operationName: string;
    }>
  > {
    try {
      // Validate image references count (1-3 images)
      if (!imageReferences || imageReferences.length === 0) {
        return { success: false, error: "At least one image reference is required" };
      }
      if (imageReferences.length > 3) {
        return { success: false, error: "Maximum 3 image references allowed" };
      }

      const profile = await profileRepository.findById(profileId);
      if (!profile) {
        return { success: false, error: "Profile not found" };
      }

      logger.info(
        `Starting image-to-video generation for profile: ${profile.name}, project: ${projectId}, images: ${imageReferences.length}`
      );

      // Get cookies for the profile
      const cookieResult = await cookieService.getCookiesByProfile(profileId);
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

      // Call image-to-video API client
      const generateResult = await veo3ImageToVideoApiClient.generateVideoFromImages(
        bearerToken,
        projectId,
        prompt,
        imageReferences,
        aspectRatio,
        model
      );

      if (!generateResult.success) {
        return {
          success: false,
          error: generateResult.error || "Failed to start video generation from images",
        };
      }

      const { sceneId, seed, data } = generateResult;
      const operationName = data?.name || data?.operationName || "";

      if (!sceneId || !seed || !operationName) {
        return {
          success: false,
          error: "Invalid response from video generation API",
        };
      }

      logger.info(`Image-to-video generation started: operationName=${operationName}, sceneId=${sceneId}`);

      // Create database record
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
        model,
        status: "pending",
        generationType: "image-reference",
        imageReferences: JSON.stringify(imageReferences.map((img) => img.imageId)),
        rawResponse: JSON.stringify(data),
      });

      // Add to polling manager (worker thread - non-blocking)
      veo3PollingManager.addToPolling(generationId, undefined, "generation", profileId, operationName, sceneId);
      logger.info(`Added image-to-video generation ${generationId} to polling worker thread`);

      return { success: true, data: { generationId, sceneId, operationName } };
    } catch (error) {
      logger.error("Failed to start image-to-video generation", error);
      return { success: false, error: String(error) };
    }
  }
}

export const veo3ImageToVideoService = new VEO3ImageToVideoService();
