/**
 * Chat Message Handler - Registry Mode (Persistent Context)
 *
 * This handler uses the ChatService registry to maintain conversation context
 * across multiple requests. Perfect for multi-turn conversations where you need
 * to preserve chatId, replyId, and rcId between API calls.
 *
 * Key differences from sendChatMessageNonStreaming:
 * - Uses per-profile singleton ChatService (preserves metadata)
 * - Conversation context automatically maintained per profile
 * - Each message builds on previous messages in the conversation
 * - Better for interactive chat sessions
 */

import { profileRepository } from "../../../../storage/repositories/index.js";
import { logger } from "../../../../utils/logger-backend.js";
import { cookieService } from "../../services/cookie.service.js";
import {
  getOrCreateCookieManager,
  getOrCreateChatService,
  resetChatService,
} from "../../services/chat.registry.js";

/**
 * Non-streaming chat with persistent conversation context
 * Uses singleton ChatService per profile to maintain metadata between requests
 */
export async function sendChatMessageWithRegistry(req: {
  profileId: string;
  prompt: string;
  conversationContext?: {
    chatId: string;
    replyId: string;
    rcId: string;
  };
  model?: string; // Model selection
  resetContext?: boolean; // Force start new conversation
}): Promise<any> {
  try {
    const {
      profileId,
      prompt,
      conversationContext,
      model,
      resetContext = false,
    } = req;

    // Validate required fields
    if (!profileId || !prompt) {
      return {
        success: false,
        error: "Missing required fields: profileId, prompt",
        mode: "persistent",
      };
    }

    logger.info(
      `[chat:registry:non-streaming] Processing request for profile ${profileId}`
    );

    // Verify profile exists
    const profile = await profileRepository.findById(profileId);
    if (!profile) {
      return {
        success: false,
        error: `Profile not found: ${profileId}`,
        mode: "persistent",
      };
    }

    // Get cookies for the profile
    const cookiesResult = await cookieService.getCookiesByProfile(profileId);
    logger.info(
      `[chat:registry:non-streaming] Cookies for profile ${profileId}:`,
      {
        found: cookiesResult.success,
        count: cookiesResult.data?.length || 0,
      }
    );

    if (!cookiesResult.success || !cookiesResult.data?.length) {
      return {
        success: false,
        error: `No cookies found for profile ${profileId}. Please log into Gemini first.`,
        mode: "persistent",
      };
    }

    const rawCookieString = cookiesResult.data[0].rawCookieString;

    // Get or create CookieManager from registry
    const cookieManager = await getOrCreateCookieManager(
      profileId,
      rawCookieString
    );

    // Get or create ChatService from registry (singleton per profile)
    let chatService = getOrCreateChatService(profileId, cookieManager);

    // Reset context if requested
    if (resetContext) {
      logger.info(
        `[chat:registry:non-streaming] Resetting conversation context for profile ${profileId}`
      );
      resetChatService(profileId);
      chatService = getOrCreateChatService(profileId, cookieManager);
    }

    // Load external conversation context if provided (overrides registry state)
    if (conversationContext) {
      logger.info(
        `[chat:registry:non-streaming] Loading external conversation context for profile ${profileId}`,
        {
          chatId: conversationContext.chatId,
          replyId: conversationContext.replyId,
        }
      );
      chatService.loadMetadata({
        cid: conversationContext.chatId,
        rid: conversationContext.replyId,
        rcid: conversationContext.rcId,
      });
    }

    // Get current metadata before sending (for logging)
    const metadataBefore = chatService.getMetadata();
    const isNewConversation =
      !metadataBefore.cid || metadataBefore.cid === null;

    logger.info(
      `[chat:registry:non-streaming] Sending message (${
        isNewConversation ? "new conversation" : "continuing conversation"
      })`
    );
    if (model) {
      logger.info(`[chat:registry:non-streaming] Model: ${model}`);
    }

    // Send the message (automatically uses stored metadata)
    const response = await chatService.sendMessage(prompt, {
      model,
    });

    // Get updated metadata after response
    const metadataAfter = chatService.getMetadata();

    logger.info(
      `[chat:registry:non-streaming] Response received and context preserved`,
      {
        conversationId: metadataAfter.cid,
        replyId: metadataAfter.rid,
      }
    );

    return {
      success: response.success,
      data: response.fullText,
      metadata: response.metadata,
      storedMetadata: metadataAfter, // Return the stored metadata for reference
      mode: "persistent",
      profileId,
      isNewConversation,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("[chat:registry:non-streaming] Error:", message);
    return {
      success: false,
      error: `Chat registry error: ${message}`,
      mode: "persistent",
    };
  }
}
