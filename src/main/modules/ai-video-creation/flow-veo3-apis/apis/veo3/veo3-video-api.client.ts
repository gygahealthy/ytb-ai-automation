import { randomBytes } from "crypto";
import { Logger } from "../../../../../../shared/utils/logger";
import { buildGoogleApiHeaders } from "../../helpers/veo3-headers.helper";

const logger = new Logger("VEO3VideoApiClient");

/**
 * VEO3 Video Generation API Client
 * Handles video generation and status checking with Google AI Sandbox API
 */
export class VEO3VideoApiClient {
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
   * Generate video from text prompt using VEO3 API
   * @param bearerToken - OAuth Bearer token extracted from Flow page
   * @param projectId - Flow project ID
   * @param prompt - Text prompt for video generation
   * @param aspectRatio - Video aspect ratio (default: LANDSCAPE)
   */
  async generateVideo(
    bearerToken: string,
    projectId: string,
    prompt: string,
    aspectRatio:
      | "VIDEO_ASPECT_RATIO_LANDSCAPE"
      | "VIDEO_ASPECT_RATIO_PORTRAIT"
      | "VIDEO_ASPECT_RATIO_SQUARE" = "VIDEO_ASPECT_RATIO_LANDSCAPE"
  ): Promise<{ success: boolean; data?: any; sceneId?: string; seed?: number; error?: string }> {
    try {
      const seed = this.generateSeed();
      const sceneId = this.generateSceneId();
      const url = `${this.googleApiUrl}/video:batchAsyncGenerateVideoText`;

      logger.info(`Generating video (projectId: ${projectId}, sceneId: ${sceneId}, seed: ${seed})`);
      logger.info(`Prompt: ${prompt.substring(0, 100)}...`);

      const payload = {
        clientContext: {
          projectId,
          tool: "PINHOLE",
          userPaygateTier: "PAYGATE_TIER_ONE",
        },
        requests: [
          {
            aspectRatio,
            seed,
            textInput: {
              prompt,
            },
            videoModelKey: "veo_3_0_t2v_fast",
            metadata: {
              sceneId,
            },
          },
        ],
      };

      const response = await fetch(url, {
        method: "POST",
        headers: buildGoogleApiHeaders(bearerToken),
        body: JSON.stringify(payload),
      });

      const rawText = await response.text();
      logger.info(`Video generation response (${response.status}): ${rawText.substring(0, 500)}`);

      if (!response.ok) {
        logger.error(`Failed to generate video: ${response.status} - ${rawText}`);
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          sceneId,
          seed,
        };
      }

      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        logger.error("Failed to parse video generation response JSON", parseErr);
      }

      // Extract operation name (job ID) from response
      // Response structure: { operations: [{ operation: { name: "..." }, sceneId: "...", status: "..." }] }
      const operationName = data?.operations?.[0]?.operation?.name;
      logger.info(`Video generation started. Operation: ${operationName}`);

