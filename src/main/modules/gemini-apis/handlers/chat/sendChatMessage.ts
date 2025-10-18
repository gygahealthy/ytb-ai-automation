import { sendChatMessageNonStreaming } from "./sendChatMessageNonStreaming.js";
import { sendChatMessageStreaming } from "./sendChatMessageStreaming.js";
import { logger } from "../../../../utils/logger-backend";

/**
 * Main chat message handler
 * Routes to streaming or non-streaming implementation based on request
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
}): Promise<any> {
  try {
    const { stream = false, requestId } = req;

    logger.info(
      `[chat] Routing request to ${
        stream ? "streaming" : "non-streaming"
      } handler`
    );

    // Route based on stream flag
    if (stream) {
      // Streaming mode requires requestId
      if (!requestId) {
        return {
          success: false,
          error: "requestId is required for streaming mode",
          streaming: true,
        };
      }
      return await sendChatMessageStreaming(
        req as Parameters<typeof sendChatMessageStreaming>[0]
      );
    } else {
      // Non-streaming mode
      return await sendChatMessageNonStreaming(
        req as Parameters<typeof sendChatMessageNonStreaming>[0]
      );
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
