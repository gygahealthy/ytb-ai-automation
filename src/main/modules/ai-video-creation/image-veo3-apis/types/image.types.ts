/**
 * VEO3 Image Generation Types
 * Based on Flow API image upload and fetch responses
 */

/**
 * Aspect ratio values from Flow API
 */
export type ImageAspectRatio =
  | "IMAGE_ASPECT_RATIO_LANDSCAPE"
  | "IMAGE_ASPECT_RATIO_PORTRAIT"
  | "IMAGE_ASPECT_RATIO_SQUARE"
  | "IMAGE_ASPECT_RATIO_UNSPECIFIED";

/**
 * Media generation ID structure from Flow API
 */
export interface MediaGenerationId {
  mediaType: "IMAGE";
  workflowId: string;
  workflowStepId: string;
  mediaKey: string;
}

/**
 * VEO3 Image Generation entity
 */
export interface Veo3ImageGeneration {
  id: string; // Generated UUID
  profileId: string;
  name: string; // Flow API name field (CAMa...)
  aspectRatio?: ImageAspectRatio;
  workflowId: string; // mediaGenerationId.workflowId
  mediaKey: string; // mediaGenerationId.mediaKey
  localPath?: string; // Path where image is stored locally
  fifeUrl?: string; // Flow API fifeUrl for direct download
  createdAt: Date; // Flow API createTime
}

/**
 * Database row structure
 */
export interface Veo3ImageGenerationRow {
  id: string;
  profile_id: string;
  name: string;
  aspect_ratio?: string;
  workflow_id: string;
  media_key: string;
  local_path?: string;
  fife_url?: string;
  created_at: string;
}

/**
 * Flow API response for user image upload
 */
export interface FlowUploadImageResponse {
  mediaGenerationId: {
    mediaGenerationId: string; // Base64-encoded media ID string (e.g., CAMa...)
  };
  width: number;
  height: number;
}

/**
 * Flow API response for fetching user images
 */
export interface FlowUserWorkflow {
  name: string;
  media: {
    name: string;
    userUploadedImage?: {
      aspectRatio: ImageAspectRatio;
      fifeUrl?: string;
    };
    mediaGenerationId?: MediaGenerationId;
  };
  createTime: string;
}

export interface FlowFetchImagesResponse {
  result: {
    userWorkflows: FlowUserWorkflow[];
    nextPageToken?: string;
  };
  status: number;
  statusText: string;
}

/**
 * Flow API response for fetching a single image
 */
export interface FlowFetchImageResponse {
  name: string;
  userUploadedImage: {
    image: string; // Base64 string
    mediaGenerationId: string;
    fifeUrl: string;
    aspectRatio: ImageAspectRatio;
  };
  mediaGenerationId: MediaGenerationId;
}

/**
 * Input for creating a new image generation record
 */
export interface CreateImageGenerationInput {
  profileId: string;
  name: string;
  aspectRatio?: ImageAspectRatio;
  workflowId: string;
  mediaKey: string;
  localPath?: string;
  fifeUrl?: string;
  createdAt?: Date;
}
