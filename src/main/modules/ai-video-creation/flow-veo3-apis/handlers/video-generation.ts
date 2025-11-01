import { IpcRegistration } from "../../../../../core/ipc/types";
import { flowVeo3ApiService } from "../services/flow-veo3-api.service";
import { videoFileReaderService } from "../services/video-file-reader.service";

export const videoGenerationRegistrations: IpcRegistration[] = [
  // Video generation handlers
  {
    channel: "veo3:startVideoGeneration",
    description: "Start video generation",
    handler: async (req: { profileId: string; projectId: string; prompt: string; aspectRatio?: string; model?: string }) => {
      return await flowVeo3ApiService.startVideoGeneration(
        (req as any).profileId,
        (req as any).projectId,
        (req as any).prompt,
        (req as any).aspectRatio,
        (req as any).model
      );
    },
  },
  {
    channel: "veo3:checkGenerationStatus",
    description: "Check video generation status",
    handler: async (req: { generationId: string }) => {
      return await flowVeo3ApiService.checkGenerationStatus((req as any).generationId);
    },
  },
  {
    channel: "veo3:listGenerations",
    description: "List all video generations",
    handler: async (req: { limit?: number; offset?: number }) => {
      return await flowVeo3ApiService.listGenerations((req as any).limit, (req as any).offset);
    },
  },
  {
    channel: "veo3:listGenerationsByProfile",
    description: "List video generations by profile",
    handler: async (req: { profileId: string; limit?: number; offset?: number }) => {
      return await flowVeo3ApiService.listGenerationsByProfile((req as any).profileId, (req as any).limit, (req as any).offset);
    },
  },
  {
    channel: "veo3:getGenerationById",
    description: "Get video generation by ID",
    handler: async (req: { generationId: string }) => {
      return await flowVeo3ApiService.getGenerationById((req as any).generationId);
    },
  },
  {
    channel: "veo3:refreshVideoStatus",
    description: "Manually refresh video status by operation name",
    handler: async (req: { operationName: string; generationId: string }) => {
      return await flowVeo3ApiService.refreshVideoStatus((req as any).operationName, (req as any).generationId);
    },
  },
  {
    channel: "veo3:getGenerationStatusFromDB",
    description: "Get video generation status from DB only (no API call)",
    handler: async (req: { generationId: string }) => {
      return await flowVeo3ApiService.getGenerationById((req as any).generationId);
    },
  },
  {
    channel: "veo3:getMultipleGenerationStatusFromDB",
    description: "Get multiple video generation statuses from DB only (no API call)",
    handler: async (req: { generationIds: string[] }) => {
      const ids = (req as any).generationIds || [];
      const results = await Promise.all(ids.map((id: string) => flowVeo3ApiService.getGenerationById(id)));
      return { success: true, data: results.map((r: any) => r.data).filter(Boolean) };
    },
  },
  // Lightweight polling handlers for frontend frequent updates
  {
    channel: "veo3:pollGenerationStatusDB",
    description: "Lightweight poll for single generation status from DB (for UI polling)",
    handler: async (req: { generationId: string }) => {
      return await flowVeo3ApiService.getGenerationById((req as any).generationId);
    },
  },
  {
    channel: "veo3:pollMultipleGenerationStatusDB",
    description: "Lightweight poll for multiple generation statuses from DB (for UI polling)",
    handler: async (req: { generationIds: string[] }) => {
      const ids = (req as any).generationIds || [];
      const results = await Promise.all(ids.map((id: string) => flowVeo3ApiService.getGenerationById(id)));
      return { success: true, data: results.map((r: any) => r.data).filter(Boolean) };
    },
  },
  {
    channel: "veo3:read-video-file",
    description: "Read video file from disk and return as data URL or file:// protocol (non-blocking via worker thread)",
    handler: async (req: { filePath: string; maxSizeBytes?: number }) => {
      try {
        // Use worker thread service for non-blocking I/O
        const result = await videoFileReaderService.readVideoFile(req.filePath, req.maxSizeBytes);

        if (result.success) {
          return {
            success: true,
            data: {
              dataUrl: result.dataUrl,
              mimeType: result.mimeType,
              fileSize: result.fileSize,
            },
          };
        } else {
          return { success: false, error: result.error };
        }
      } catch (error) {
        return { success: false, error: `Failed to read video file: ${String(error)}` };
      }
    },
  },
];
