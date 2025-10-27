import { BrowserWindow } from "electron";
import { IpcRegistration } from "../../../../../core/ipc/types";
import { flowVeo3ApiService } from "../services/flow-veo3-api.service";

export const videoBatchGenerationRegistrations: IpcRegistration[] = [
  {
    channel: "veo3:generateMultipleVideosAsync",
    description: "Generate multiple videos async with delays (returns immediately, sends progress events)",
    handler: async (
      req: {
        requests: Array<{
          promptId: string;
          profileId: string;
          projectId: string;
          prompt: string;
          aspectRatio?: string;
        }>;
        delayMs?: number;
      },
      event?: Electron.IpcMainInvokeEvent
    ) => {
      console.log(`[IPC Handler] generateMultipleVideosAsync called with ${(req as any).requests?.length || 0} requests`);

      // Get the sender window to send progress events (optional - service will still work without it)
      const win = event ? BrowserWindow.fromWebContents(event.sender) : null;

      if (!win) {
        console.warn("[IPC Handler] No window found - progress events will not be sent to renderer");
        // But continue anyway - the service should handle this gracefully
      } else {
        console.log(`[IPC Handler] Window found, setting up progress callback`);
      }

      // Call the service with optional progress callback
      return await flowVeo3ApiService.generateMultipleVideosAsync(
        (req as any).requests,
        (req as any).delayMs,
        win
          ? (progress) => {
              // Send progress event to renderer only if window exists
              console.log(
                `[IPC Handler] Sending progress event for promptId: ${progress.promptId}, success: ${progress.success}`
              );
              if (win && !win.isDestroyed()) {
                win.webContents.send("veo3:multipleVideos:progress", progress);
                console.log(`[IPC Handler] Progress event sent successfully`);
              } else {
                console.error(`[IPC Handler] Window destroyed, cannot send progress event`);
              }
            }
          : undefined // No callback if no window
      );
    },
  },
];
