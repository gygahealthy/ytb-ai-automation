import { randomBytes } from "crypto";
import { ApiResponse } from "../../../../../../shared/types";
import { logger } from "../../../../../utils/logger-backend";
import { profileRepository } from "../../../../../storage/database";
import { COOKIE_SERVICES } from "../../../../gemini-apis/shared/types";
import { cookieService } from "../../../../common/cookie/services/cookie.service";
import { veo3ApiClient } from "../../apis/veo3-api.client";
import { veo3VideoApiClient } from "../../apis/veo3/veo3-video-api.client";
import { videoGenerationRepository } from "../../repository/video-generation.repository";
import { videoUpscaleRepository } from "../../repository/video-upscale.repository";
import { veo3PollingManager } from "./veo3-polling-manager.service";

export interface ExtractedUpscaleMetadata {
  mediaGenerationId?: string;
  fifeUrl?: string;
  servingBaseUri?: string;
  videoUrl: string;
  status: string;
  seed?: number;
  aspectRatio?: string;
  rawBytes?: string;
}

export function extractUpscaleMetadata(rawData: unknown): ExtractedUpscaleMetadata {
  // Type guard: ensure rawData is an object
  if (typeof rawData !== "object" || rawData === null) {
    return { videoUrl: "", status: "UNKNOWN" };
  }

  const data = rawData as Record<string, unknown>;
  const operationsArray = (data.operations || data.raw) as unknown;
  const operations = Array.isArray(operationsArray)
    ? operationsArray
    : ((operationsArray as Record<string, unknown>)?.operations as unknown);
  const operation = Array.isArray(operations) ? operations[0] : null;

  if (!operation || typeof operation !== "object") {
    return { videoUrl: "", status: "UNKNOWN" };
  }

  const op = operation as Record<string, unknown>;
  const status = (op.status as string) || "UNKNOWN";
  const metadata = (op.operation as Record<string, unknown>)?.metadata as Record<string, unknown>;
  const video = metadata?.video as Record<string, unknown>;

  // Extract metadata from response
  const mediaGenerationId = (video?.mediaGenerationId as string) || (op.mediaGenerationId as string);
  const fifeUrl = video?.fifeUrl as string;
  const servingBaseUri = video?.servingBaseUri as string;
  const videoUrl = (fifeUrl || servingBaseUri || (video?.url as string) || (op.videoUrl as string) || "") as string;
  const seed = video?.seed as number | undefined;
  const aspectRatio = video?.aspectRatio as string | undefined;
  const rawBytes = op.rawBytes as string | undefined; // Base64 video data when already upscaled

  return { mediaGenerationId, fifeUrl, servingBaseUri, videoUrl, status, seed, aspectRatio, rawBytes };
}

/**
 * VEO3 Video Upscale Service
 * Handles video upscaling to higher resolution (1080p)
 */
