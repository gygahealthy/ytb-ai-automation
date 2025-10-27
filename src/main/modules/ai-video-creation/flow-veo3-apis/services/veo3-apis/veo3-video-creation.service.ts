import { randomBytes } from "crypto";
import { ApiResponse } from "../../../../../../shared/types";
import { logger } from "../../../../../utils/logger-backend";
import { profileRepository } from "../../../../../storage/database";
import { COOKIE_SERVICES } from "../../../../gemini-apis/shared/types";
import { cookieService } from "../../../../common/cookie/services/cookie.service";
import { veo3ApiClient } from "../../apis/veo3-api.client";
import { videoGenerationRepository } from "../../repository/video-generation.repository";

export interface ExtractedVideoMetadata {
  mediaGenerationId?: string;
  fifeUrl?: string;
  servingBaseUri?: string;
  videoUrl: string;
  status: string;
}

export function extractVideoMetadata(rawData: unknown): ExtractedVideoMetadata {
  // Type guard: ensure rawData is an object
  if (typeof rawData !== "object" || rawData === null) {
    return { videoUrl: "", status: "UNKNOWN" };
  }

  // Handle both types of responses:
  // Type 1: Direct response with operations[0]
  // Type 2: Wrapped response with raw.operations[0]
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

  // Extract mediaGenerationId from multiple possible locations:
  // 1. video.mediaGenerationId (inside metadata)
  // 2. operation.mediaGenerationId (top-level operation property)
  const mediaGenerationId = (video?.mediaGenerationId as string) || (op.mediaGenerationId as string);
  const fifeUrl = video?.fifeUrl as string;
  const servingBaseUri = video?.servingBaseUri as string;
  const videoUrl = (fifeUrl || servingBaseUri || (video?.url as string) || (op.videoUrl as string) || "") as string;

  return { mediaGenerationId, fifeUrl, servingBaseUri, videoUrl, status };
}

export class VEO3VideoCreationService {
  async startVideoGeneration(
    profileId: string,
    projectId: string,
    prompt: string,
    aspectRatio:
      | "VIDEO_ASPECT_RATIO_LANDSCAPE"
      | "VIDEO_ASPECT_RATIO_PORTRAIT"
      | "VIDEO_ASPECT_RATIO_SQUARE" = "VIDEO_ASPECT_RATIO_LANDSCAPE"
  ): Promise<
    ApiResponse<{
      generationId: string;
      sceneId: string;
      operationName: string;
    }>
  > {
    try {
      const profile = await profileRepository.findById(profileId);
      if (!profile || !profile.isLoggedIn) {
        return { success: false, error: "Profile not found or not logged in" };
      }

      logger.info(`Starting video generation for profile: ${profile.name}, project: ${projectId}`);

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

      const tokenResult = await veo3ApiClient.extractBearerToken(flowCookie.rawCookieString);
      if (!tokenResult.success || !tokenResult.token) {
        return {
          success: false,
          error: tokenResult.error || "Failed to extract bearer token",
        };
      }

      const generateResult = await veo3ApiClient.generateVideo(tokenResult.token, projectId, prompt, aspectRatio);
      if (!generateResult.success) {
        return {
          success: false,
          error: generateResult.error || "Failed to start video generation",
        };
      }

      const { sceneId, seed, data } = generateResult;
      const operationName = data?.name || data?.operationName || "";

      if (!sceneId || !seed || !operationName) {
        return {
          success: false,
          error: "Invalid response from video generation API",
        };
      }
      logger.info(`Video generation started: operationName=${operationName}, sceneId=${sceneId}`);

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
        rawResponse: JSON.stringify(data),
      });

      return { success: true, data: { generationId, sceneId, operationName } };
    } catch (error) {
      logger.error("Failed to start video generation", error);
      return { success: false, error: String(error) };
    }
  }
}

export const veo3VideoCreationService = new VEO3VideoCreationService();
