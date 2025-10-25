/**
 * Chat Service Helpers
 * Helper functions for chat operations
 * Uses consolidated HttpService for all HTTP communication
 */

import type {
  ConversationContext,
  ConversationMetadata,
  ChatOptions,
  ChatResponse,
  ChatMessage,
} from "../types/gemini-chat.types.js";
import { logger } from "../../../utils/logger-backend.js";
import type { CookieManagerDB } from "../../common/cookie/services/cookie-manager-db.js";
import { createHttpService, HttpService } from "../services/http.service.js";
import { resolveChatModel } from "../shared/constants/model.constants.js";

/**
 * Build f.req payload for chat request
 * Format: [null, JSON.stringify([[prompt], null, conversationContext, ...gemParams])]
 *
 * @param prompt The user's prompt/message
 * @param conversationContext Optional conversation context for multi-turn chats
 * @param model Optional model parameter (null for default, model ID string for specific model)
 * @returns Encoded f.req payload
 */
export function buildChatPayload(
  prompt: string,
  conversationContext: ConversationContext | null = null,
  model: string | null = null
): string {
  let inner: unknown[];

  // Note: model parameter should be null for default model
  // Model ID selection is handled via HTTP headers, not payload

  if (conversationContext) {
    const { chatId, replyId, rcId } = conversationContext;
    // Include model in the payload: [prompt], null, conversationContext, null, modelParam
    inner = [[prompt], null, [chatId, replyId, rcId], null, model];
  } else {
    // New conversation with model parameter
    inner = [[prompt], null, null, null, model];
  }

  const innerJson = JSON.stringify(inner);
  const fReq = JSON.stringify([null, innerJson]);

  return fReq;
}

/**
 * Create conversation context for multi-turn chat
 */
export function createConversationContext(chatId: string, replyId: string, rcId: string): ConversationContext {
  return { chatId, replyId, rcId };
}

/**
 * Create an empty conversation metadata object
 */
export function createEmptyMetadata(): ConversationMetadata {
  return {
    cid: null,
    rid: null,
    rcid: null,
  };
}

/**
 * Extract conversation context from metadata
 */
export function extractConversationContext(metadata: ConversationMetadata): ConversationContext | null {
  if (metadata.cid && metadata.rid && metadata.rcid) {
    return {
      chatId: metadata.cid,
      replyId: metadata.rid,
      rcId: metadata.rcid,
    };
  }
  return null;
}

/**
 * Convert HTML to plain text
 * Removes HTML tags and decodes entities
 */
export function htmlToText(html: string): string {
  const text = html
    // Replace br tags with newlines
    .replace(/<br\s*\/?>/gi, "\n")
    // Replace paragraph tags with double newlines
    .replace(/<\/p>/gi, "\n")
    .replace(/<p[^>]*>/gi, "")
    // Replace div tags with newlines
    .replace(/<\/div>/gi, "\n")
    .replace(/<div[^>]*>/gi, "")
    // Remove all other HTML tags
    .replace(/<[^>]+>/g, "")
    // Decode HTML entities
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    // Remove multiple consecutive newlines
    .replace(/\n\n+/g, "\n\n")
    // Trim whitespace
    .trim();

  return text;
}

/**
 * Extract error information from parsed response
 * Detects BardErrorInfo and returns error code if present
 * Also handles simple error codes like [4], [2], etc.
 */
