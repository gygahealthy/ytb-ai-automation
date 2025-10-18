/**
 * Gemini Model Selection Constants
 *
 * Supported Gemini models for API requests
 * Reference: https://github.com/hieu2906090/Gemini-API#select-language-model
 *
 * Available as of June 12, 2025:
 * - unspecified: Default model
 * - gemini-2.5-pro: Latest Gemini 2.5 Pro (daily usage limit imposed)
 * - gemini-2.5-flash: Latest Gemini 2.5 Flash
 *
 * Deprecated (still working):
 * - gemini-2.0-flash: Older Gemini 2.0 Flash
 * - gemini-2.0-flash-thinking: Older Gemini 2.0 Flash Thinking
 */

// Default model - automatically selected by Gemini
export const GEMINI_MODEL_UNSPECIFIED = "unspecified";

// Latest models
export const GEMINI_MODEL_2_5_PRO = "gemini-2.5-pro";
export const GEMINI_MODEL_2_5_FLASH = "gemini-2.5-flash";

// Legacy models (deprecated, but still working)
export const GEMINI_MODEL_2_0_FLASH = "gemini-2.0-flash";
export const GEMINI_MODEL_2_0_FLASH_THINKING = "gemini-2.0-flash-thinking";

/**
 * Model information and metadata
 */
export const GEMINI_MODELS = {
  [GEMINI_MODEL_UNSPECIFIED]: {
    name: "Default",
    description: "Automatically selected default model",
    isDeprecated: false,
    hasUsageLimit: false,
  },
  [GEMINI_MODEL_2_5_PRO]: {
    name: "Gemini 2.5 Pro",
    description: "Latest Gemini 2.5 Pro model with thinking capabilities",
    isDeprecated: false,
    hasUsageLimit: true,
    dailyLimit: "Unknown - check Google's documentation",
  },
  [GEMINI_MODEL_2_5_FLASH]: {
    name: "Gemini 2.5 Flash",
    description: "Fast Gemini 2.5 Flash model optimized for speed",
    isDeprecated: false,
    hasUsageLimit: false,
  },
  [GEMINI_MODEL_2_0_FLASH]: {
    name: "Gemini 2.0 Flash",
    description: "Legacy Gemini 2.0 Flash model",
    isDeprecated: true,
    hasUsageLimit: false,
  },
  [GEMINI_MODEL_2_0_FLASH_THINKING]: {
    name: "Gemini 2.0 Flash Thinking",
    description: "Legacy Gemini 2.0 Flash model with thinking capabilities",
    isDeprecated: true,
    hasUsageLimit: false,
  },
};

// Type for model selection
export type GeminiModelType =
  | typeof GEMINI_MODEL_UNSPECIFIED
  | typeof GEMINI_MODEL_2_5_PRO
  | typeof GEMINI_MODEL_2_5_FLASH
  | typeof GEMINI_MODEL_2_0_FLASH
  | typeof GEMINI_MODEL_2_0_FLASH_THINKING;

/**
 * Get model information
 * @param model Model identifier
 * @returns Model metadata or undefined if not found
 */
export function getModelInfo(model: string) {
  return GEMINI_MODELS[model as GeminiModelType];
}

/**
 * Check if model is currently supported
 * @param model Model identifier
 * @returns true if model is available
 */
export function isSupportedModel(model: string): boolean {
  return model in GEMINI_MODELS;
}

/**
 * Check if model is deprecated
 * @param model Model identifier
 * @returns true if model is deprecated
 */
export function isDeprecatedModel(model: string): boolean {
  const info = getModelInfo(model);
  return info?.isDeprecated ?? false;
}
