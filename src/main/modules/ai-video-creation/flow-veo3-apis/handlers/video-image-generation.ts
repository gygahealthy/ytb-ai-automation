import { IpcRegistration } from "../../../../../core/ipc/types";
import { flowVeo3ApiService } from "../services/flow-veo3-api.service";

export const videoImageGenerationRegistrations: IpcRegistration[] = [
  {
    channel: "veo3:generateVideoFromImages",
    description: "Generate video from reference images (1-3 images)",
    handler: async (req: {
      profileId: string;
      projectId: string;
      prompt: string;
      imageReferences: Array<{ mediaId: string; imageId: string }>;
      aspectRatio?: "VIDEO_ASPECT_RATIO_LANDSCAPE" | "VIDEO_ASPECT_RATIO_PORTRAIT" | "VIDEO_ASPECT_RATIO_SQUARE";
      model?: string;
    }) => {
      return await flowVeo3ApiService.generateVideoFromImages(
        req.profileId,
        req.projectId,
        req.prompt,
        req.imageReferences,
        req.aspectRatio,
        req.model
      );
    },
  },
];
