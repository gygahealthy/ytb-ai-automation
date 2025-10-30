/**
 * VEO3 Model Types
 * Based on API response from videoFx.getVideoModelConfig
 */

export type VideoAspectRatio = "VIDEO_ASPECT_RATIO_LANDSCAPE" | "VIDEO_ASPECT_RATIO_PORTRAIT" | "VIDEO_ASPECT_RATIO_SQUARE";

export type ModelAccessType = "MODEL_ACCESS_TYPE_GENERAL" | "MODEL_ACCESS_TYPE_RESTRICTED";

export type VideoModelCapability =
  | "VIDEO_MODEL_CAPABILITY_TEXT"
  | "VIDEO_MODEL_CAPABILITY_AUDIO"
  | "VIDEO_MODEL_CAPABILITY_START_IMAGE"
  | "VIDEO_MODEL_CAPABILITY_END_IMAGE"
  | "VIDEO_MODEL_CAPABILITY_START_IMAGE_AND_END_IMAGE";

export type PaygateTier = "PAYGATE_TIER_ONE" | "PAYGATE_TIER_TWO" | "PAYGATE_TIER_THREE";

export type ModelStatus = "MODEL_STATUS_ACTIVE" | "MODEL_STATUS_DEPRECATED";

export interface VEO3ModelMetadata {
  veoModelName?: string;
  [key: string]: any;
}

export interface VEO3Model {
  key: string;
  supportedAspectRatios: VideoAspectRatio[];
  accessType: ModelAccessType;
  capabilities: VideoModelCapability[];
  videoLengthSeconds: number;
  videoGenerationTimeSeconds: number;
  displayName: string;
  framesPerSecond: number;
  paygateTier: PaygateTier;
  modelAccessInfo: Record<string, any>;
  modelMetadata: VEO3ModelMetadata;
  modelStatus?: ModelStatus;
  creditCost?: number;
}

/**
 * Extended model with app-specific settings
 */
export interface VEO3ModelWithSettings extends VEO3Model {
  isDefaultForRender: boolean;
  enabledForUsage: boolean;
}

/**
 * API Response structure
 */
export interface VEO3ModelsAPIResponse {
  result: {
    data: {
      json: {
        result: {
          videoModels: VEO3Model[];
        };
        status: number;
        statusText: string;
      };
    };
  };
}
