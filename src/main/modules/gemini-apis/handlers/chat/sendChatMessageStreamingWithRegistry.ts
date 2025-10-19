/**
 * Chat Message Streaming Handler - Registry Mode (Persistent Context)
 *
 * Streaming version that uses ChatService registry to maintain conversation context.
 * Returns immediately with a channel; sends chunks via IPC as they arrive.
 * Preserves conversation metadata between streaming requests.
 */

import { profileRepository } from "../../../../storage/repositories/index.js";
import { logger } from "../../../../utils/logger-backend.js";
import { cookieService } from "../../services/cookie.service.js";
import { COOKIE_SERVICES } from "../../shared/constants/services.js";
import { sendChatRequestStreaming } from "../../helpers/chat.helpers.js";
import { BrowserWindow } from "electron";
import {
  getOrCreateCookieManager,
  getOrCreateChatService,
  resetChatService,
} from "../../services/chat.registry.js";

/**
 * Streaming chat with persistent conversation context
 * Uses singleton ChatService per profile to maintain metadata between requests
 */
export async function sendChatMessageStreamingWithRegistry(req: {
  profileId: string;
  prompt: string;
  conversationContext?: {
    chatId: string;
    replyId: string;
    rcId: string;
  };
  requestId: string; // Required for streaming
  model?: string; // Model selection
  resetContext?: boolean; // Force start new conversation
}): Promise<any> {
  try {
    const {
      profileId,
      prompt,
      conversationContext,
      requestId,
      model,
      resetContext = false,
    } = req;

    // Validate required fields
    if (!profileId || !prompt || !requestId) {
      return {
        success: false,
        error: "Missing required fields: profileId, prompt, requestId",
        streaming: true,
        mode: "persistent",
      };
    }

    logger.info(
      `[chat:registry:streaming] Processing streaming request ${requestId} for profile ${profileId}`
    );

    // Verify profile exists
    const profile = await profileRepository.findById(profileId);
    if (!profile) {
      return {
        success: false,
        error: `Profile not found: ${profileId}`,
        streaming: true,
        mode: "persistent",
      };
    }

    // Get cookies for the profile
    const cookiesResult = await cookieService.getCookiesByProfile(profileId);
    logger.info(`[chat:registry:streaming] Cookies for profile ${profileId}:`, {
      found: cookiesResult.success,
      count: cookiesResult.data?.length || 0,
      services: cookiesResult.data?.map((c) => c.service) || [],
    });

    if (!cookiesResult.success || !cookiesResult.data?.length) {
      return {
        success: false,
        error: `No cookies found for profile ${profileId}. Please log into Gemini first.`,
        streaming: true,
        mode: "persistent",
      };
    }

    // Find GEMINI service cookie specifically (not just the first cookie)
    const geminiCookie = cookiesResult.data.find(
      (c) => c.service === COOKIE_SERVICES.GEMINI && c.status === "active"
    );

    if (!geminiCookie || !geminiCookie.rawCookieString) {
      logger.warn(
        `[chat:registry:streaming] No active GEMINI cookie found for profile ${profileId}`,
        {
          availableServices: cookiesResult.data.map((c) => ({
            service: c.service,
            status: c.status,
          })),
        }
      );
      return {
        success: false,
        error: `No active Gemini cookies found for profile ${profileId}. Please extract Gemini cookies first.`,
        streaming: true,
        mode: "persistent",
      };
    }

    const rawCookieString = geminiCookie.rawCookieString;

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
        `[chat:registry:streaming] Resetting conversation context for profile ${profileId}`
      );
      resetChatService(profileId);
      chatService = getOrCreateChatService(profileId, cookieManager);
    }

    // Load external conversation context if provided (overrides registry state)
    if (conversationContext) {
      logger.info(
        `[chat:registry:streaming] Loading external conversation context for profile ${profileId}`,
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

    // Stream channel for this request
    const streamChannel = `gemini:chat:stream:${requestId}`;

    logger.info(
      `[chat:registry:streaming] Starting streaming chat for request ${requestId} (${
        isNewConversation ? "new conversation" : "continuing conversation"
      })`
    );

    // Start streaming in background without awaiting
    setImmediate(async () => {
      try {
        const windows = BrowserWindow.getAllWindows();
        const sendToAllWindows = (channel: string, data: any) => {
          windows.forEach((win) => {
            if (!win.isDestroyed()) {
              win.webContents.send(channel, data);
            }
          });
        };

        // Get conversation context from stored metadata
        const storedMetadata = chatService.getMetadata();
        const conversationContextForRequest = storedMetadata.cid
          ? {
              chatId: storedMetadata.cid,
              replyId: storedMetadata.rid || "",
              rcId: storedMetadata.rcid || "",
            }
          : undefined;

        if (model) {
          logger.info(`[chat:registry:streaming] Model: ${model}`);
        }

        // Send streaming request using stored metadata
        const { metadata: responseMetadata, totalChunks } =
          await sendChatRequestStreaming(
            cookieManager,
            prompt,
            (chunk) => {
              logger.debug(
                `[chat:registry:streaming] Sending chunk ${chunk.index} via ${streamChannel}`
              );
              sendToAllWindows(streamChannel, {
                type: "chunk",
                data: chunk,
              });
            },
            {
              conversationContext: conversationContextForRequest,
              model,
            }
          );

        // Update stored metadata from response
        if (responseMetadata) {
          chatService.loadMetadata(responseMetadata);
          logger.info(
            `[chat:registry:streaming] Updated stored metadata for profile ${profileId}`,
            {
              conversationId: responseMetadata.cid,
              replyId: responseMetadata.rid,
            }
          );
        }

        // Signal completion with updated metadata
        sendToAllWindows(streamChannel, {
          type: "complete",
          data: {
            metadata: chatService.getMetadata(),
            totalChunks,
          },
        });

        logger.info(
          `[chat:registry:streaming] Streaming complete for request ${requestId} (${totalChunks} chunks)`
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(
          `[chat:registry:streaming] Streaming failed for request ${requestId}: ${message}`,
          error
        );

        const windows = BrowserWindow.getAllWindows();
        windows.forEach((win) => {
          if (!win.isDestroyed()) {
            win.webContents.send(streamChannel, {
              type: "error",
              error: message,
            });
          }
        });
      }
    });

    return {
      success: true,
      streaming: true,
      mode: "persistent",
      channel: streamChannel,
      profileId,
      requestId,
      isNewConversation,
      message: `Streaming chat started (channel: ${streamChannel})`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("[chat:registry:streaming] Unexpected error:", message);
    return {
      success: false,
      error: `Chat stream registry error: ${message}`,
      streaming: true,
      mode: "persistent",
    };
  }
}
