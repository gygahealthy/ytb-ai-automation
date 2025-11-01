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
    channel: "image-veo3:sync-metadata",
    description: "Sync image metadata from Flow server (deletes existing and fetches all images)",
    handler: async (req: { profileId: string }) => {
      return await imageVeo3Service.syncImageMetadata(req.profileId);
    },
  },
  {
    channel: "image-veo3:download-single",
    description: "Download a single image by name",
    handler: async (req: { profileId: string; imageName: string; localStoragePath: string }) => {
      return await imageVeo3Service.downloadSingleImage(req.profileId, req.imageName, req.localStoragePath);
    },
  },
  {
    channel: "image-veo3:download-batch",
    description: "Download multiple images in batch",
    handler: async (req: { profileId: string; imageNames: string[]; localStoragePath: string }) => {
      return await imageVeo3Service.downloadImages(req.profileId, req.imageNames, req.localStoragePath);
    },
  },
  {
    channel: "image-veo3:get-local-images",
    description: "Get images from local database for a profile",
    handler: async (req: { profileId: string }) => {
      return await imageVeo3Service.getLocalImages(req.profileId);
    },
  },
  {
    channel: "image-veo3:delete",
    description: "Delete an image from Flow server and local database",
    handler: async (req: { imageId: string; profileId: string }) => {
      return await imageVeo3Service.deleteImage(req.imageId, req.profileId);
    },
  },
  {
    channel: "image-veo3:force-refresh",
    description: "Delete all image records and local files for a profile",
    handler: async (req: { profileId: string }) => {
      return await imageVeo3Service.forceRefreshImages(req.profileId);
    },
  },
];
