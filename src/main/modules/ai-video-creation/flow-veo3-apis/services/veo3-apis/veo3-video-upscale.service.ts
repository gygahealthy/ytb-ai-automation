import { randomBytes } from "crypto";
import { ApiResponse } from "../../../../../../shared/types";
import { logger } from "../../../../../utils/logger-backend";
import { profileRepository } from "../../../../../storage/database";
import { COOKIE_SERVICES } from "../../../../gemini-apis/shared/types";
import { cookieService } from "../../../../common/cookie/services/cookie.service";
import { veo3ApiClient } from "../../apis/veo3-api.client";
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

  return { mediaGenerationId, fifeUrl, servingBaseUri, videoUrl, status, seed, aspectRatio };
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

      const upscaleResult = await veo3ApiClient.upscaleVideo(
        tokenResult.token,
        sourceGeneration.projectId,
        sourceGeneration.mediaGenerationId,
        sourceGeneration.sceneId,
        model
      );

      if (!upscaleResult.success) {
        return {
          success: false,
          error: upscaleResult.error || "Failed to start video upscale",
        };
      }

      const { sceneId, data } = upscaleResult;
      const operationName = data?.name || data?.operationName || "";

      if (!sceneId || !operationName) {
        return {
          success: false,
          error: "Invalid response from video upscale API",
        };
      }

      logger.info(`Video upscale started: operationName=${operationName}, sceneId=${sceneId}`);

      const upscaleId = randomBytes(16).toString("hex");
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
}

export const veo3VideoUpscaleService = new VEO3VideoUpscaleService();
