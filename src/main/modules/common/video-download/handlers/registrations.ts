import { IpcRegistration, ApiResponse } from "../../../../../core/ipc/types";
import { videoDownloadService } from "../services/video-download.service";
import { videoDownloadByNameService } from "../services/video-download-name.service";
import { cookieService } from "../../../common/cookie/services/cookie.service";
import { flowSecretExtractionService } from "../../../common/secret-extraction/services/secret-extraction.service";
import { extractBearerToken } from "../../../ai-video-creation/flow-veo3-apis/helpers/veo3-headers.helper";
import { COOKIE_SERVICES } from "../../../gemini-apis/shared/types";
import type { DownloadResult, DownloadStatus } from "../types/download.types";
import type { VideoDownloadByNameResult, VideoDownloadByNameStatus } from "../types/video-download-name.types";

export const videoDownloadRegistrations: IpcRegistration[] = [
  {
    channel: "video:download:single",
    description: "Download a single video",
    handler: async (req: {
      videoUrl: string;
      filename?: string;
      downloadPath?: string;
      videoIndex?: number;
      settings?: {
        autoCreateDateFolder?: boolean;
        autoIndexFilename?: boolean;
        addEpochTimeToFilename?: boolean;
      };
    }): Promise<ApiResponse<DownloadResult>> => {
      const { videoUrl, filename, downloadPath, videoIndex, settings } = req;
      try {
        const result = await videoDownloadService.downloadVideo(videoUrl, filename, downloadPath, videoIndex, settings);
        return {
          success: true,
          data: result as DownloadResult,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
  },
  {
    channel: "video:download:batch",
    description: "Download multiple videos with optional progress callback",
    handler: async (req: {
      videos: Array<{ videoUrl: string; filename?: string; videoIndex?: number }>;
      downloadPath?: string;
      settings?: {
        autoCreateDateFolder?: boolean;
        autoIndexFilename?: boolean;
        addEpochTimeToFilename?: boolean;
      };
    }): Promise<ApiResponse<DownloadResult[]>> => {
      const { videos, downloadPath, settings } = req;
      try {
        const results = await videoDownloadService.downloadMultipleVideos(videos, undefined, downloadPath, settings);
        return {
          success: true,
          data: results,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
  },
  {
    channel: "video:download:status",
    description: "Get download queue and worker status",
    handler: async (): Promise<ApiResponse<DownloadStatus>> => {
      try {
        const status = videoDownloadService.getStatus();
        return {
          success: true,
          data: status,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
  },
  {
    channel: "video:download:by-name:single",
    description: "Download a single video by name/ID using bearer token and FLOW_NEXT_KEY",
    handler: async (req: {
      profileId: string;
      videoName: string;
      mediaKey: string;
      bearerToken: string;
      flowNextKey: string;
      downloadPath: string;
      fifeUrl?: string;
    }): Promise<ApiResponse<VideoDownloadByNameResult>> => {
      const { profileId, videoName, mediaKey, bearerToken, flowNextKey, downloadPath, fifeUrl } = req;
      try {
        const result = await videoDownloadByNameService.downloadVideo(
          profileId,
          videoName,
          mediaKey,
          bearerToken,
          flowNextKey,
          downloadPath,
          fifeUrl
        );
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
  },
  {
    channel: "video:download:by-name:batch",
    description: "Download multiple videos by name/ID with optional progress callback",
    handler: async (req: {
      videos: Array<{ profileId: string; videoName: string; mediaKey: string; fifeUrl?: string }>;
      bearerToken: string;
      flowNextKey: string;
      downloadPath: string;
    }): Promise<ApiResponse<VideoDownloadByNameResult[]>> => {
      const { videos, bearerToken, flowNextKey, downloadPath } = req;
      try {
        const results = await videoDownloadByNameService.downloadMultipleVideos(videos, bearerToken, flowNextKey, downloadPath);
        return {
          success: true,
          data: results,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
  },
  {
    channel: "video:download:by-name:status",
    description: "Get download by name queue and worker status",
    handler: async (): Promise<ApiResponse<VideoDownloadByNameStatus>> => {
      try {
        const status = videoDownloadByNameService.getStatus();
        return {
          success: true,
          data: status,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
  },
  {
    channel: "video:download:by-name:auto",
    description: "Download a single video by name/ID with automatic token extraction",
    handler: async (req: {
      profileId: string;
      videoName: string;
      mediaKey: string;
      downloadPath: string;
      fifeUrl?: string;
    }): Promise<ApiResponse<VideoDownloadByNameResult>> => {
      const { profileId, videoName, mediaKey, downloadPath, fifeUrl } = req;
      try {
        // Get flow cookie for the profile
        const cookieResult = await cookieService.getCookiesByProfile(profileId);
        if (!cookieResult.success || !cookieResult.data || cookieResult.data.length === 0) {
          return { success: false, error: "Profile has no cookies. Please login first." };
        }

        const flowCookie = cookieResult.data.find((c) => c.service === COOKIE_SERVICES.FLOW && c.status === "active");
        if (!flowCookie || !flowCookie.rawCookieString) {
          return { success: false, error: "Profile has no active 'flow' cookies. Please login first." };
        }

        // Extract bearer token from cookie
        const tokenResult = await extractBearerToken(flowCookie.rawCookieString);
        if (!tokenResult.success || !tokenResult.token) {
          return { success: false, error: tokenResult.error || "Failed to extract bearer token" };
        }

        // Get FLOW_NEXT_KEY
        let flowNextKey = await flowSecretExtractionService.getValidSecret(profileId, "FLOW_NEXT_KEY");
        if (!flowNextKey) {
          // Try to extract secrets
          const extractResult = await flowSecretExtractionService.extractSecrets(profileId);
          if (!extractResult.success) {
            return { success: false, error: "Failed to extract FLOW_NEXT_KEY. Please ensure profile cookies are valid." };
          }
          flowNextKey = await flowSecretExtractionService.getValidSecret(profileId, "FLOW_NEXT_KEY");
          if (!flowNextKey) {
            return { success: false, error: "Failed to obtain FLOW_NEXT_KEY after extraction." };
          }
        }

        // Download video using the name-based service
        const result = await videoDownloadByNameService.downloadVideo(
          profileId,
          videoName,
          mediaKey,
          tokenResult.token,
          flowNextKey,
          downloadPath,
          fifeUrl
        );

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
  },
];
