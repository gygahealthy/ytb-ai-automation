import { profileRepository } from "../../../../storage/repositories";
import { logger } from "../../../../utils/logger-backend";
import { ChatService } from "../../services/chat.service";
import { CookieManagerDB } from "../../services/cookie-manager-db";
import { cookieService } from "../../services/cookie.service";
import { database } from "../../../../storage/database";
import { CookieRepository } from "../../repository/cookie.repository";

// Local cookie manager instance for this module
let cookieManager: CookieManagerDB | null = null;

/**
 * Non-streaming version of chat message handler
 * Returns full response after complete message is received
 */
export async function sendChatMessageNonStreaming(req: {
  profileId: string;
  prompt: string;
  conversationContext?: {
    chatId: string;
    replyId: string;
    rcId: string;
  };
}): Promise<any> {
  try {
    const { profileId, prompt, conversationContext } = req;

    // Validate required fields
    if (!profileId || !prompt) {
      return {
        success: false,
        error: "Missing required fields: profileId, prompt",
      };
    }

    // Verify profile exists
    const profile = await profileRepository.findById(profileId);
    if (!profile) {
      return {
        success: false,
        error: `Profile not found: ${profileId}`,
      };
    }

    // Get cookies for the profile
    const cookiesResult = await cookieService.getCookiesByProfile(profileId);
    logger.info(
      `[chat:non-streaming] Cookies from database for profile ${profileId}:`,
      {
        found: cookiesResult.success,
        count: cookiesResult.data?.length || 0,
      }
    );

    if (!cookiesResult.success || !cookiesResult.data?.length) {
      return {
        success: false,
        error: `No cookies found for profile ${profileId}. Please log into Gemini (https://gemini.google.com) using this profile's browser, then the cookies will be automatically detected.`,
      };
    }

    // Initialize cookie manager with proper repository
    if (!cookieManager) {
      const cookies = cookiesResult.data[0];
      const cookieObj: any = {};

      // Parse raw cookie string into object
      if (cookies.rawCookieString) {
        for (const part of cookies.rawCookieString.split(";")) {
          const trimmed = part.trim();
          if (trimmed && trimmed.includes("=")) {
            const [name, value] = trimmed.split("=", 2);
            cookieObj[name.trim()] = value.trim();
          }
        }
      }

      // Import database and create cookie repository
      const db = database.getSQLiteDatabase();
      const cookieRepository = new CookieRepository(db);

      // Create cookie manager with proper initialization
      cookieManager = new CookieManagerDB(
        cookieObj,
        cookieRepository,
        profileId,
        "gemini.google.com",
        {
          autoValidate: false,
          validateOnInit: false,
          verbose: false,
        }
      );

      // Initialize the cookie manager
      try {
        await cookieManager.init();
      } catch (initError) {
        logger.warn(
          `[chat:non-streaming] Cookie manager initialization warning: ${initError}`,
          initError
        );
        // Continue even if init fails - the cookies might still be usable
      }
    }

    // Create chat service
    const chatService = new ChatService(cookieManager!);

    // Load conversation context if provided
    if (conversationContext) {
      chatService.loadMetadata({
        cid: conversationContext.chatId,
        rid: conversationContext.replyId,
        rcid: conversationContext.rcId,
      });
    }

    // Send the message (waits for full response)
    logger.info(
      "[chat:non-streaming] Sending message and waiting for full response..."
    );
    const response = await chatService.sendMessage(prompt);

    logger.info("[chat:non-streaming] Response received, returning to client");

    return {
      success: response.success,
      data: response.fullText,
      metadata: response.metadata,
      streaming: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("[chat:non-streaming] Error:", message);
    return {
      success: false,
      error: `Chat error: ${message}`,
      streaming: false,
    };
  }
}