export function extractError(parsedData: unknown[]): { code: number; message: string } | null {
  try {
    for (const part of parsedData) {
      if (!Array.isArray(part)) continue;

      // Look for error structure: ["wrb.fr", null, null, null, null, [errorCode, ...]]
      if (part[0] === "wrb.fr" && Array.isArray(part[5])) {
        const errorSection = part[5];

        // Simple error code format: ["wrb.fr", null, null, null, null, [4]]
        if (typeof errorSection[0] === "number" && errorSection[0] !== 0 && errorSection.length === 1) {
          const errorCode = errorSection[0];
          return {
            code: errorCode,
            message: `Gemini API Error ${errorCode}: ${getErrorMessage(errorCode)}`,
          };
        }

        // Full error structure: ["wrb.fr", null, null, null, null, [3, null, [["BardErrorInfo", [errorCode]]]]]
        if (errorSection[0] === 3 && Array.isArray(errorSection[2])) {
          for (const errorDetail of errorSection[2]) {
            if (Array.isArray(errorDetail) && errorDetail[0]?.includes("BardErrorInfo") && Array.isArray(errorDetail[1])) {
              const errorCode = errorDetail[1][0];
              return {
                code: errorCode,
                message: `Gemini API Error ${errorCode}: ${getErrorMessage(errorCode)}`,
              };
            }
          }
        }
      }
    }
  } catch (error) {
    logger.error("Error extracting error info:", error);
  }
  return null;
}

/**
 * Get human-readable error message for Gemini error codes
 */
function getErrorMessage(code: number): string {
  const errorMessages: Record<number, string> = {
    2: "Invalid request or conversation context. This usually means: the conversation ID is invalid, expired, or the request format is incorrect. Try starting a new conversation.",
    4: "Authentication or authorization failed. Your session may have expired or the token is invalid. Try refreshing cookies or logging in again.",
    1001: "Invalid request format",
    1002: "Authentication failed",
    1003: "Rate limit exceeded",
    1052: "Account access issue or model not available. This could be due to: rate limiting, region restrictions, or the selected model not being available for your account.",
  };
  return errorMessages[code] || "Unknown error";
}

/**
 * Extract messages from parsed streaming JSON parts
 * Messages contain HTML strings from response data
 */
export function extractMessages(parsedData: unknown[]): string[] {
  const messages: string[] = [];

  try {
    logger.debug(`🔍 Extracting messages from ${parsedData.length} part(s)...`);
    logger.debug(`[DEBUG] Full parsedData structure: ${JSON.stringify(parsedData).substring(0, 500)}`);

    for (let partIndex = 0; partIndex < parsedData.length; partIndex++) {
      const part = parsedData[partIndex];
      logger.debug(`[DEBUG] Processing part[${partIndex}]`);

      if (!Array.isArray(part)) {
        logger.debug(`⚠️ Part is not an array (type: ${typeof part}), skipping`);
        continue;
      }

      logger.debug(`📋 Part has ${part.length} elements`);
      logger.debug(`[DEBUG] Part structure: ${JSON.stringify(part).substring(0, 200)}`);

      // Look for nested data
      const maybeJson = part[2];
      if (!maybeJson || typeof maybeJson !== "string") {
        logger.debug(`⚠️ Part[2] is not a string (${typeof maybeJson}), skipping`);
        if (maybeJson) {
          logger.debug(`[DEBUG] Part[2] value: ${JSON.stringify(maybeJson).substring(0, 100)}`);
        }
        continue;
      }

      logger.debug(`📝 Found JSON string at part[2]: ${maybeJson.length} chars`);

      let mainData: unknown;
      try {
        mainData = JSON.parse(maybeJson);
        logger.debug(`✅ Parsed JSON: ${Array.isArray(mainData) ? `array[${(mainData as unknown[]).length}]` : typeof mainData}`);
      } catch (err) {
        logger.debug(`❌ Failed to parse JSON: ${err}`);
        continue;
      }

      // Extract candidates from mainData[4] - this is where Gemini puts the actual message content
      if (mainData && Array.isArray(mainData) && mainData[4] && Array.isArray(mainData[4])) {
        logger.debug(`🎯 Found mainData[4] with ${(mainData[4] as unknown[]).length} candidate(s)`);

        for (const candidate of mainData[4]) {
          try {
            // candidate[1][0] is the actual message content from Gemini
            const text = candidate?.[1]?.[0];
            if (text && typeof text === "string") {
              // This is the actual message - it might be a JSON string or HTML
              // Check if it looks like it contains structured data (like topic JSON)
              const trimmed = text.trim();
              if (trimmed.startsWith("[") && trimmed.includes("title")) {
                // This looks like a JSON array with objects containing "title" field
                // Try to parse it as JSON directly
                try {
                  const parsed = JSON.parse(text);
                  logger.debug(`✅ [TOPICS-JSON] Detected and extracted topics JSON array`);
                  const msgText = JSON.stringify(parsed, null, 2);
                  messages.push(msgText);
                } catch (parseErr) {
                  // Not valid JSON, treat as regular text
                  logger.debug(`✅ Extracted message: ${text.substring(0, 100)}...`);
                  messages.push(text);
                }
              } else {
                logger.debug(`✅ Extracted message: ${text.substring(0, 100)}...`);
                messages.push(text);
              }
            } else {
              logger.debug(`⚠️ Candidate[1][0] is not a string: ${typeof text}`);
            }
          } catch (err) {
            logger.debug(`❌ Error processing candidate: ${err}`);
            // Skip invalid candidates
          }
        }
      } else {
        logger.debug(
          `⚠️ mainData[4] not found or not valid: ${
            mainData && Array.isArray(mainData) ? `mainData is array[${mainData.length}]` : `mainData type: ${typeof mainData}`
          }`
        );
      }
    }
  } catch (error) {
    logger.error("Error extracting messages:", error);
  }

  logger.debug(`🏁 Extraction complete: ${messages.length} message(s) found`);
  return messages;
}

