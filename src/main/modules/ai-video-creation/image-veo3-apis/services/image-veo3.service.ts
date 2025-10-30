import * as fs from "fs/promises";
import * as path from "path";
import { ApiResponse } from "../../../../../shared/types";
import { Logger } from "../../../../../shared/utils/logger";
import { profileRepository } from "../../../profile-management/repository/profile.repository";
import { cookieService } from "../../../common/cookie/services/cookie.service";
import { COOKIE_SERVICES } from "../../../gemini-apis/shared/types";
import { extractBearerToken } from "../../flow-veo3-apis/helpers/veo3-headers.helper";
import { imageVEO3ApiClient } from "../apis/image-veo3-api.client";
import { veo3ImageRepository } from "../repository/image.repository";
import { flowSecretExtractionService } from "../../../common/secret-extraction/services/secret-extraction.service";
import type { Veo3ImageGeneration, FlowUserWorkflow } from "../types/image.types";

const logger = new Logger("ImageVeo3Service");

/**
 * VEO3 Image Service
 * Handles image upload, fetch, and local storage synchronization
 */
export class ImageVeo3Service {
  /**
   * Upload a local image to Flow server and save to database
   * @param profileId - Profile ID
   * @param imagePath - Local file path to the image
   * @param localStoragePath - Directory to save the downloaded image
   * @param aspectRatio - Image aspect ratio
   */
  async uploadImage(
    profileId: string,
    imagePath: string,
    localStoragePath: string,
    aspectRatio:
      | "IMAGE_ASPECT_RATIO_LANDSCAPE"
      | "IMAGE_ASPECT_RATIO_PORTRAIT"
      | "IMAGE_ASPECT_RATIO_SQUARE" = "IMAGE_ASPECT_RATIO_LANDSCAPE"
  ): Promise<ApiResponse<Veo3ImageGeneration>> {
    try {
      // Validate profile
      const profile = await profileRepository.findById(profileId);
      if (!profile) {
        return { success: false, error: "Profile not found" };
      }

      logger.info(`Uploading image for profile: ${profile.name}`);

      // Get bearer token
      const tokenResult = await this.getBearerToken(profileId);
      if (!tokenResult.success || !tokenResult.token) {
        return { success: false, error: tokenResult.error || "Failed to get bearer token" };
      }

      // Upload image to Flow
      const uploadResult = await imageVEO3ApiClient.uploadImage(tokenResult.token, imagePath, aspectRatio);
      if (!uploadResult.success || !uploadResult.data) {
        return { success: false, error: uploadResult.error || "Failed to upload image" };
      }

      const { mediaGenerationId: mediaIdObj } = uploadResult.data;
      if (!mediaIdObj || !mediaIdObj.mediaGenerationId) {
        return { success: false, error: "Invalid upload response: missing mediaGenerationId" };
      }

      // The mediaGenerationId is already a complete string (CAMa...)
      const imageName = mediaIdObj.mediaGenerationId;

      logger.info(`Generated image name: ${imageName}`);

      // Wait a bit for the image to be available
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Use downloadSingleImage to fetch and save the image (consistent with sync flow)
      const downloadResult = await this.downloadSingleImage(profileId, imageName, localStoragePath);
      if (!downloadResult.success) {
        logger.warn("Failed to download uploaded image, saving metadata only");
      }

      // Get the saved image from database (downloadSingleImage creates it)
      const savedImage = await veo3ImageRepository.findByName(imageName);
      if (!savedImage) {
        return { success: false, error: "Failed to save image to database" };
      }

      const imageGeneration: Veo3ImageGeneration = {
        ...savedImage,
        aspectRatio,
      };

      logger.info(`Successfully uploaded and saved image: ${imageGeneration.id}`);

      return { success: true, data: imageGeneration };
    } catch (error) {
      logger.error("Error uploading image", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Fetch user images from Flow server with pagination
   * @param profileId - Profile ID
   * @param pageSize - Number of images per page
   * @param cursor - Pagination cursor
   */
  async fetchUserImages(
    profileId: string,
    pageSize: number = 18,
    cursor: string | null = null
  ): Promise<ApiResponse<{ images: FlowUserWorkflow[]; nextPageToken?: string }>> {
    try {
      // Validate profile
      const profile = await profileRepository.findById(profileId);
      if (!profile) {
        return { success: false, error: "Profile not found" };
      }

      // Get flow cookie
      const cookieResult = await cookieService.getCookiesByProfile(profileId);
      if (!cookieResult.success || !cookieResult.data || cookieResult.data.length === 0) {
        return { success: false, error: "Profile has no cookies. Please login first." };
      }

      const flowCookie = cookieResult.data.find((c) => c.service === COOKIE_SERVICES.FLOW && c.status === "active");
      if (!flowCookie || !flowCookie.rawCookieString) {
        return { success: false, error: "Profile has no active 'flow' cookies. Please login first." };
      }

      logger.info(`Fetching images for profile: ${profile.name} (pageSize: ${pageSize})`);

      // Fetch images
      const fetchResult = await imageVEO3ApiClient.fetchUserImages(flowCookie.rawCookieString, pageSize, cursor);
      if (!fetchResult.success || !fetchResult.data) {
        return { success: false, error: fetchResult.error || "Failed to fetch images" };
      }

      return {
        success: true,
        data: {
          images: fetchResult.data.result.userWorkflows,
          nextPageToken: fetchResult.data.result.nextPageToken,
        },
      };
    } catch (error) {
      logger.error("Error fetching user images", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Sync image metadata from Flow server to local database (without downloading images)
   * @param profileId - Profile ID
   * @param maxPages - Maximum number of pages to sync (default: all available)
   * @param startCursor - Optional cursor to resume from
   * @returns Synced count, skipped count, and last cursor for next fetch
   */
  async syncImageMetadata(
    profileId: string,
    maxPages?: number,
    startCursor?: string | null
  ): Promise<ApiResponse<{ synced: number; skipped: number; lastCursor?: string; hasMore: boolean }>> {
    try {
      let cursor: string | null = startCursor || null;
      let synced = 0;
      let skipped = 0;
      let pagesProcessed = 0;

      logger.info(`Starting image metadata sync for profile: ${profileId}`);

      while (!maxPages || pagesProcessed < maxPages) {
        const fetchResult = await this.fetchUserImages(profileId, 18, cursor);
        if (!fetchResult.success || !fetchResult.data) {
          break;
        }

        const { images, nextPageToken } = fetchResult.data;

        for (const workflow of images) {
          // Parse the name to extract workflow ID and media key
          // Name format: CAMa${workflowId}${workflowStepId}${mediaKey}
          const name = workflow.name;

          // Check if already exists
          const existing = await veo3ImageRepository.findByName(name);
          if (existing) {
            skipped++;
            continue;
          }

          // Extract IDs from workflow.media.mediaGenerationId
          const mediaGenerationId = workflow.media.mediaGenerationId;
          if (!mediaGenerationId) {
            logger.warn(`Skipping image ${name}: missing mediaGenerationId`);
            skipped++;
            continue;
          }

          const workflowId = mediaGenerationId.workflowId;
          const mediaKey = mediaGenerationId.mediaKey;
          const fifeUrl = workflow.media.userUploadedImage?.fifeUrl;

          // Save metadata to database (without localPath - images not downloaded yet)
          await veo3ImageRepository.createImageGeneration({
            profileId,
            name,
            aspectRatio: workflow.media.userUploadedImage?.aspectRatio,
            workflowId,
            mediaKey,
            localPath: undefined, // Will be set when image is downloaded
            fifeUrl,
            createdAt: new Date(workflow.createTime),
          });

          synced++;
        }

        if (!nextPageToken) {
          break;
        }

        cursor = nextPageToken;
        pagesProcessed++;
      }

      logger.info(`Image metadata sync completed: ${synced} synced, ${skipped} skipped, lastCursor: ${cursor || "none"}`);

      return { success: true, data: { synced, skipped, lastCursor: cursor || undefined, hasMore: !!cursor } };
    } catch (error) {
      logger.error("Error syncing image metadata from Flow", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Download and save a single image by its name (mediaGenerationId)
   * @param profileId - Profile ID
   * @param imageName - Image name from Flow API (CAMa...)
   * @param localStoragePath - Directory to save the image
   * @returns Success status and local path
   */
  async downloadSingleImage(
    profileId: string,
    imageName: string,
    localStoragePath: string
  ): Promise<ApiResponse<{ localPath: string }>> {
    try {
      // Get existing image record
      const existing = await veo3ImageRepository.findByName(imageName);
      if (!existing) {
        return { success: false, error: "Image not found in database. Sync metadata first." };
      }

      // Check if already downloaded
      if (existing.localPath) {
        logger.info(`Image ${imageName} already downloaded at: ${existing.localPath}`);
        return { success: true, data: { localPath: existing.localPath } };
      }

      // Get bearer token
      const tokenResult = await this.getBearerToken(profileId);
      if (!tokenResult.success || !tokenResult.token) {
        return { success: false, error: tokenResult.error || "Failed to get bearer token" };
      }

      // Get FLOW_NEXT_KEY
      let flowNextKey = await flowSecretExtractionService.getValidSecret(profileId, "FLOW_NEXT_KEY");
      if (!flowNextKey) {
        logger.warn("No FLOW_NEXT_KEY found. Attempting to extract...");
        const extractResult = await flowSecretExtractionService.extractSecrets(profileId);
        if (!extractResult.success) {
          return { success: false, error: "Failed to extract FLOW_NEXT_KEY. Please ensure profile cookies are valid." };
        }
        flowNextKey = await flowSecretExtractionService.getValidSecret(profileId, "FLOW_NEXT_KEY");
        if (!flowNextKey) {
          return { success: false, error: "Failed to obtain FLOW_NEXT_KEY after extraction." };
        }
      }

      // Fetch image with base64 data
      const fetchResult = await imageVEO3ApiClient.fetchImage(tokenResult.token, imageName, flowNextKey);
      if (!fetchResult.success || !fetchResult.data?.userUploadedImage?.image) {
        return { success: false, error: fetchResult.error || "Failed to fetch image data" };
      }

      // Save base64 to local storage
      const downloadResult = await this.saveBase64Image(
        fetchResult.data.userUploadedImage.image,
        localStoragePath,
        existing.mediaKey
      );

      if (!downloadResult.success) {
        return { success: false, error: downloadResult.error || "Failed to save image" };
      }

      // Update database with local path
      await veo3ImageRepository.update(existing.id, { localPath: downloadResult.path });

      logger.info(`Successfully downloaded image ${imageName} to ${downloadResult.path}`);

      return { success: true, data: { localPath: downloadResult.path! } };
    } catch (error) {
      logger.error(`Error downloading image ${imageName}`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Download multiple images in batch
   * @param profileId - Profile ID
   * @param imageNames - Array of image names to download
   * @param localStoragePath - Directory to save images
   * @returns Success count and failed count
   */
  async downloadImages(
    profileId: string,
    imageNames: string[],
    localStoragePath: string
  ): Promise<ApiResponse<{ downloaded: number; failed: number; failedNames: string[] }>> {
    let downloaded = 0;
    let failed = 0;
    const failedNames: string[] = [];

    logger.info(`Starting batch download of ${imageNames.length} images...`);

    for (const imageName of imageNames) {
      const result = await this.downloadSingleImage(profileId, imageName, localStoragePath);
      if (result.success) {
        downloaded++;
      } else {
        failed++;
        failedNames.push(imageName);
        logger.warn(`Failed to download ${imageName}: ${result.error}`);
      }
    }

    logger.info(`Batch download completed: ${downloaded} success, ${failed} failed`);

    return { success: true, data: { downloaded, failed, failedNames } };
  }

  /**
   * Get images for a profile from local database
   * @param profileId - Profile ID
   */
  async getLocalImages(profileId: string): Promise<ApiResponse<Veo3ImageGeneration[]>> {
    try {
      const images = await veo3ImageRepository.findByProfileId(profileId);
      return { success: true, data: images };
    } catch (error) {
      logger.error("Error getting local images", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Save base64 image data to local file
   */
  private async saveBase64Image(
    base64Data: string,
    storageDir: string,
    mediaKey: string
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      // Create yyyy-mm-dd folder structure
      const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd
      const dateFolder = path.join(storageDir, today);
      await fs.mkdir(dateFolder, { recursive: true });

      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, "base64");

      // Save to file
      const filename = `${mediaKey}.jpg`;
      const filepath = path.join(dateFolder, filename);
      await fs.writeFile(filepath, buffer);

      logger.info(`Saved image to: ${filepath}`);

      return { success: true, path: filepath };
    } catch (error) {
      logger.error("Error saving base64 image", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get bearer token for profile
   */
  private async getBearerToken(profileId: string): Promise<{ success: boolean; token?: string; error?: string }> {
    const cookieResult = await cookieService.getCookiesByProfile(profileId);
    if (!cookieResult.success || !cookieResult.data || cookieResult.data.length === 0) {
      return { success: false, error: "Profile has no cookies" };
    }

    const flowCookie = cookieResult.data.find((c) => c.service === COOKIE_SERVICES.FLOW && c.status === "active");
    if (!flowCookie || !flowCookie.rawCookieString) {
      return { success: false, error: "Profile has no active 'flow' cookies" };
    }

    return extractBearerToken(flowCookie.rawCookieString);
  }
}

// Export singleton instance
export const imageVeo3Service = new ImageVeo3Service();