export class VEO3VideoUpscaleService {
  /**
   * Start upscaling a generated video to higher resolution
   * @param sourceGenerationId - ID of the original video generation record
   * @param model - Upscaling model (default: "veo_2_1080p_upsampler_8s")
   */
  async startVideoUpscale(
    sourceGenerationId: string,
    model: string = "veo_2_1080p_upsampler_8s"
  ): Promise<
    ApiResponse<{
      upscaleId: string;
      sceneId: string;
      operationName: string;
      alreadyExists?: boolean;
      alreadyCompleted?: boolean;
      mediaGenerationId?: string;
      rawBytes?: string;
      // Optional fields for already-completed case (no DB record)
      sourceGenerationId?: string;
      profileId?: string;
      projectId?: string;
      model?: string;
    }>
  > {
    try {
      // Get the source video generation
      const sourceGeneration = await videoGenerationRepository.getById(sourceGenerationId);
      if (!sourceGeneration) {
        return { success: false, error: "Source video generation not found" };
      }

      if (sourceGeneration.status !== "completed") {
        return {
          success: false,
          error: "Source video must be completed before upscaling",
        };
      }

      if (!sourceGeneration.mediaGenerationId) {
        return {
          success: false,
          error: "Source video has no media generation ID",
        };
      }

      // Check if there's already an upscale in progress or completed for this source
      const existingUpscales = await videoUpscaleRepository.getBySourceGenerationId(sourceGenerationId);
      const inProgressUpscale = existingUpscales.find((u) => u.status === "pending" || u.status === "processing");

      if (inProgressUpscale) {
        logger.info(`Upscale already in progress for source: ${sourceGenerationId}, upscaleId: ${inProgressUpscale.id}`);
        return {
          success: true,
          data: {
            upscaleId: inProgressUpscale.id,
            sceneId: inProgressUpscale.sceneId,
            operationName: inProgressUpscale.operationName,
            alreadyExists: true,
          },
        };
      }

      const profile = await profileRepository.findById(sourceGeneration.profileId);
      if (!profile || !profile.isLoggedIn) {
        return { success: false, error: "Profile not found or not logged in" };
      }

      logger.info(
        `Starting video upscale for generation: ${sourceGenerationId}, profile: ${profile.name}, project: ${sourceGeneration.projectId}`
      );

      // Get cookies for the profile
      const cookieResult = await cookieService.getCookiesByProfile(sourceGeneration.profileId);
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

      const tokenResult = await veo3ApiClient.extractBearerToken(flowCookie.rawCookieString);
      if (!tokenResult.success || !tokenResult.token) {
        return {
          success: false,
          error: tokenResult.error || "Failed to extract bearer token",
        };
      }

      // Upscale the video using the source video's mediaGenerationId, aspectRatio, and seed
      const upscaleResult = await veo3ApiClient.upscaleVideo(
        tokenResult.token,
        sourceGeneration.mediaGenerationId, // This is the mediaId for the API
        sourceGeneration.aspectRatio,
        sourceGeneration.seed,
        model
      );

      if (!upscaleResult.success) {
        // Check if this is a 409 error (already exists) - might have been created by another request
        if (upscaleResult.error?.includes("already in progress") || upscaleResult.error?.includes("already exists")) {
          logger.warn(`Upscale already exists for source ${sourceGenerationId}, checking database...`);

          // Fetch the latest upscales again
          const latestUpscales = await videoUpscaleRepository.getBySourceGenerationId(sourceGenerationId);
          const existingUpscale = latestUpscales.find((u) => u.status === "pending" || u.status === "processing");

          if (existingUpscale) {
            logger.info(`Found existing upscale in database: ${existingUpscale.id}`);
            return {
              success: true,
              data: {
                upscaleId: existingUpscale.id,
                sceneId: existingUpscale.sceneId,
                operationName: existingUpscale.operationName,
                alreadyExists: true,
              },
            };
          }
        }

        return {
          success: false,
          error: upscaleResult.error || "Failed to start video upscale",
        };
      }

      const sceneId = upscaleResult.sceneId;
      const data = upscaleResult.data;
      const alreadyCompleted = (upscaleResult as any).alreadyCompleted || false;
      const upscaleId = randomBytes(16).toString("hex");

      // Handle case where video is already upscaled (returns rawBytes immediately)
      if (alreadyCompleted && sceneId) {
        const mediaGenerationId = data?.mediaGenerationId;
        const rawBytes = data?.rawBytes;

        logger.info(`Video already upscaled! MediaGenerationId: ${mediaGenerationId}`);
        logger.info(`RawBytes available for download: ${rawBytes ? "YES" : "NO"}`);
        logger.info(`Skipping database insert - returning data directly for immediate download`);

        // Don't create database record yet - just return the data for immediate download
        // Database record will be created only if the user explicitly saves/downloads the video
        return {
          success: true,
          data: {
            upscaleId: upscaleId, // Generate ID for tracking but don't save to DB
            sceneId,
            operationName: "already-completed",
            alreadyCompleted: true,
            mediaGenerationId,
            rawBytes, // Include rawBytes for immediate download
            // Include source info for optional DB save later
            sourceGenerationId,
            profileId: sourceGeneration.profileId,
            projectId: sourceGeneration.projectId,
            model,
          },
        };
      }

      // Normal flow: upscale is pending
      const operationName = data?.name || data?.operationName || "";

      if (!sceneId || !operationName) {
        return {
          success: false,
          error: "Invalid response from video upscale API",
        };
      }

      logger.info(`Video upscale started: operationName=${operationName}, sceneId=${sceneId}`);

      await videoUpscaleRepository.create({
        id: upscaleId,
        sourceGenerationId,
        profileId: sourceGeneration.profileId,
        projectId: sourceGeneration.projectId,
        sceneId,
        operationName,
        status: "pending",
        model,
        rawResponse: JSON.stringify(data),
      });

      // Add to polling manager (worker thread - non-blocking)
      veo3PollingManager.addToPolling(upscaleId, undefined, "upscale", sourceGeneration.profileId, operationName, sceneId);
      logger.info(`Added upscale ${upscaleId} to polling worker thread`);

      return { success: true, data: { upscaleId, sceneId, operationName } };
    } catch (error) {
      logger.error("Failed to start video upscale", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Check upscale status and update database
   * @param upscaleId - ID of the upscale record
   */
  async checkUpscaleStatus(upscaleId: string): Promise<
    ApiResponse<{
      status: string;
      videoUrl?: string;
      mediaGenerationId?: string;
      fifeUrl?: string;
      servingBaseUri?: string;
      errorMessage?: string;
      completedAt?: string;
    }>
  > {
    try {
      const upscale = await videoUpscaleRepository.getById(upscaleId);
      if (!upscale) {
        return { success: false, error: "Upscale record not found" };
      }

      const profile = await profileRepository.findById(upscale.profileId);
      if (!profile || !profile.isLoggedIn) {
        return { success: false, error: "Profile not found or not logged in" };
      }

      // Get cookies for the profile
      const cookieResult = await cookieService.getCookiesByProfile(upscale.profileId);
      if (!cookieResult.success || !cookieResult.data || cookieResult.data.length === 0) {
        return {
          success: false,
          error: "Profile has no cookies",
        };
      }

      const flowCookie = cookieResult.data.find((c) => c.service === COOKIE_SERVICES.FLOW && c.status === "active");
      if (!flowCookie || !flowCookie.rawCookieString) {
        return {
          success: false,
          error: "Profile has no active 'flow' cookies",
        };
      }

      const tokenResult = await veo3ApiClient.extractBearerToken(flowCookie.rawCookieString);
      if (!tokenResult.success || !tokenResult.token) {
        return {
          success: false,
          error: tokenResult.error || "Failed to extract bearer token",
        };
      }

      const statusResult = await veo3ApiClient.checkUpscaleStatus(tokenResult.token, upscale.operationName, upscale.sceneId);

      if (!statusResult.success || !statusResult.data) {
        return {
          success: false,
          error: statusResult.error || "Failed to check upscale status",
        };
      }

      const extracted = extractUpscaleMetadata(statusResult.data);
      const mediaStatus = extracted.status;

      logger.info(`Upscale ${upscaleId} status: ${mediaStatus}`);

      // Map Google API status to our database status
      let dbStatus: "pending" | "processing" | "completed" | "failed" = "processing";
      if (mediaStatus === "MEDIA_GENERATION_STATUS_SUCCESSFUL") {
        dbStatus = "completed";
      } else if (mediaStatus === "MEDIA_GENERATION_STATUS_FAILED") {
        dbStatus = "failed";
      } else if (mediaStatus === "MEDIA_GENERATION_STATUS_PENDING") {
        dbStatus = "pending";
      } else if (mediaStatus === "MEDIA_GENERATION_STATUS_ACTIVE") {
        dbStatus = "processing";
      }

      // Update database
      await videoUpscaleRepository.updateStatus(upscaleId, dbStatus, {
        mediaGenerationId: extracted.mediaGenerationId,
        fifeUrl: extracted.fifeUrl,
        servingBaseUri: extracted.servingBaseUri,
        videoUrl: extracted.videoUrl,
        seed: extracted.seed,
        aspectRatio: extracted.aspectRatio,
        rawResponse: JSON.stringify(statusResult.data),
        errorMessage: dbStatus === "failed" ? "Upscale generation failed" : undefined,
      });

      return {
        success: true,
        data: {
          status: dbStatus,
          videoUrl: extracted.videoUrl,
          mediaGenerationId: extracted.mediaGenerationId,
          fifeUrl: extracted.fifeUrl,
          servingBaseUri: extracted.servingBaseUri,
          completedAt: dbStatus === "completed" ? new Date().toISOString() : undefined,
        },
      };
    } catch (error) {
      logger.error("Failed to check upscale status", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get upscale by ID
   */
  async getUpscaleById(upscaleId: string): Promise<ApiResponse<any>> {
    try {
      const upscale = await videoUpscaleRepository.getById(upscaleId);
      if (!upscale) {
        return { success: false, error: "Upscale not found" };
      }
      return { success: true, data: upscale };
    } catch (error) {
      logger.error("Failed to get upscale", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get all upscales for a source generation
   */
  async getUpscalesBySourceGeneration(sourceGenerationId: string): Promise<ApiResponse<any[]>> {
    try {
      const upscales = await videoUpscaleRepository.getBySourceGenerationId(sourceGenerationId);
      return { success: true, data: upscales };
    } catch (error) {
      logger.error("Failed to get upscales", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get all upscales for a profile
   */
  async getUpscalesByProfile(profileId: string, limit: number = 50, offset: number = 0): Promise<ApiResponse<any[]>> {
    try {
      const upscales = await videoUpscaleRepository.getByProfile(profileId, limit, offset);
      return { success: true, data: upscales };
    } catch (error) {
      logger.error("Failed to get upscales by profile", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Download and decode base64 video data directly (no DB dependency)
   * This is used when the video is already upscaled and we have rawBytes
   * @param rawBytes - Base64 encoded video data
   * @param outputPath - Directory where to save the video file (optional, will use Downloads if not provided)
   * @param sourceGenerationId - Optional source generation ID for filename generation
   * @param filenamePattern - Optional filename pattern from settings (e.g., "{name}_{timestamp}.mp4")
   */
  async downloadBase64VideoDirectly(
    rawBytes: string,
    outputPath?: string,
    sourceGenerationId?: string,
    filenamePattern?: string
  ): Promise<ApiResponse<{ filePath: string }>> {
    try {
      logger.info(`Downloading base64 video data directly (${rawBytes.length} chars)`);

      if (!rawBytes) {
        return {
          success: false,
          error: "No base64 video data provided",
        };
      }

      const path = await import("path");
      const os = await import("os");

      // Generate filename using pattern or default
      let filename: string;
      if (filenamePattern) {
        // Apply filename pattern with variable substitution
        filename = filenamePattern
          .replace(/{name}/g, `upscaled-${sourceGenerationId || "video"}`)
          .replace(/{timestamp}/g, Date.now().toString())
          .replace(/{date}/g, new Date().toISOString().split("T")[0])
          .replace(/{time}/g, new Date().toTimeString().split(" ")[0].replace(/:/g, "-"));

        // Ensure .mp4 extension
        if (!filename.endsWith(".mp4")) {
          filename = filename.replace(/\.[^.]*$/, ".mp4"); // Replace existing extension
        }
      } else {
        // Default filename
        filename = `upscaled${sourceGenerationId ? `-${sourceGenerationId}` : ""}-${Date.now()}.mp4`;
      }

      // Determine directory (use provided path or default to Downloads)
      const directory = outputPath || path.join(os.homedir(), "Downloads");

      // Construct full file path
      const finalOutputPath = path.join(directory, filename);

      logger.info(`Saving upscaled video to: ${finalOutputPath}`);

      // Use the video API client to decode and save
      const saveResult = await veo3VideoApiClient.decodeAndSaveBase64Video(rawBytes, finalOutputPath);

      if (!saveResult.success) {
        return {
          success: false,
          error: saveResult.error || "Failed to save video from base64",
        };
      }

      logger.info(`Upscaled video downloaded successfully: ${saveResult.filePath}`);

      return {
        success: true,
        data: { filePath: saveResult.filePath! },
      };
    } catch (error) {
      logger.error("Failed to download base64 video directly", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Download upscaled video from base64 rawBytes stored in database
   * This is used when the video is already upscaled and returned in the API response
   * @param upscaleId - ID of the upscale record
   * @param outputPath - Full path where to save the video file (optional, will use default if not provided)
   */
  async downloadUpscaledVideoFromBase64(upscaleId: string, outputPath?: string): Promise<ApiResponse<{ filePath: string }>> {
    try {
      logger.info(`Downloading upscaled video from base64: ${upscaleId}`);

      const upscale = await videoUpscaleRepository.getById(upscaleId);
      if (!upscale) {
        return { success: false, error: "Upscale record not found" };
      }

      // Parse raw response to get rawBytes
      let rawBytes: string | undefined;
      try {
        const rawResponse = JSON.parse(upscale.rawResponse || "{}");
        rawBytes = rawResponse?.rawBytes || rawResponse?.operations?.[0]?.rawBytes;
      } catch (parseError) {
        logger.error("Failed to parse raw response", parseError);
        return { success: false, error: "Failed to parse upscale response data" };
      }

      if (!rawBytes) {
        return {
          success: false,
          error: "No base64 video data found in upscale record. Video might need to be downloaded via URL.",
        };
      }

      // Generate output path if not provided
      const finalOutputPath =
        outputPath ||
        (await import("path")).join(
          (await import("os")).homedir(),
          "Downloads",
          `upscaled-${upscale.sourceGenerationId}-${Date.now()}.mp4`
        );

      logger.info(`Saving upscaled video to: ${finalOutputPath}`);

      // Use the video API client to decode and save
      const saveResult = await veo3VideoApiClient.decodeAndSaveBase64Video(rawBytes, finalOutputPath);

      if (!saveResult.success) {
        return {
          success: false,
          error: saveResult.error || "Failed to save video from base64",
        };
      }

      // Update upscale record with video path
      await videoUpscaleRepository.updateStatus(upscaleId, "completed", {
        videoPath: saveResult.filePath,
      });

      logger.info(`Upscaled video downloaded successfully: ${saveResult.filePath}`);

      return {
        success: true,
        data: { filePath: saveResult.filePath! },
      };
    } catch (error) {
      logger.error("Failed to download upscaled video from base64", error);
      return { success: false, error: String(error) };
    }
  }
}

export const veo3VideoUpscaleService = new VEO3VideoUpscaleService();