/**
 * Extract conversation metadata from parsed response
 * Metadata includes: [cid, rid, rcid] needed for conversation continuity
 */
export function extractMetadata(parsedData: unknown[]): ConversationMetadata | null {
  try {
    for (const part of parsedData) {
      if (!Array.isArray(part)) continue;

      // Look for nested data
      const maybeJson = part[2];
      if (!maybeJson || typeof maybeJson !== "string") continue;

      let mainData: unknown;
      try {
        mainData = JSON.parse(maybeJson);
      } catch {
        continue;
      }

      // Extract metadata from mainData[1]
      // Format: [cid, rid, rcid, ...]
      if (mainData && Array.isArray(mainData) && mainData[1] && Array.isArray(mainData[1])) {
        const metadata = mainData[1];

        // Get first candidate's rcid from mainData[4][0][0]
        let rcid: string | null = null;
        if (mainData[4] && Array.isArray(mainData[4]) && mainData[4][0] && Array.isArray(mainData[4][0])) {
          rcid = mainData[4][0][0] || null;
        }

        return {
          cid: metadata[0] || null,
          rid: metadata[1] || null,
          rcid: rcid,
        };
      }
    }
  } catch (error) {
    logger.error("Error extracting metadata:", error);
  }

  return null;
}

/**
 * Send chat request to Gemini API
 * Internal helper function for sending chat requests with proper token handling
 * Uses the consolidated HttpService
 */
