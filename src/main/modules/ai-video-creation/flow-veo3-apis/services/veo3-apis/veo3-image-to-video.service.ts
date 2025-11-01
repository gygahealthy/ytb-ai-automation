import { randomBytes } from "crypto";
import { ApiResponse } from "../../../../../../shared/types";
import { logger } from "../../../../../utils/logger-backend";
import { profileRepository } from "../../../../profile-management/repository/profile.repository";
import { COOKIE_SERVICES } from "../../../../gemini-apis/shared/types";
import { cookieService } from "../../../../common/cookie/services/cookie.service";
import { veo3ApiClient } from "../../apis/veo3-api.client";
import { videoGenerationRepository } from "../../repository/video-generation.repository";
import { veo3PollingManager } from "./veo3-polling-manager.service";

export interface ImageReference {
  mediaId: string; // From veo3_image_generations.media_key
  imageId: string; // From veo3_image_generations.id (for tracking)
}

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

      // Generate scene ID and seed
      const seed = this.generateSeed();
      const sceneId = this.generateSceneId();

      // Call VEO3 API endpoint for image-based generation
      const generateResult = await this.callImageToVideoAPI(
        bearerToken,
        projectId,
        prompt,
        imageReferences,
        aspectRatio,
        seed,
        sceneId,
        model
      );

      if (!generateResult.success) {
        return {
          success: false,
          error: generateResult.error || "Failed to start video generation from images",
        };
      }

      const { data } = generateResult;
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

  /**
   * Call VEO3 API endpoint for image-based video generation
   * Based on: https://aisandbox-pa.googleapis.com/v1/video:batchAsyncGenerateVideoReferenceImages
   */
  private async callImageToVideoAPI(
    bearerToken: string,
    projectId: string,
    prompt: string,
    imageReferences: ImageReference[],
    aspectRatio: string,
    seed: number,
    sceneId: string,
    model: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const url = "https://aisandbox-pa.googleapis.com/v1/video:batchAsyncGenerateVideoReferenceImages";

      const payload = {
        clientContext: {
          projectId,
          tool: "PINHOLE",
          userPaygateTier: "PAYGATE_TIER_TWO",
        },
        requests: [
          {
            aspectRatio,
            metadata: {
              sceneId,
            },
            referenceImages: imageReferences.map((img) => ({
              imageUsageType: "IMAGE_USAGE_TYPE_ASSET",
              mediaId: img.mediaId,
            })),
            seed,
            textInput: {
              prompt,
            },
            videoModelKey: model || "veo_3_0_r2v_fast_ultra", // Default model
          },
        ],
      };

      logger.info(`Calling VEO3 image-to-video API (sceneId: ${sceneId}, seed: ${seed})`);
      logger.info(`Prompt: ${prompt.substring(0, 100)}...`);
      logger.info(`Image references: ${imageReferences.length}`);
      logger.info(`Image references details: ${JSON.stringify(imageReferences)}`);
      logger.info(`Model: ${model}, Aspect Ratio: ${aspectRatio}`);
      logger.info(`Full payload: ${JSON.stringify(payload, null, 2)}`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9",
          authorization: `Bearer ${bearerToken}`,
          "content-type": "text/plain;charset=UTF-8",
          origin: "https://labs.google",
          referer: "https://labs.google/",
        },
        body: JSON.stringify(payload),
      });

      const rawText = await response.text();
      logger.info(`Image-to-video generation response (${response.status}): ${rawText.substring(0, 500)}`);

      if (!response.ok) {
        logger.error(`Failed to generate video from images: ${response.status} - ${rawText}`);

        // Try to parse error message from response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(rawText);
          if (errorData?.error?.message) {
            errorMessage = `${errorMessage} - ${errorData.error.message}`;
          }
        } catch (parseErr) {
          // Ignore parse errors, use default message
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        logger.error("Failed to parse image-to-video generation response JSON", parseErr);
      }

      // Extract operation name (job ID) from response
      const operationName = data?.operations?.[0]?.operation?.name;
      logger.info(`Image-to-video generation started. Operation: ${operationName}`);

      return {
        success: true,
        data: {
          name: operationName,
          operationName,
          sceneId,
          seed,
          raw: data,
        },
      };
    } catch (error) {
      logger.error("Error calling image-to-video API", error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Generate a random seed number for video generation (0 to 2^16)
   */
  private generateSeed(): number {
    return randomBytes(2).readUInt16BE(0);
  }

  /**
   * Generate UUID v4 for scene ID
   */
  private generateSceneId(): string {
    const bytes = randomBytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = bytes.toString("hex");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }
}

export const veo3ImageToVideoService = new VEO3ImageToVideoService();
