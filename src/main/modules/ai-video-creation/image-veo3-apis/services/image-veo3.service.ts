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

      const { mediaGenerationId } = uploadResult.data;
      if (!mediaGenerationId) {
        return { success: false, error: "Invalid upload response: missing mediaGenerationId" };
      }

      // Fetch the uploaded image to get the full metadata including fifeUrl
      const imageName = `CAMa${mediaGenerationId.workflowId}${Buffer.from(mediaGenerationId.workflowStepId).toString(
        "base64"
      )}${Buffer.from(mediaGenerationId.mediaKey).toString("base64")}`;

      // Wait a bit for the image to be available
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const fetchResult = await imageVEO3ApiClient.fetchImage(tokenResult.token, imageName);
      if (!fetchResult.success || !fetchResult.data) {
        logger.warn("Failed to fetch uploaded image metadata, continuing without fifeUrl");
      }

      // Download and save locally
      let localPath: string | undefined;
      if (fetchResult.success && fetchResult.data?.userUploadedImage?.fifeUrl) {
        const downloadResult = await this.downloadAndSaveImage(
          fetchResult.data.userUploadedImage.fifeUrl,
          localStoragePath,
          mediaGenerationId.mediaKey
        );
        if (downloadResult.success) {
          localPath = downloadResult.path;
        }
      }

      // Save to database
      const imageGeneration = await veo3ImageRepository.createImageGeneration({
        profileId,
        name: imageName,
        aspectRatio,
        workflowId: mediaGenerationId.workflowId,
        mediaKey: mediaGenerationId.mediaKey,
        localPath,
        fifeUrl: fetchResult.data?.userUploadedImage?.fifeUrl,
        createdAt: new Date(),
      });

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
   * Sync images from Flow server to local database and storage
   * @param profileId - Profile ID
   * @param localStoragePath - Directory to save images
   * @param maxPages - Maximum number of pages to sync (default: 5)
   */
  async syncImagesFromFlow(
    profileId: string,
    localStoragePath: string,
    maxPages: number = 5
  ): Promise<ApiResponse<{ synced: number; skipped: number }>> {
    try {
      let cursor: string | null = null;
      let synced = 0;
      let skipped = 0;
      let pagesProcessed = 0;

      // Get bearer token for image downloads
      const tokenResult = await this.getBearerToken(profileId);
      if (!tokenResult.success || !tokenResult.token) {
        return { success: false, error: tokenResult.error || "Failed to get bearer token" };
      }

      logger.info(`Starting image sync for profile: ${profileId}`);

      while (pagesProcessed < maxPages) {
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

          // Extract IDs from name (this is a simplified extraction - may need refinement)
          const workflowId = name.substring(4, 40); // Approximate extraction
          const mediaKey = name.substring(name.length - 36); // Approximate extraction

          // Download and save locally if fifeUrl is available
          let localPath: string | undefined;
          if (workflow.media.userUploadedImage?.fifeUrl) {
            const downloadResult = await this.downloadAndSaveImage(
              workflow.media.userUploadedImage.fifeUrl,
              localStoragePath,
              mediaKey
            );
            if (downloadResult.success) {
              localPath = downloadResult.path;
            }
          }

          // Save to database
          await veo3ImageRepository.createImageGeneration({
            profileId,
            name,
            aspectRatio: workflow.media.userUploadedImage?.aspectRatio,
            workflowId,
            mediaKey,
            localPath,
            fifeUrl: workflow.media.userUploadedImage?.fifeUrl,
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

      logger.info(`Image sync completed: ${synced} synced, ${skipped} skipped`);

      return { success: true, data: { synced, skipped } };
    } catch (error) {
      logger.error("Error syncing images from Flow", error);
      return { success: false, error: String(error) };
    }
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
   * Download and save image from fifeUrl
   */
  private async downloadAndSaveImage(
    fifeUrl: string,
    storageDir: string,
    mediaKey: string
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      // Ensure storage directory exists
      await fs.mkdir(storageDir, { recursive: true });

      // Download image
      const response = await fetch(fifeUrl);
      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      // Save to file
      const filename = `${mediaKey}.jpg`;
      const filepath = path.join(storageDir, filename);
      await fs.writeFile(filepath, buffer);

      logger.info(`Downloaded image to: ${filepath}`);

      return { success: true, path: filepath };
    } catch (error) {
      logger.error("Error downloading image", error);
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
