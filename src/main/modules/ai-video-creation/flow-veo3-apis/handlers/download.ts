import { BrowserWindow } from "electron";
import { IpcRegistration } from "../../../../../core/ipc/types";
import { veo3VideoDownloadService } from "../services/veo3-video-download.service";

export const downloadRegistrations: IpcRegistration[] = [
  {
    channel: "veo3:downloadVideo",
    description: "Download video from URL to local file system",
    handler: async (req: { videoUrl: string; filename?: string; downloadPath?: string; videoIndex?: number }) => {
      try {
        const result = await veo3VideoDownloadService.downloadVideo(
          (req as any).videoUrl,
          (req as any).filename,
          (req as any).downloadPath,
          (req as any).videoIndex
        );

        if (!result.success) {
          return {
            success: false,
            error: result.error || "Failed to download video",
          };
        }

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error occurred during download";
        console.error("[Download Handler] Error:", message, error);
        return {
          success: false,
          error: message,
        };
      }
    },
  },
  {
    channel: "veo3:downloadMultipleVideos",
    description: "Download multiple videos concurrently",
    handler: async (
      req: {
        videos: Array<{ videoUrl: string; filename?: string }>;
        downloadPath?: string;
      },
      event?: Electron.IpcMainInvokeEvent
    ) => {
      try {
        const win = event ? BrowserWindow.fromWebContents(event.sender) : null;

        const results = await veo3VideoDownloadService.downloadMultipleVideos(
          (req as any).videos,
          (result) => {
            // Send progress event to renderer for each completed download
            if (win && !win.isDestroyed()) {
              win.webContents.send("veo3:downloadProgress", result);
            }
          },
          (req as any).downloadPath
        );

        return {
          success: true,
          data: results,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error occurred during batch download";
        console.error("[Download Handler] Batch Error:", message, error);
        return {
          success: false,
          error: message,
        };
      }
    },
  },
  {
    channel: "veo3:downloadStatus",
    description: "Get current download queue status",
    handler: async () => {
      return {
        success: true,
        data: veo3VideoDownloadService.getStatus(),
      };
    },
  },
];
