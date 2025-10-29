import { IpcRegistration, ApiResponse } from "../../../../../core/ipc/types";
import { videoDownloadService } from "../services/video-download.service";
import type { DownloadResult, DownloadStatus } from "../types/download.types";

export const videoDownloadRegistrations: IpcRegistration[] = [
  {
    channel: "video:download:single",
    description: "Download a single video",
    handler: async (req: {
      videoUrl: string;
      filename?: string;
      downloadPath?: string;
      videoIndex?: number;
    }): Promise<ApiResponse<DownloadResult>> => {
      const { videoUrl, filename, downloadPath, videoIndex } = req;
      try {
        const result = await videoDownloadService.downloadVideo(videoUrl, filename, downloadPath, videoIndex);
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
    }): Promise<ApiResponse<DownloadResult[]>> => {
      const { videos, downloadPath } = req;
      try {
        const results = await videoDownloadService.downloadMultipleVideos(videos, undefined, downloadPath);
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
];
