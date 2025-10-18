/**
 * Gemini Model Constants
 * Model identifiers and header helpers for Gemini API
 *
 * The model is passed via HTTP header: x-goog-ext-525001261-jspb
 * Header value format: [1, null, null, null, modelId, null, null, 0, imageFlags?]
 *
 * Reference: https://github.com/HanaokaYuzu/Gemini-API
 */

/**
 * Gemini model identifiers
 * These are the internal model IDs used by Google's Gemini API
 */
export const GEMINI_MODEL_IDS = {
  /** Gemini 2.5 Pro - Most capable model for complex tasks */
  GEMINI_2_5_PRO: "4af6c7f5da75d65d",

  /** Gemini 2.5 Flash - Fast model, optimized for speed */
  GEMINI_2_5_FLASH: "71c2d248d3b102ff",

  /** Gemini 2.0 Flash - Deprecated, previous generation */
  GEMINI_2_0_FLASH: "f299729663a2343f",
} as const;

/**
 * Model selection type
 */
export type GeminiModel = keyof typeof GEMINI_MODEL_IDS;

/**
 * Get model ID from model name or return default
 *
 * @param model Model name or ID (e.g., "GEMINI_2_5_PRO" or "gemini-2.5-pro")
 * @param defaultModel Fallback model if input is not recognized
 * @returns The model ID string
 *
 * @example
 * getModelId("GEMINI_2_5_PRO") // "4af6c7f5da75d65d"
 * getModelId("gemini-2.5-pro") // "4af6c7f5da75d65d"
 * getModelId("unspecified", "GEMINI_2_5_PRO") // "4af6c7f5da75d65d"
 */
export function getModelId(
  model?: string | null,
  defaultModel: GeminiModel = "GEMINI_2_5_PRO"
): string {
  if (!model || model === "unspecified") {
    return GEMINI_MODEL_IDS[defaultModel];
  }

  // Try as constant key (e.g., "GEMINI_2_5_PRO")
  const asKey = model.toUpperCase() as GeminiModel;
  if (asKey in GEMINI_MODEL_IDS) {
    return GEMINI_MODEL_IDS[asKey];
  }

  // Try parsing as format like "gemini-2.5-pro"
  const normalized = model.toUpperCase().replace(/-/g, "_");
  if (normalized in GEMINI_MODEL_IDS) {
    return GEMINI_MODEL_IDS[normalized as GeminiModel];
  }

  // Return default if not found
  return GEMINI_MODEL_IDS[defaultModel];
}

/**
 * Build the model header value for HTTP requests
 * Creates the x-goog-ext-525001261-jspb header value
 *
 * @param modelId The model ID (from GEMINI_MODEL_IDS or returned by getModelId)
 * @param enableImage Whether to include image capability flag [4]
 * @returns JSON array as string to use as header value
 *
 * @example
 * // For chat (no image support)
 * buildModelHeaderValue("4af6c7f5da75d65d", false)
 * // Returns: [1,null,null,null,"4af6c7f5da75d65d",null,null,0]
 *
 * // For image generation (with image flag)
 * buildModelHeaderValue("4af6c7f5da75d65d", true)
 * // Returns: [1,null,null,null,"4af6c7f5da75d65d",null,null,0,[4]]
 */
export function buildModelHeaderValue(
  modelId: string,
  enableImage: boolean = false
): string[] {
  const headerArray: unknown[] = [1, null, null, null, modelId, null, null, 0];

  if (enableImage) {
    headerArray.push([4]); // Image capability flag
  }

  return headerArray as string[];
}

/**
 * Get the model header object for HTTP requests
 * Returns headers with x-goog-ext-525001261-jspb set
 *
 * @param modelId The model ID (from getModelId or GEMINI_MODEL_IDS)
 * @param enableImage Whether to enable image capability
 * @returns Object with x-goog-ext-525001261-jspb header
 *
 * @example
 * // Chat header (text-only)
 * getChatModelHeader("4af6c7f5da75d65d")
 * // Returns: { "x-goog-ext-525001261-jspb": '[1,null,null,null,"4af6c7f5da75d65d",null,null,0]' }
 *
 * // Image generation header
 * getImageModelHeader("4af6c7f5da75d65d")
 * // Returns: { "x-goog-ext-525001261-jspb": '[1,null,null,null,"4af6c7f5da75d65d",null,null,0,[4]]' }
 */
export function getModelHeaders(
  modelId: string,
  enableImage: boolean = false
): Record<string, string> {
  const headerValue = buildModelHeaderValue(modelId, enableImage);
  return {
    "x-goog-ext-525001261-jspb": JSON.stringify(headerValue),
  };
}

/**
 * Get model headers for text chat (no image support)
 *
 * @param modelId The model ID
 * @returns Object with x-goog-ext-525001261-jspb header
 *
 * @example
 * getChatModelHeader("4af6c7f5da75d65d")
 */
export function getChatModelHeader(modelId: string): Record<string, string> {
  return getModelHeaders(modelId, false);
}

/**
 * Get model headers for image generation (with image support)
 *
 * @param modelId The model ID
 * @returns Object with x-goog-ext-525001261-jspb header
 *
 * @example
 * getImageModelHeader("4af6c7f5da75d65d")
 */
export function getImageModelHeader(modelId: string): Record<string, string> {
  return getModelHeaders(modelId, true);
}

/**
 * Resolve model selection to model ID and headers for chat
 *
 * @param model Model name, ID, or undefined (defaults to Gemini 2.5 Pro)
 * @returns Object with modelId and headers
 *
 * @example
 * resolveChatModel("gemini-2.5-pro")
 * // Returns: { modelId: "4af6c7f5da75d65d", headers: {...} }
 *
 * resolveChatModel()
 * // Returns: { modelId: "4af6c7f5da75d65d", headers: {...} } (default)
 */
export function resolveChatModel(model?: string | null): {
  modelId: string;
  headers: Record<string, string>;
} {
  const modelId = getModelId(model);
  return {
    modelId,
    headers: getChatModelHeader(modelId),
  };
}

/**
 * Resolve model selection to model ID and headers for image generation
 *
 * @param model Model name, ID, or undefined (defaults to Gemini 2.5 Pro)
 * @returns Object with modelId and headers
 *
 * @example
 * resolveImageModel("gemini-2.5-pro")
 * // Returns: { modelId: "4af6c7f5da75d65d", headers: {...} }
 */
export function resolveImageModel(model?: string | null): {
  modelId: string;
  headers: Record<string, string>;
} {
  const modelId = getModelId(model);
  return {
    modelId,
    headers: getImageModelHeader(modelId),
  };
}
