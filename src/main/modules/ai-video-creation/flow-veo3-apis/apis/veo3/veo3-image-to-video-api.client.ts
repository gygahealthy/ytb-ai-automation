import { randomBytes } from "crypto";
import { Logger } from "../../../../../../shared/utils/logger";

const logger = new Logger("VEO3ImageToVideoApiClient");

export interface ImageReference {
  mediaId: string; // From veo3_image_generations.media_key
  imageId: string; // From veo3_image_generations.id (for tracking)
}

/**
 * VEO3 Image-to-Video API Client
 * Handles video generation from reference images with Google AI Sandbox API
 */
export class VEO3ImageToVideoApiClient {
  private readonly googleApiUrl = "https://aisandbox-pa.googleapis.com/v1";

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
    // Generate UUID v4 manually using crypto.randomBytes
    const bytes = randomBytes(16);
    // Set version (4) and variant bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    // Format as UUID string
    const hex = bytes.toString("hex");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }

  /**
   * Generate video from reference images (1-3 images)
   * @param bearerToken - OAuth Bearer token extracted from Flow page
   * @param projectId - Flow project ID
   * @param prompt - Text prompt for video generation
   * @param imageReferences - Array of image references (1-3 images)
   * @param aspectRatio - Video aspect ratio (default: LANDSCAPE)
   * @param model - Video model to use (default: veo_3_1_i2v_s_fast_ultra)
   */
  async generateVideoFromImages(
    bearerToken: string,
    projectId: string,
    prompt: string,
    imageReferences: ImageReference[],
    aspectRatio:
      | "VIDEO_ASPECT_RATIO_LANDSCAPE"
      | "VIDEO_ASPECT_RATIO_PORTRAIT"
      | "VIDEO_ASPECT_RATIO_SQUARE" = "VIDEO_ASPECT_RATIO_LANDSCAPE",
    model: string = "veo_3_1_i2v_s_fast_ultra"
  ): Promise<{ success: boolean; data?: any; sceneId?: string; seed?: number; error?: string }> {
    try {
      // Validate image references count (1-3 images)
      if (!imageReferences || imageReferences.length === 0) {
        return { success: false, error: "At least one image reference is required" };
      }
      if (imageReferences.length > 3) {
        return { success: false, error: "Maximum 3 image references allowed" };
      }

      const seed = this.generateSeed();
      const sceneId = this.generateSceneId();
      const url = `${this.googleApiUrl}/video:batchAsyncGenerateVideoReferenceImages`;

      logger.info(`Generating image-to-video (projectId: ${projectId}, sceneId: ${sceneId}, seed: ${seed})`);
      logger.info(`Prompt: ${prompt.substring(0, 100)}...`);
      logger.info(`Image references: ${imageReferences.length}`);
      logger.info(`Image references details: ${JSON.stringify(imageReferences)}`);
      logger.info(`Model: ${model}, Aspect Ratio: ${aspectRatio}`);

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
            videoModelKey: model,
          },
        ],
      };

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

        // Parse error response for better error messages
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorData = JSON.parse(rawText);
          const apiError = errorData?.error;

          // Check for quota exhaustion
          if (response.status === 429 && apiError?.status === "RESOURCE_EXHAUSTED") {
            const reason = apiError?.details?.[0]?.reason;
            if (reason === "PUBLIC_ERROR_USER_QUOTA_REACHED") {
              errorMessage = "Quota exhausted. You have reached your daily video generation limit. Please try again tomorrow.";
            } else {
              errorMessage = apiError?.message || "API quota exhausted. Please try again later.";
            }
          } else if (apiError?.message) {
            errorMessage = apiError.message;
          }
        } catch (parseErr) {
          // Keep default error message if parsing fails
          logger.warn("Could not parse error response JSON", parseErr);
        }

        return {
          success: false,
          error: errorMessage,
          sceneId,
          seed,
        };
      }

      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        logger.error("Failed to parse image-to-video generation response JSON", parseErr);
      }

      // Extract operation name (job ID) from response
      // Response structure: { operations: [{ operation: { name: "..." }, sceneId: "...", status: "..." }] }
      const operationName = data?.operations?.[0]?.operation?.name;
      logger.info(`Image-to-video generation started. Operation: ${operationName}`);

      return {
        success: true,
        data: {
          name: operationName, // Keep consistent with service expectations
          operationName,
          sceneId,
          seed,
          raw: data,
        },
        sceneId,
        seed,
      };
    } catch (error) {
      logger.error("Error generating video from images", error);
      return {
        success: false,
        error: String(error),
      };
    }
  }
}

export const veo3ImageToVideoApiClient = new VEO3ImageToVideoApiClient();
