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
import { imageDownloadService } from "./image-download.service";
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

      // Wait a bit for the image to be available on server
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Sync metadata to get full image record from server (includes workflowId, mediaKey, fifeUrl)
      logger.info("Fetching uploaded image metadata from server...");
      const syncResult = await this.fetchUserImages(profileId, 18, null); // Fetch first page
      if (!syncResult.success || !syncResult.data) {
        logger.warn(`Failed to fetch metadata after upload: ${syncResult.error}`);
      } else {
        // Find the uploaded image in the fetched list
        const uploadedWorkflow = syncResult.data.images.find(
          (img) => img.name.replace(/[\s\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF\r\n]/g, "") === imageName
        );

        if (uploadedWorkflow && uploadedWorkflow.media.mediaGenerationId) {
          // Create database record with full metadata
          const mediaGenId = uploadedWorkflow.media.mediaGenerationId;
          const fifeUrl = uploadedWorkflow.media.userUploadedImage?.fifeUrl;

          await veo3ImageRepository.createImageGeneration({
            profileId,
            name: imageName,
            aspectRatio,
            workflowId: mediaGenId.workflowId,
            mediaKey: mediaGenId.mediaKey,
            fifeUrl,
            createdAt: new Date(uploadedWorkflow.createTime),
          });

          logger.info("Successfully created image record with metadata from server");
        } else {
          logger.warn("Uploaded image not found in server response, creating minimal record");
          // Fallback: Create minimal record (sync will update it later)
          await veo3ImageRepository.createImageGeneration({
            profileId,
            name: imageName,
            aspectRatio,
            workflowId: "unknown", // Will be updated by sync
            mediaKey: imageName.substring(0, 16), // Temporary placeholder
            createdAt: new Date(),
          });
        }
      }

      // Now try to download the image
      const downloadResult = await this.downloadSingleImage(profileId, imageName, localStoragePath);
      if (!downloadResult.success) {
        logger.warn(`Failed to download uploaded image: ${downloadResult.error}. Image metadata saved, download it later.`);
      }

      // Get the saved image from database
      const savedImage = await veo3ImageRepository.findByName(imageName);
      if (!savedImage) {
        return { success: false, error: "Failed to save image to database" };
      }

      const imageGeneration: Veo3ImageGeneration = {
        ...savedImage,
        aspectRatio,
      };

      logger.info(`Successfully uploaded image: ${imageGeneration.id} (downloaded: ${!!savedImage.localPath})`);

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
   * Fetches ALL pages from API and updates/inserts only new images (preserves existing records)
   * @param profileId - Profile ID
   * @returns Synced count, skipped count (updated count)
   */
  async syncImageMetadata(profileId: string): Promise<ApiResponse<{ synced: number; skipped: number }>> {
    try {
      let cursor: string | null = null;
      let synced = 0; // New images inserted
      let updated = 0; // Existing images updated
      let pagesProcessed = 0;
      const seenImageNames = new Set<string>(); // Track processed images to detect circular pagination

      logger.info(`Starting image metadata sync for profile: ${profileId}`);

      // Fetch ALL pages until no more data OR we encounter duplicates (circular pagination)
      while (true) {
        const fetchResult = await this.fetchUserImages(profileId, 18, cursor);
        if (!fetchResult.success || !fetchResult.data) {
          logger.warn(`Fetch failed at page ${pagesProcessed + 1}: ${fetchResult.error}`);
          break;
        }

        const { images, nextPageToken } = fetchResult.data;

        // Stop if no images returned
        if (!images || images.length === 0) {
          logger.info(`No more images to fetch at page ${pagesProcessed + 1}`);
          break;
        }

        // Detect circular pagination: if we see images we've already processed, stop
        let duplicateCount = 0;
        const pageImageNames: string[] = [];

        for (const workflow of images) {
          // Parse the name to extract workflow ID and media key
          // Name format: CAMa${workflowId}${workflowStepId}${mediaKey}
          // CRITICAL: Remove all whitespace/newlines from name (API may return it with formatting)
          const rawName = workflow.name;
          const name = rawName.replace(/[\s\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF\r\n]/g, "");

          pageImageNames.push(name);

          // Check if we've seen this image in a previous page (circular pagination detection)
          if (seenImageNames.has(name)) {
            duplicateCount++;
          }
        }

        // If ALL images in this page are duplicates, we've looped back - stop pagination
        if (duplicateCount === images.length) {
          logger.info(
            `Circular pagination detected at page ${
              pagesProcessed + 1
            }: all ${duplicateCount} images already processed. Stopping.`
          );
          break;
        }

        // If more than 50% are duplicates, likely circular - stop to be safe
        if (duplicateCount > images.length / 2) {
          logger.warn(
            `High duplicate rate at page ${pagesProcessed + 1}: ${duplicateCount}/${
              images.length
            } already seen. Stopping pagination.`
          );
          break;
        }

        // Process images in this page
        for (const workflow of images) {
          const rawName = workflow.name;
          const name = rawName.replace(/[\s\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF\r\n]/g, "");

          // Add to seen set
          seenImageNames.add(name);

          // Check if already exists in database
          const existing = await veo3ImageRepository.findByName(name);

          // Extract IDs from workflow.media.mediaGenerationId
          const mediaGenerationId = workflow.media.mediaGenerationId;
          if (!mediaGenerationId) {
            logger.warn(`Skipping image ${name}: missing mediaGenerationId`);
            continue;
          }

          const workflowId = mediaGenerationId.workflowId;
          const mediaKey = mediaGenerationId.mediaKey;
          const fifeUrl = workflow.media.userUploadedImage?.fifeUrl;

          if (existing) {
            // Update existing record (preserve localPath if already downloaded)
            await veo3ImageRepository.update(existing.id, {
              aspectRatio: workflow.media.userUploadedImage?.aspectRatio,
              workflowId,
              mediaKey,
              fifeUrl: fifeUrl || existing.fifeUrl, // Update fifeUrl if available
              // Don't touch localPath - preserve downloaded files
            });
            updated++;
          } else {
            // Insert new image metadata (without localPath - not downloaded yet)
            await veo3ImageRepository.createImageGeneration({
              profileId,
              name, // Already cleaned of whitespace
              aspectRatio: workflow.media.userUploadedImage?.aspectRatio,
              workflowId,
              mediaKey,
              localPath: undefined, // Will be set when image is downloaded
              fifeUrl,
              createdAt: new Date(workflow.createTime),
            });
            synced++;
          }
        }

        pagesProcessed++;
        logger.info(
          `Processed page ${pagesProcessed}: ${
            images.length
          } images (${duplicateCount} duplicates), ${synced} new + ${updated} updated = ${synced + updated} total unique`
        );

        // Stop if no next page token
        if (!nextPageToken) {
          logger.info(`No more pages available. Total pages processed: ${pagesProcessed}`);
          break;
        }

        cursor = nextPageToken;

        // Delay between pages to mimic user behavior (1-2 seconds)
        const delay = 1000 + Math.random() * 1000; // 1-2 seconds random
        logger.info(`Waiting ${Math.round(delay)}ms before fetching next page...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      logger.info(
        `Image metadata sync completed: ${synced} new images, ${updated} updated from ${pagesProcessed} pages (${seenImageNames.size} unique images)`
      );

      return { success: true, data: { synced, skipped: updated } }; // Return updated count as "skipped"
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

      logger.info(`Image record found. Has fifeUrl: ${!!existing.fifeUrl}, localPath: ${existing.localPath || "none"}`);

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

      // Check if we got fifeUrl even if the fetch "failed" (sometimes API returns 400 but includes fifeUrl in error response)
      const fifeUrl = fetchResult.data?.userUploadedImage?.fifeUrl || existing.fifeUrl;

      if (!fetchResult.success || !fetchResult.data?.userUploadedImage?.image) {
        // If API fetch failed, try fifeUrl fallback
        logger.warn(`API fetch failed for ${imageName}: ${fetchResult.error}`);

        if (fifeUrl) {
          logger.info(`Attempting download from fifeUrl: ${fifeUrl.substring(0, 100)}...`);
          const fifeDownloadResult = await this.downloadFromFifeUrl(fifeUrl, localStoragePath, existing.mediaKey);
          if (fifeDownloadResult.success && fifeDownloadResult.path) {
            // Update database with both local path and fifeUrl
            await veo3ImageRepository.update(existing.id, {
              localPath: fifeDownloadResult.path,
              fifeUrl: fifeUrl,
            });
            logger.info(`Successfully downloaded image from fifeUrl to ${fifeDownloadResult.path}`);
            return { success: true, data: { localPath: fifeDownloadResult.path } };
          } else {
            logger.error(`Failed to download from fifeUrl: ${fifeDownloadResult.error}`);
          }
        } else {
          logger.error(`No fifeUrl available for image ${imageName}. Image may be deleted or expired on server.`);
        }

        return { success: false, error: fetchResult.error || "Failed to fetch image data and no fifeUrl available" };
      }

      // Success! Update fifeUrl if we got it
      if (fifeUrl && !existing.fifeUrl) {
        await veo3ImageRepository.update(existing.id, { fifeUrl });
      } // Save base64 to local storage
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
   * Download multiple images in batch using worker threads for non-blocking operation
   * @param profileId - Profile ID
   * @param imageNames - Array of image names to download
   * @param localStoragePath - Directory to save images
   * @param onProgress - Optional callback for progress updates
   * @returns Success count and failed count
   */
  async downloadImages(
    profileId: string,
    imageNames: string[],
    localStoragePath: string,
    onProgress?: (imageName: string, success: boolean, filePath?: string) => void
  ): Promise<ApiResponse<{ downloaded: number; failed: number; failedNames: string[] }>> {
    logger.info(`Starting batch download of ${imageNames.length} images using worker threads...`);

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

    // Build download jobs from database records
    const downloadJobs = [];
    for (const imageName of imageNames) {
      const imageRecord = await veo3ImageRepository.findByName(imageName);
      if (!imageRecord) {
        logger.warn(`Image ${imageName} not found in database. Skipping.`);
        continue;
      }

      // Skip if already downloaded
      if (imageRecord.localPath) {
        logger.info(`Image ${imageName} already downloaded at: ${imageRecord.localPath}`);
        if (onProgress) {
          onProgress(imageName, true, imageRecord.localPath);
        }
        continue;
      }

      downloadJobs.push({
        profileId,
        imageName,
        mediaKey: imageRecord.mediaKey,
        fifeUrl: imageRecord.fifeUrl,
      });
    }

    if (downloadJobs.length === 0) {
      logger.info("All images already downloaded or not found in database.");
      return { success: true, data: { downloaded: 0, failed: 0, failedNames: [] } };
    }

    // Download using worker threads
    const results = await imageDownloadService.downloadMultipleImages(
      downloadJobs,
      tokenResult.token,
      flowNextKey,
      localStoragePath,
      (result) => {
        // Update database with local path on success
        if (result.success && result.filePath) {
          veo3ImageRepository
            .findByName(result.imageName)
            .then((image) => {
              if (image) {
                return veo3ImageRepository.update(image.id, { localPath: result.filePath });
              }
            })
            .catch((err) => logger.error(`Failed to update database for ${result.imageName}:`, err));
        }

        // Call progress callback
        if (onProgress) {
          onProgress(result.imageName, result.success, result.filePath);
        }
      }
    );

    // Count results
    let downloaded = 0;
    let failed = 0;
    const failedNames: string[] = [];

    for (const result of results) {
      if (result.success) {
        downloaded++;
      } else {
        failed++;
        failedNames.push(result.imageName);
        logger.warn(`Failed to download ${result.imageName}: ${result.error}`);
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
   * Force refresh: Delete all image records for a profile
   * This does NOT delete downloaded files, only database metadata
   * @param profileId - Profile ID
   */
  async forceRefreshImages(profileId: string): Promise<ApiResponse<{ deleted: number }>> {
    try {
      logger.info(`Force refresh: Deleting all image records for profile ${profileId}`);
      const deleteCount = await veo3ImageRepository.deleteByProfileId(profileId);
      logger.info(`Deleted ${deleteCount} image records (files preserved on disk)`);
      return { success: true, data: { deleted: deleteCount } };
    } catch (error) {
      logger.error("Error force refreshing images", error);
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
   * Download image directly from fifeUrl (fallback method)
   */
  private async downloadFromFifeUrl(
    fifeUrl: string,
    storageDir: string,
    mediaKey: string
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      logger.info(`Downloading from fifeUrl: ${fifeUrl}`);

      const response = await fetch(fifeUrl);
      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Create yyyy-mm-dd folder structure
      const today = new Date().toISOString().split("T")[0];
      const dateFolder = path.join(storageDir, today);
      await fs.mkdir(dateFolder, { recursive: true });

      // Save to file
      const filename = `${mediaKey}.jpg`;
      const filepath = path.join(dateFolder, filename);
      await fs.writeFile(filepath, buffer);

      logger.info(`Downloaded from fifeUrl to: ${filepath}`);

      return { success: true, path: filepath };
    } catch (error) {
      logger.error("Error downloading from fifeUrl", error);
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