export async function sendChatRequest(
  cookieManager: CookieManagerDB,
  prompt: string,
  options: ChatOptions = {}
): Promise<ChatResponse> {
  const { conversationContext = null, dryRun = false, model = "unspecified", forceRefreshToken = false } = options;

  // Add random delay to look more human (1-3 seconds)
  if (!dryRun) {
    const delay = Math.random() * 2000 + 1000;
    logger.debug(`Adding human-like delay: ${delay.toFixed(0)}ms`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  logger.info("💬 Sending chat request...");
  logger.debug(`Prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? "..." : ""}"`);
  logger.debug(`Model: ${model}`);

  // Resolve model to get ID and headers BEFORE building payload
  const { modelId, headers: modelHeaders } = resolveChatModel(model);
  logger.debug(`Using model: ${modelId}`);

  // Build payload - IMPORTANT: Pass null for model parameter
  // The model ID goes ONLY in HTTP headers, not in the f.req payload
  const fReq = buildChatPayload(prompt, conversationContext, null);

  // DEBUG: Log the actual payload to verify format
  logger.debug(`Built payload: ${fReq}`);
  logger.debug(`Payload length: ${fReq.length} chars`);

  if (conversationContext) {
    logger.debug(`Conversation: ${conversationContext.chatId}`);
  } else {
    logger.debug("New conversation");
  }

  // Dry run mode
  if (dryRun) {
    logger.info("🔍 DRY RUN - Request prepared but not sent");
    return {
      success: true,
      messages: [],
      fullText: "",
      timestamp: Date.now(),
      dryRun: true,
    };
  }

  try {
    // Create HTTP service (uses consolidated implementation)
    // Model headers are used here

    // Create HTTP service (uses consolidated implementation)
    const httpService = createHttpService(cookieManager);

    try {
      // Send request with automatic token handling and model headers
      // Respect the explicit forceRefreshToken flag from caller
      // DO NOT automatically force refresh for new conversations - let HTTP service handle caching
      // Forcing refresh can trigger fallback token extraction which may not work with Pro models
      const response = await httpService.sendGeminiRequest(fReq, {
        retries: 3,
        headers: modelHeaders,
        forceRefreshToken: forceRefreshToken,
      });

      if (response.statusCode !== 200) {
        throw new Error(`Request failed: ${response.statusCode} ${response.statusMessage}`);
      }

      const messages: ChatMessage[] = [];
      const htmlMessages: string[] = [];
      let metadata: ConversationMetadata | null = null;

      // Handle response (always string from new service)
      const bodyText = response.body;
      logger.debug(`Response body length: ${bodyText.length} chars`);

      // DEBUG: Log the actual response body to diagnose empty messages
      logger.debug(`Response body: ${bodyText}`);

      // Check if it starts with Google prefix
      if (bodyText.startsWith(")]}'\n") || bodyText.startsWith(")]}'")) {
        logger.debug(`✅ Google security prefix detected`);
      } else {
        logger.debug(`⚠️ No Google security prefix found`);
      }

      // Parse JSON arrays from response
      let chunkIndex = 0;
      const readable = (async function* () {
        yield Buffer.from(bodyText);
      })();

      for await (const parsed of HttpService.parseStreamingJson(readable as unknown as NodeJS.ReadableStream)) {
        // DEBUG: Log what we're parsing
        logger.debug(`Parsed chunk: ${JSON.stringify(parsed).substring(0, 200)}`);

        // Check for errors first
        const error = extractError(parsed);
        if (error) {
          logger.error(`❌ ${error.message}`);
          throw new Error(error.message);
        }

        // Extract metadata if not already set
        if (!metadata) {
          metadata = extractMetadata(parsed);
          if (metadata) {
            logger.debug(`Extracted metadata: ${JSON.stringify(metadata)}`);
          }
        }

        const extracted = extractMessages(parsed);
        logger.debug(`Extracted ${extracted.length} message(s) from chunk`);

        if (extracted.length > 0) {
          htmlMessages.push(...extracted);

          for (const html of extracted) {
            const text = htmlToText(html);
            messages.push({
              text,
              html,
              index: messages.length,
            });

            logger.info(`--- Chunk ${++chunkIndex} ---`);
            logger.info(text);
            logger.info(`--- End chunk ${chunkIndex} ---\n`);
          }
        }
      }

      const fullText = messages.map((m) => m.text).join("\n\n");

      logger.info(`✅ Received ${messages.length} message(s)`);

      return {
        success: true,
        messages,
        fullText,
        timestamp: Date.now(),
        metadata: metadata || undefined,
      };
    } finally {
      // Clean up HTTP service
      await httpService.close();
    }
  } catch (error) {
    logger.error("Chat request failed:", error);
    throw error;
  }
}

/**
 * Send chat request with streaming response
 * Calls onChunk callback for each parsed JSON chunk as it arrives
 * Returns metadata from first response chunk
 */
export async function sendChatRequestStreaming(
  cookieManager: CookieManagerDB,
  prompt: string,
  onChunk: (chunk: { text: string; html: string; index: number }) => void,
  options: ChatOptions = {}
): Promise<{ metadata: ConversationMetadata | null; totalChunks: number }> {
  const { conversationContext = null, dryRun = false, model = "unspecified", forceRefreshToken = false } = options;

  // Add random delay to look more human (1-3 seconds)
  if (!dryRun) {
    const delay = Math.random() * 2000 + 1000;
    logger.debug(`Adding human-like delay: ${delay.toFixed(0)}ms`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  logger.info("💬 Sending chat request (streaming)...");
  logger.debug(`Prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? "..." : ""}"`);
  logger.debug(`Model: ${model}`);

  // Resolve model to get ID and headers BEFORE building payload
  const { modelId, headers: modelHeaders } = resolveChatModel(model);
  logger.debug(`Using model: ${modelId}`);

  // Build payload - IMPORTANT: Pass null for model parameter
  // The model ID goes ONLY in HTTP headers, not in the f.req payload
  const fReq = buildChatPayload(prompt, conversationContext, null);

  // DEBUG: Log the actual payload to verify format
  logger.debug(`Built payload: ${fReq}`);
  logger.debug(`Payload length: ${fReq.length} chars`);

  if (conversationContext) {
    logger.debug(`Conversation: ${conversationContext.chatId}`);
  } else {
    logger.debug("New conversation");
  }

  // Dry run mode
  if (dryRun) {
    logger.info("🔍 DRY RUN - Request prepared but not sent");
    return { metadata: null, totalChunks: 0 };
  }

  try {
    // Create HTTP service
    // Model headers are used here

    // Create HTTP service
    const httpService = createHttpService(cookieManager);

    try {
      // Get token - FORCE REFRESH for new conversations to avoid stale token errors (1052)
      // Also respect the explicit forceRefreshToken flag from caller
      const isNewConversation = !conversationContext;
      const shouldRefreshToken = forceRefreshToken || isNewConversation;
      const token = await httpService.getToken(shouldRefreshToken);

      // Send streaming request with model headers
      let metadata: ConversationMetadata | null = null;
      let totalChunks = 0;
      let chunkIndex = 0;

      for await (const streamChunk of httpService.postStream(token, fReq, {
        retries: 3,
        headers: modelHeaders,
      })) {
        totalChunks++;

        // DEBUG: Log the actual chunk structure
        logger.debug(`📦 Chunk ${totalChunks} structure: ${JSON.stringify(streamChunk.chunk).substring(0, 500)}...`);

        // Check for errors first (e.g. wrb.fr error blocks like 1052)
        const error = extractError(streamChunk.chunk);
        if (error) {
          logger.error(`❌ ${error.message}`);
          throw new Error(error.message);
        }

        // Extract metadata from first chunk
        if (!metadata) {
          metadata = extractMetadata(streamChunk.chunk);
        }

        // Extract messages from chunk
        const extracted = extractMessages(streamChunk.chunk);
        logger.debug(`🔍 Extracted ${extracted.length} HTML message(s) from chunk ${totalChunks}`);

        for (const html of extracted) {
          const text = htmlToText(html);

          logger.info(`--- Chunk ${++chunkIndex} ---`);
          logger.info(text);
          logger.info(`--- End chunk ${chunkIndex} ---\n`);

          // Call callback with chunk data
          onChunk({
            text,
            html,
            index: chunkIndex - 1,
          });
        }
      }

      logger.info(`✅ Stream complete (${totalChunks} chunks, ${chunkIndex} messages)`);

      return { metadata, totalChunks };
    } finally {
      // Clean up HTTP service
      await httpService.close();
    }
  } catch (error) {
    logger.error("Chat request streaming failed:", error);
    throw error;
  }
}
