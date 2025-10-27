import { IpcRegistration } from "../../../../../core/ipc/types";
import { flowVeo3ApiService } from "../services/flow-veo3-api.service";

export const videoGenerationRegistrations: IpcRegistration[] = [
  // Video generation handlers
  {
    channel: "veo3:startVideoGeneration",
    description: "Start video generation",
    handler: async (req: { profileId: string; projectId: string; prompt: string; aspectRatio?: string }) => {
      return await flowVeo3ApiService.startVideoGeneration(
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
];