      return {
        success: true,
        data: {
          name: operationName, // Keep consistent with veo3.service.ts expectations
          operationName,
          sceneId,
          seed,
          raw: data,
        },
        sceneId,
        seed,
      };
    } catch (error) {
      logger.error("Error generating video", error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Check video generation status
   * @param bearerToken - OAuth Bearer token
   * @param operationName - Operation name (job ID) from generateVideo response
   * @param sceneId - Scene ID used in generation
   */
  async checkVideoStatus(
    bearerToken: string,
    operationName: string,
    sceneId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const url = `${this.googleApiUrl}/video:batchCheckAsyncVideoGenerationStatus`;

      const payload = {
        operations: [
          {
            operation: {
              name: operationName,
            },
            sceneId,
            status: "MEDIA_GENERATION_STATUS_PENDING",
          },
        ],
      };

      logger.info(`Checking video status (operation: ${operationName}, scene: ${sceneId})`);

      const response = await fetch(url, {
        method: "POST",
        headers: buildGoogleApiHeaders(bearerToken),
        body: JSON.stringify(payload),
      });

      const rawText = await response.text();

      if (!response.ok) {
        logger.error(`Failed to check video status: ${response.status} - ${rawText}`);
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        logger.error("Failed to parse status check response JSON", parseErr);
      }

      // Response structure: { operations: [{ operation: { name: "..." }, sceneId: "...", status: "...", videoUrl: "..." }] }
      const operation = data?.operations?.[0];
      const status = operation?.status || "UNKNOWN";
      const videoUrl = operation?.videoUrl || operation?.video?.url;

      logger.info(`Video status: ${status}`);
      if (videoUrl) {
        logger.info(`Video URL: ${videoUrl}`);
      }

      return {
        success: true,
        data: {
          mediaStatus: status, // Use mediaStatus to match backend expectations
          status,
          videoUrl,
          url: videoUrl,
          raw: data,
        },
      };
    } catch (error) {
      logger.error("Error checking video status", error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Upscale a generated video to higher resolution (1080p)
   * @param bearerToken - OAuth Bearer token
   * @param sourceMediaId - Media ID from the original video (mediaGenerationId)
   * @param sourceAspectRatio - Aspect ratio from the original video
   * @param sourceSeed - Optional seed from the original video (will generate new if not provided)
   * @param model - Upscaling model (default: "veo_2_1080p_upsampler_8s")
   */
  async upscaleVideo(
    bearerToken: string,
    sourceMediaId: string,
    sourceAspectRatio: string,
    sourceSeed?: number,
    model: string = "veo_2_1080p_upsampler_8s"
  ): Promise<{ success: boolean; data?: any; sceneId?: string; error?: string; alreadyCompleted?: boolean }> {
    try {
      const newSceneId = this.generateSceneId();
      const seed = sourceSeed || this.generateSeed();
      const sessionId = `;${Date.now()}`; // ; + epoch time
      const url = `${this.googleApiUrl}/video:batchAsyncGenerateVideoUpsampleVideo`;

      logger.info(`Upscaling video (sourceMediaId: ${sourceMediaId})`);
      logger.info(`New sceneId: ${newSceneId}, seed: ${seed}, model: ${model}`);

      const payload = {
        clientContext: {
          sessionId,
        },
        requests: [
          {
            aspectRatio: sourceAspectRatio,
            seed,
            videoInput: {
              mediaId: sourceMediaId,
            },
            videoModelKey: model,
            metadata: {
              sceneId: newSceneId,
            },
          },
        ],
      };

      const response = await fetch(url, {
        method: "POST",
        headers: buildGoogleApiHeaders(bearerToken),
        body: JSON.stringify(payload),
      });

      const rawText = await response.text();
      logger.info(`Video upscale response (${response.status}): ${rawText.substring(0, 500)}`);

      if (!response.ok) {
        logger.error(`Failed to upscale video: ${response.status} - ${rawText}`);

        // Parse error response for better error messages
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorDetails: any = null;

        try {
          errorDetails = JSON.parse(rawText);
          const apiError = errorDetails?.error;

          if (response.status === 409 && apiError?.status === "ALREADY_EXISTS") {
            // Handle 409 - upscale already in progress
            const reason = apiError?.details?.[0]?.reason;
            if (reason === "PUBLIC_ERROR_GENERATION_ALREADY_IN_PROGRESS") {
              errorMessage = "Upscale already in progress for this video";
            } else {
              errorMessage = apiError?.message || "Video upscale already exists";
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
          sceneId: newSceneId,
          data: errorDetails,
        };
      }

      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        logger.error("Failed to parse video upscale response JSON", parseErr);
      }

      // Check if video is already upscaled (has rawBytes in response)
      const operation = data?.operations?.[0];
      const rawBytes = operation?.rawBytes;
      const mediaGenerationId = operation?.mediaGenerationId;
      const status = operation?.status;

      if (rawBytes && status === "MEDIA_GENERATION_STATUS_SUCCESSFUL") {
        logger.info(`Video already upscaled! MediaGenerationId: ${mediaGenerationId}`);
        logger.info(`RawBytes length: ${rawBytes.length} characters`);

        return {
          success: true,
          alreadyCompleted: true,
          data: {
            name: undefined, // No operation name for already completed
            operationName: undefined,
            sceneId: newSceneId,
            mediaGenerationId,
            rawBytes,
            status,
            raw: data,
          },
          sceneId: newSceneId,
        };
      }

      // Extract operation name (job ID) from response for pending upscale
      const operationName = operation?.operation?.name;
      logger.info(`Video upscale started. Operation: ${operationName}`);

      return {
        success: true,
        data: {
          name: operationName,
          operationName,
          sceneId: newSceneId,
          raw: data,
        },
        sceneId: newSceneId,
      };
    } catch (error) {
      logger.error("Error upscaling video", error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Check upscale status (uses same endpoint as regular video status)
   * @param bearerToken - OAuth Bearer token
   * @param operationName - Operation name from upscaleVideo response
   * @param sceneId - Scene ID from upscaleVideo response
   */
  async checkUpscaleStatus(
    bearerToken: string,
    operationName: string,
    sceneId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    // Upscaling uses the same status check endpoint as regular video generation
    return this.checkVideoStatus(bearerToken, operationName, sceneId);
  }

  /**
   * Decode base64 video data and save to file
   * @param base64Data - Base64 encoded video data (rawBytes from API)
   * @param outputPath - Full path where to save the video file
   * @returns Success status and file path
   */
  async decodeAndSaveBase64Video(
    base64Data: string,
    outputPath: string
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      logger.info(`Decoding base64 video data (${base64Data.length} chars) to: ${outputPath}`);

      // Import fs module dynamically
      const fs = await import("fs/promises");
      const path = await import("path");

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // Decode base64 to buffer
      const buffer = Buffer.from(base64Data, "base64");
      logger.info(`Decoded buffer size: ${buffer.length} bytes (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);

      // Write buffer to file
      await fs.writeFile(outputPath, buffer);
      logger.info(`Video saved successfully to: ${outputPath}`);

      return {
        success: true,
        filePath: outputPath,
      };
    } catch (error) {
      logger.error("Failed to decode and save base64 video", error);
      return {
        success: false,
        error: String(error),
      };
    }
  }
}

export const veo3VideoApiClient = new VEO3VideoApiClient();
