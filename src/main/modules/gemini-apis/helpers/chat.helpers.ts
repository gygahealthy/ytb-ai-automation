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
import type { CookieManagerDB } from "../services/cookie-manager-db.js";
import { createHttpService, HttpService } from "../services/http.service.js";

/**
 * Build f.req payload for chat request
 * Format: [null, JSON.stringify([[prompt], null, conversationContext, ...gemParams])]
 */
export function buildChatPayload(
  prompt: string,
  conversationContext: ConversationContext | null = null
): string {
  let inner: unknown[];

  if (conversationContext) {
    const { chatId, replyId, rcId } = conversationContext;
    inner = [[prompt], null, [chatId, replyId, rcId]];
  } else {
    // New conversation
    inner = [[prompt], null, null];
  }

  const innerJson = JSON.stringify(inner);
  const fReq = JSON.stringify([null, innerJson]);

  return fReq;
}

/**
 * Create conversation context for multi-turn chat
 */
export function createConversationContext(
  chatId: string,
  replyId: string,
  rcId: string
): ConversationContext {
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
export function extractConversationContext(
  metadata: ConversationMetadata
): ConversationContext | null {
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
  let text = html
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
 * Extract messages from parsed streaming JSON parts
 * Messages contain HTML strings from response data
 */
export function extractMessages(parsedData: unknown[]): string[] {
  const messages: string[] = [];

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

      // Extract candidates from mainData[4]
      if (mainData && Array.isArray(mainData) && mainData[4]) {
        for (const candidate of mainData[4]) {
          try {
            const text = candidate?.[1]?.[0];
            if (text && typeof text === "string") {
              messages.push(text);
            }
          } catch {
            // Skip invalid candidates
          }
        }
      }
    }
  } catch (error) {
    logger.error("Error extracting messages:", error);
  }

  return messages;
}

/**
 * Extract conversation metadata from parsed response
 * Metadata includes: [cid, rid, rcid] needed for conversation continuity
 */
export function extractMetadata(
  parsedData: unknown[]
): ConversationMetadata | null {
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
      if (
        mainData &&
        Array.isArray(mainData) &&
        mainData[1] &&
        Array.isArray(mainData[1])
      ) {
        const metadata = mainData[1];

        // Get first candidate's rcid from mainData[4][0][0]
        let rcid: string | null = null;
        if (
          mainData[4] &&
          Array.isArray(mainData[4]) &&
          mainData[4][0] &&
          Array.isArray(mainData[4][0])
        ) {
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
  const { conversationContext = null, dryRun = false } = options;

  // Add random delay to look more human (1-3 seconds)
  if (!dryRun) {
    const delay = Math.random() * 2000 + 1000;
    logger.debug(`Adding human-like delay: ${delay.toFixed(0)}ms`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  logger.info("💬 Sending chat request...");
  logger.debug(
    `Prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? "..." : ""}"`
  );

  // Build payload
  const fReq = buildChatPayload(prompt, conversationContext);

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
    const httpService = createHttpService(cookieManager);

    try {
      // Send request with automatic token handling
      const response = await httpService.sendGeminiRequest(fReq, {
        retries: 3,
      });

      if (response.statusCode !== 200) {
        throw new Error(
          `Request failed: ${response.statusCode} ${response.statusMessage}`
        );
      }

      const messages: ChatMessage[] = [];
      const htmlMessages: string[] = [];
      let metadata: ConversationMetadata | null = null;

      // Handle response (always string from new service)
      const bodyText = response.body;
      logger.debug(`Response body length: ${bodyText.length} chars`);

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

      for await (const parsed of HttpService.parseStreamingJson(
        readable as unknown as NodeJS.ReadableStream
      )) {
        // Extract metadata if not already set
        if (!metadata) {
          metadata = extractMetadata(parsed);
        }

        const extracted = extractMessages(parsed);

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
  const { conversationContext = null, dryRun = false } = options;

  // Add random delay to look more human (1-3 seconds)
  if (!dryRun) {
    const delay = Math.random() * 2000 + 1000;
    logger.debug(`Adding human-like delay: ${delay.toFixed(0)}ms`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  logger.info("💬 Sending chat request (streaming)...");
  logger.debug(
    `Prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? "..." : ""}"`
  );

  // Build payload
  const fReq = buildChatPayload(prompt, conversationContext);

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
    const httpService = createHttpService(cookieManager);

    try {
      // Get token
      const token = await httpService.getToken();

      // Send streaming request
      let metadata: ConversationMetadata | null = null;
      let totalChunks = 0;
      let chunkIndex = 0;

      for await (const streamChunk of httpService.postStream(token, fReq, {
        retries: 3,
      })) {
        totalChunks++;

        // Extract metadata from first chunk
        if (!metadata) {
          metadata = extractMetadata(streamChunk.chunk);
        }

        // Extract messages from chunk
        const extracted = extractMessages(streamChunk.chunk);

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

      logger.info(
        `✅ Stream complete (${totalChunks} chunks, ${chunkIndex} messages)`
      );

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
