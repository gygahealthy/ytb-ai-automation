import { profileRepository } from "../../../../storage/repositories";
import { logger } from "../../../../utils/logger-backend";
import { CookieManagerDB } from "../../services/cookie-manager-db";
import { cookieService } from "../../services/cookie.service";
import { COOKIE_SERVICES } from "../../shared/constants/services";
import { sendChatRequestStreaming } from "../../helpers/chat.helpers.js";
import { BrowserWindow } from "electron";
import { database } from "../../../../storage/database";
import { CookieRepository } from "../../repository/cookie.repository";

// Local cookie manager instance for this module
let cookieManager: CookieManagerDB | null = null;

/**
 * Streaming version of chat message handler
 * Returns immediately with a channel; sends chunks via IPC as they arrive
 */
export async function sendChatMessageStreaming(req: {
  profileId: string;
  prompt: string;
  conversationContext?: {
    chatId: string;
    replyId: string;
    rcId: string;
  };
  requestId: string; // Required for streaming (unique ID per request)
  model?: string; // Model selection
  forceRefreshToken?: boolean; // Force token refresh
}): Promise<any> {
  try {
    const { profileId, prompt, conversationContext, requestId, model, forceRefreshToken = false } = req;

    // Validate required fields
    if (!profileId || !prompt || !requestId) {
      return {
        success: false,
        error: "Missing required fields: profileId, prompt, requestId",
        streaming: true,
      };
    }

    // Verify profile exists
    const profile = await profileRepository.findById(profileId);
    if (!profile) {
      return {
        success: false,
        error: `Profile not found: ${profileId}`,
        streaming: true,
      };
    }

    // Get cookies for the profile
    const cookiesResult = await cookieService.getCookiesByProfile(profileId);
    logger.info(`[chat:stream] Cookies from database for profile ${profileId}:`, {
      found: cookiesResult.success,
      count: cookiesResult.data?.length || 0,
      services: cookiesResult.data?.map((c) => c.service) || [],
    });

    if (!cookiesResult.success || !cookiesResult.data?.length) {
      return {
        success: false,
        error: `No cookies found for profile ${profileId}. Please log into Gemini (https://gemini.google.com) using this profile's browser, then the cookies will be automatically detected.`,
        streaming: true,
      };
    }

    // Find GEMINI service cookie specifically (not just the first cookie)
    const geminiCookie = cookiesResult.data.find((c) => c.service === COOKIE_SERVICES.GEMINI && c.status === "active");

    if (!geminiCookie || !geminiCookie.rawCookieString) {
      logger.warn(`[chat:stream] No active GEMINI cookie found for profile ${profileId}`, {
        availableServices: cookiesResult.data.map((c) => ({
          service: c.service,
          status: c.status,
        })),
      });
      return {
        success: false,
        error: `No active Gemini cookies found for profile ${profileId}. Please extract Gemini cookies first.`,
        streaming: true,
      };
    }

    // Initialize cookie manager with proper repository
    if (!cookieManager) {
      const cookies = geminiCookie;
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
      cookieManager = new CookieManagerDB(cookieObj, cookieRepository, profileId, "gemini.google.com", {
        autoValidate: false,
        validateOnInit: false,
        verbose: false,
      });

      // Initialize the cookie manager
      try {
        await cookieManager.init();
      } catch (initError) {
        logger.warn(`[chat:stream] Cookie manager initialization warning: ${initError}`, initError);
        // Continue even if init fails - the cookies might still be usable
      }
    }

    // Return immediately with streaming channel; start async streaming in background
    const streamChannel = `gemini:chat:stream:${requestId}`;

    logger.info(`[chat:stream] Starting streaming chat for request ${requestId}`);

    // Start streaming in background without awaiting
    setImmediate(async () => {
      try {
        // Get all windows to send messages to
        const windows = BrowserWindow.getAllWindows();
        const sendToAllWindows = (channel: string, data: any) => {
          windows.forEach((win) => {
            if (!win.isDestroyed()) {
              win.webContents.send(channel, data);
            }
          });
        };

        if (model) {
          logger.info(`[chat:stream] Model: ${model}`);
        }

        await sendChatRequestStreaming(
          cookieManager!,
          prompt,
          (chunk) => {
            // Send each chunk to renderer via IPC
            logger.debug(`[chat:stream] Sending chunk ${chunk.index} via ${streamChannel}`);
            sendToAllWindows(streamChannel, {
              type: "chunk",
              data: chunk,
            });
          },
          {
            conversationContext: conversationContext
              ? {
                  chatId: conversationContext.chatId,
                  replyId: conversationContext.replyId,
                  rcId: conversationContext.rcId,
                }
              : undefined,
            model,
            forceRefreshToken,
          }
        );

        // Signal completion
        sendToAllWindows(streamChannel, {
          type: "complete",
          data: null,
        });

        logger.info(`[chat:stream] Streaming chat complete for request ${requestId}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`[chat:stream] Streaming failed: ${message}`, error);

        // Signal error to all windows
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

    // Return immediately to let client know streaming started
    return {
      success: true,
      streaming: true,
      channel: streamChannel,
      message: "Streaming chat started, listening on channel: " + streamChannel,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("[chat:stream] Unexpected error:", message);
    return {
      success: false,
      error: `Chat stream error: ${message}`,
      streaming: true,
    };
  }
}
