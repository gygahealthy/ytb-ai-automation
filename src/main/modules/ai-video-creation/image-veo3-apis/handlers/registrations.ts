import { IpcRegistration } from "../../../../../core/ipc/types";
import { imageVeo3Service } from "../services/image-veo3.service";

/**
 * Image VEO3 IPC Handlers
 * Handle image upload, fetch, and sync operations
 */

export const imageVeo3Registrations: IpcRegistration[] = [
  {
    channel: "image-veo3:upload",
    description: "Upload local image to Flow server",
    handler: async (req: {
      profileId: string;
      imagePath: string;
      localStoragePath: string;
      aspectRatio?: "IMAGE_ASPECT_RATIO_LANDSCAPE" | "IMAGE_ASPECT_RATIO_PORTRAIT" | "IMAGE_ASPECT_RATIO_SQUARE";
    }) => {
      return await imageVeo3Service.uploadImage(
        req.profileId,
        req.imagePath,
        req.localStoragePath,
        req.aspectRatio || "IMAGE_ASPECT_RATIO_LANDSCAPE"
      );
    },
  },
  {
    channel: "image-veo3:fetch-user-images",
    description: "Fetch user images from Flow server with pagination",
    handler: async (req: { profileId: string; pageSize?: number; cursor?: string | null }) => {
      return await imageVeo3Service.fetchUserImages(req.profileId, req.pageSize || 18, req.cursor || null);
    },
  },
  {
    channel: "image-veo3:sync-from-flow",
    description: "Sync images from Flow server to local database and storage",
    handler: async (req: { profileId: string; localStoragePath: string; maxPages?: number }) => {
      return await imageVeo3Service.syncImagesFromFlow(req.profileId, req.localStoragePath, req.maxPages || 5);
    },
  },
  {
    channel: "image-veo3:get-local-images",
    description: "Get images from local database for a profile",
    handler: async (req: { profileId: string }) => {
      return await imageVeo3Service.getLocalImages(req.profileId);
    },
  },
];
