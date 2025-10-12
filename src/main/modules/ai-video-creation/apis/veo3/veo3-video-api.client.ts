import { randomBytes } from "crypto";
import { Logger } from "../../../../../shared/utils/logger";

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
   * Build headers for Google AI Sandbox API requests
   */
  private buildGoogleApiHeaders(bearerToken: string): HeadersInit {
    return {
      accept: "*/*",
      "accept-language": "en,en-US;q=0.9",
      authorization: `Bearer ${bearerToken}`,
      "cache-control": "no-cache",
      "content-type": "text/plain;charset=UTF-8",
      origin: "https://labs.google",
      pragma: "no-cache",
      priority: "u=1, i",
      referer: "https://labs.google/",
      "sec-ch-ua": '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
      "x-browser-channel": "stable",
      "x-browser-copyright": "Copyright 2025 Google LLC. All rights reserved.",
      "x-browser-year": "2025",
    };
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
        headers: this.buildGoogleApiHeaders(bearerToken),
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
        headers: this.buildGoogleApiHeaders(bearerToken),
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
}

export const veo3VideoApiClient = new VEO3VideoApiClient();
