import { sendChatMessageNonStreaming } from "./sendChatMessageNonStreaming.js";
import { sendChatMessageStreaming } from "./sendChatMessageStreaming.js";
import { sendChatMessageWithRegistry } from "./sendChatMessageWithRegistry.js";
import { sendChatMessageStreamingWithRegistry } from "./sendChatMessageStreamingWithRegistry.js";
import { logger } from "../../../../utils/logger-backend";
import {
  GEMINI_CHAT_NORMAL_MODE_EPHEMERAL,
  GEMINI_CHAT_NORMAL_MODE_PERSISTENT,
  type GeminiChatMode,
} from "../../../../../shared/constants/gemini-chat.constants";

/**
 * Main chat message handler router
 *
 * Routes to different implementations based on mode:
 * - 'stateless' (default): Creates new ChatService per request, no context preservation
 * - 'persistent': Uses ChatService registry singleton per profile, preserves conversation context
 *
 * Supports both streaming and non-streaming modes for each option
 */
export async function sendChatMessage(req: {
  profileId: string;
  prompt: string;
  conversationContext?: {
    chatId: string;
    replyId: string;
    rcId: string;
  };
  stream?: boolean; // Flag to enable streaming (default: false)
  requestId?: string; // Required if stream=true
  // Context mode (default: ephemeral/stateless)
  // Accepts legacy values: 'stateless' | 'persistent' for backward compatibility
  mode?: GeminiChatMode | "stateless" | "persistent";
  model?: string; // Model selection (passed through to handlers)
  resetContext?: boolean; // Reset conversation context (only for 'persistent' mode)
}): Promise<any> {
  try {
    const {
      stream = false,
      requestId,
      mode = GEMINI_CHAT_NORMAL_MODE_EPHEMERAL,
      model,
      resetContext = false,
    } = req as any;

    // Normalize legacy string values to new constants
    let normalizedMode: GeminiChatMode;
    if (mode === "stateless")
      normalizedMode = GEMINI_CHAT_NORMAL_MODE_EPHEMERAL;
    else if (mode === "persistent")
      normalizedMode = GEMINI_CHAT_NORMAL_MODE_PERSISTENT;
    else normalizedMode = mode as GeminiChatMode;

    logger.info(
      `[chat] Routing request to ${normalizedMode} ${
        stream ? "streaming" : "non-streaming"
      } handler`
    );

    // Validate inputs
    if (stream && !requestId) {
      return {
        success: false,
        error: "requestId is required for streaming mode",
        streaming: true,
      };
    }

    // Route based on mode and stream flag
    if (normalizedMode === GEMINI_CHAT_NORMAL_MODE_PERSISTENT) {
      // Persistent mode: uses registry for singleton per-profile ChatService
      if (stream) {
        return await sendChatMessageStreamingWithRegistry({
          profileId: req.profileId,
          prompt: req.prompt,
          conversationContext: req.conversationContext,
          requestId: requestId!,
          model,
          resetContext,
        });
      } else {
        return await sendChatMessageWithRegistry({
          profileId: req.profileId,
          prompt: req.prompt,
          conversationContext: req.conversationContext,
          model,
          resetContext,
        });
      }
    } else {
      // Stateless mode (default): creates new ChatService per request
      if (stream) {
        return await sendChatMessageStreaming({
          profileId: req.profileId,
          prompt: req.prompt,
          conversationContext: req.conversationContext,
          requestId: requestId!,
          model,
        });
      } else {
        return await sendChatMessageNonStreaming({
          profileId: req.profileId,
          prompt: req.prompt,
          conversationContext: req.conversationContext,
          model,
        });
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("[chat] Unexpected error in router:", message);
    return {
      success: false,
      error: `Chat error: ${message}`,
    };
  }
}
