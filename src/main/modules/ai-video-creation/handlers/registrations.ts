import { BrowserWindow } from "electron";
import { IpcRegistration } from "../../../../core/ipc/types";
import { veo3Service } from "../services/veo3.service";

export const veo3Registrations: IpcRegistration[] = [
  {
    channel: "veo3:getAll",
    description: "Get all VEO3 projects",
    handler: async () => {
      return await veo3Service.getAllProjects();
    },
  },
  {
    channel: "veo3:getById",
    description: "Get VEO3 by id",
    handler: async (req: { id: string }) => {
      return await veo3Service.getProjectById((req as any).id);
    },
  },
  {
    channel: "veo3:create",
    description: "Create project",
    handler: async (req: any) => {
      return await veo3Service.createProject(req);
    },
  },
  {
    channel: "veo3:updateStatus",
    description: "Update project status",
    handler: async (req: { id: string; status: any }) => {
      return await veo3Service.updateProjectStatus((req as any).id, (req as any).status);
    },
  },
  {
    channel: "veo3:addScene",
    description: "Add scene",
    handler: async (req: { projectId: string; scene: any }) => {
      return await veo3Service.addScene((req as any).projectId, (req as any).scene);
    },
  },
  {
    channel: "veo3:removeScene",
    description: "Remove scene",
    handler: async (req: { projectId: string; sceneId: string }) => {
      return await veo3Service.removeScene((req as any).projectId, (req as any).sceneId);
    },
  },
  {
    channel: "veo3:updatePrompt",
    description: "Update json prompt",
    handler: async (req: { projectId: string; jsonPrompt: any }) => {
      return await veo3Service.updateJsonPrompt((req as any).projectId, (req as any).jsonPrompt);
    },
  },
  {
    channel: "veo3:delete",
    description: "Delete project",
    handler: async (req: { id: string }) => {
      return await veo3Service.deleteProject((req as any).id);
    },
  },
  // Fetch projects from VEO3 API by profile
  {
    channel: "veo3:fetchProjectsFromAPI",
    description: "Fetch projects from VEO3 API by profile",
    handler: async (req: { profileId: string }) => {
      return await veo3Service.fetchProjectsFromAPI((req as any).profileId);
    },
  },
  {
    channel: "veo3:createProjectViaAPI",
    description: "Create project via VEO3 API",
    handler: async (req: { profileId: string; projectTitle: string }) => {
      return await veo3Service.createProjectViaAPI((req as any).profileId, (req as any).projectTitle);
    },
  },

  // Video generation handlers
  {
    channel: "veo3:startVideoGeneration",
    description: "Start video generation",
    handler: async (req: { profileId: string; projectId: string; prompt: string; aspectRatio?: string }) => {
      return await veo3Service.startVideoGeneration(
        (req as any).profileId,
        (req as any).projectId,
        (req as any).prompt,
        (req as any).aspectRatio
      );
    },
  },
  {
    channel: "veo3:checkGenerationStatus",
    description: "Check video generation status",
    handler: async (req: { generationId: string }) => {
      return await veo3Service.checkGenerationStatus((req as any).generationId);
    },
  },
  {
    channel: "veo3:listGenerations",
    description: "List all video generations",
    handler: async (req: { limit?: number; offset?: number }) => {
      return await veo3Service.listGenerations((req as any).limit, (req as any).offset);
    },
  },
  {
    channel: "veo3:listGenerationsByProfile",
    description: "List video generations by profile",
    handler: async (req: { profileId: string; limit?: number; offset?: number }) => {
      return await veo3Service.listGenerationsByProfile((req as any).profileId, (req as any).limit, (req as any).offset);
    },
  },
  {
    channel: "veo3:getGenerationById",
    description: "Get video generation by ID",
    handler: async (req: { generationId: string }) => {
      return await veo3Service.getGenerationById((req as any).generationId);
    },
  },
  {
    channel: "veo3:refreshVideoStatus",
    description: "Manually refresh video status by operation name",
    handler: async (req: { operationName: string; generationId: string }) => {
      return await veo3Service.refreshVideoStatus((req as any).operationName, (req as any).generationId);
    },
  },
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
      return await veo3Service.generateMultipleVideosAsync(
        (req as any).requests,
        (req as any).delayMs,
        win
          ? (progress) => {
              // Send progress event to renderer only if window exists
              console.log(`[IPC Handler] Sending progress event for promptId: ${progress.promptId}, success: ${progress.success}`);
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

  // Video History handlers (new optimized pagination and filtering)
  {
    channel: "veo3:getVideoHistory",
    description: "Get paginated video history with filtering",
    handler: async (req: { page?: number; pageSize?: number; filter?: any }) => {
      return await veo3Service.getVideoHistory((req as any).page, (req as any).pageSize, (req as any).filter);
    },
  },
  {
    channel: "veo3:getVideoHistoryGroupedByDate",
    description: "Get video history grouped by date (like Google Photos)",
    handler: async (req: { page?: number; pageSize?: number; filter?: any }) => {
      return await veo3Service.getVideoHistoryGroupedByDate((req as any).page, (req as any).pageSize, (req as any).filter);
    },
  },
  {
    channel: "veo3:getStatusCounts",
    description: "Get status counts for video generations",
    handler: async (req: { profileId?: string }) => {
      return await veo3Service.getStatusCounts((req as any).profileId);
    },
  },
];
