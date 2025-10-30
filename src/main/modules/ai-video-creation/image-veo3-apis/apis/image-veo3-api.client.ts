import * as fs from "fs/promises";
import * as path from "path";
import { Logger } from "../../../../../shared/utils/logger";
import { buildVEO3Headers } from "../../flow-veo3-apis/helpers/veo3-headers.helper";
import type { FlowUploadImageResponse, FlowFetchImagesResponse, FlowFetchImageResponse } from "../types/image.types";

const logger = new Logger("ImageVEO3ApiClient");

/**
 * VEO3 Image API Client
 * Handles image-related HTTP requests to Google Labs VEO3 API
 */
export class ImageVEO3ApiClient {
  private readonly baseUrl = "https://labs.google/fx/api/trpc";
  private readonly mediaBaseUrl = "https://aisandbox-pa.googleapis.com/v1";

  /**
   * Upload a local image to Flow server
   * @param bearerToken - Bearer token for authentication
   * @param imagePath - Local file path to the image
   * @param aspectRatio - Image aspect ratio (default: LANDSCAPE)
   */
  async uploadImage(
    bearerToken: string,
    imagePath: string,
    aspectRatio:
      | "IMAGE_ASPECT_RATIO_LANDSCAPE"
      | "IMAGE_ASPECT_RATIO_PORTRAIT"
      | "IMAGE_ASPECT_RATIO_SQUARE" = "IMAGE_ASPECT_RATIO_LANDSCAPE"
  ): Promise<{ success: boolean; data?: FlowUploadImageResponse; error?: string }> {
    try {
      // Read the image file and convert to base64
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString("base64");

      // Detect mime type from file extension
      const ext = path.extname(imagePath).toLowerCase();
      const mimeType = ext === ".png" ? "image/png" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/jpeg";

      const url = `${this.mediaBaseUrl}:uploadUserImage`;

      const payload = {
        imageInput: {
          rawImageBytes: base64Image,
          mimeType,
          isUserUploaded: true,
          aspectRatio,
        },
        clientContext: {
          sessionId: `;${Date.now()}`,
          tool: "ASSET_MANAGER",
        },
      };

      logger.info(`Uploading image: ${path.basename(imagePath)} (${aspectRatio})`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9",
          authorization: `Bearer ${bearerToken}`,
          "content-type": "text/plain;charset=UTF-8",
          origin: "https://labs.google",
          referer: "https://labs.google/",
          "sec-ch-ua": '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "cross-site",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Failed to upload image: ${response.status} - ${errorText}`);
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data: FlowUploadImageResponse = await response.json();
      logger.info(`Successfully uploaded image. MediaGenerationId: ${data.mediaGenerationId?.mediaGenerationId}`);

      return {
        success: true,
        data,
      };
    } catch (error) {
      logger.error("Error uploading image", error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Fetch user's uploaded images with pagination
   * @param cookie - Authentication cookie string
   * @param pageSize - Number of images per page (default: 18)
   * @param cursor - Pagination cursor (null for first page)
   */
  async fetchUserImages(
    cookie: string,
    pageSize: number = 18,
    cursor: string | null = null
  ): Promise<{ success: boolean; data?: FlowFetchImagesResponse; error?: string }> {
    try {
      const inputParam = {
        json: {
          type: "ASSET_MANAGER",
          pageSize,
          responseScope: "RESPONSE_SCOPE_UNSPECIFIED",
          cursor,
        },
        meta: {
          values: {
            cursor: ["undefined"],
          },
        },
      };

      const encodedInput = encodeURIComponent(JSON.stringify(inputParam));
      const url = `${this.baseUrl}/media.fetchUserHistoryDirectly?input=${encodedInput}`;

      logger.info(`Fetching user images (pageSize: ${pageSize}, cursor: ${cursor ? "provided" : "null"})`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          ...buildVEO3Headers(cookie),
          "content-type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Failed to fetch images: ${response.status} - ${errorText}`);
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const rawData = await response.json();

      // Extract the actual result from nested structure
      const result = rawData?.result?.data?.json?.result;
      if (!result) {
        logger.error("Invalid response structure from fetch images API");
        return {
          success: false,
          error: "Invalid response structure",
        };
      }

      const data: FlowFetchImagesResponse = {
        result: {
          userWorkflows: result.userWorkflows || [],
          nextPageToken: result.nextPageToken,
        },
        status: rawData?.result?.data?.json?.status || 200,
        statusText: rawData?.result?.data?.json?.statusText || "OK",
      };

      logger.info(
        `Successfully fetched ${data.result.userWorkflows.length} images. Has next page: ${!!data.result.nextPageToken}`
      );

      return {
        success: true,
        data,
      };
    } catch (error) {
      logger.error("Error fetching user images", error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Fetch a single image by its name (mediaGenerationId)
   * @param bearerToken - Bearer token for authentication
   * @param imageName - Image name from Flow API (CAMa...)
   * @param apiKey - FLOW_NEXT_KEY extracted from Next.js app (AIzaSy...)
   */
  async fetchImage(
    bearerToken: string,
    imageName: string,
    apiKey: string
  ): Promise<{ success: boolean; data?: FlowFetchImageResponse; error?: string }> {
    try {
      const url = `${this.mediaBaseUrl}/media/${imageName}?key=${apiKey}&clientContext.tool=PINHOLE`;

      logger.info(`Fetching image: ${imageName}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9",
          authorization: `Bearer ${bearerToken}`,
          referer: "https://labs.google/",
          "sec-ch-ua": '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "cross-site",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Failed to fetch image: ${response.status} - ${errorText}`);
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data: FlowFetchImageResponse = await response.json();
      logger.info(`Successfully fetched image: ${imageName}`);

      return {
        success: true,
        data,
      };
    } catch (error) {
      logger.error("Error fetching image", error);
      return {
        success: false,
        error: String(error),
      };
    }
  }
}

// Export singleton instance
export const imageVEO3ApiClient = new ImageVEO3ApiClient();
