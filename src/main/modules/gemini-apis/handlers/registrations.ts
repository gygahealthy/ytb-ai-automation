import { IpcRegistration } from "../../../../core/ipc/types";
import { profileRepository } from "../../../../main/storage/repositories";
import { ChatService } from "../services/chat.service";
import { CookieManagerDB } from "../services/cookie-manager-db";
import { cookieService } from "../services/cookie.service";

// Global cookie manager instance (initialized on demand)
let cookieManager: CookieManagerDB | null = null;

export const cookieRegistrations: IpcRegistration[] = [
  {
    channel: "gemini:cookies:list",
    description: "Get all cookies for a profile",
    handler: async (req: { profileId: string }) => {
      const { profileId } = req as any;
      return await cookieService.getCookiesByProfile(profileId);
    },
  },
  {
    channel: "gemini:cookies:get",
    description: "Get a specific cookie by profile and url",
    handler: async (req: { profileId: string; url: string }) => {
      const { profileId, url } = req as any;
      return await cookieService.getCookie(profileId, url);
    },
  },
  {
    channel: "gemini:cookies:create",
    description: "Create a new cookie",
    handler: async (req: any) => {
      const { profileId, url, service, data } = req as any;
      return await cookieService.createCookie(profileId, url, service, data);
    },
  },
  {
    channel: "gemini:cookies:updateRotationInterval",
    description: "Update cookie rotation interval",
    handler: async (req: { id: string; rotationIntervalMinutes: number }) => {
      const { id, rotationIntervalMinutes } = req as any;
      return await cookieService.updateRotationInterval(
        id,
        rotationIntervalMinutes
      );
    },
  },
  {
    channel: "gemini:cookies:updateStatus",
    description: "Update cookie status",
    handler: async (req: {
      id: string;
      status: "active" | "expired" | "renewal_failed";
    }) => {
      const { id, status } = req as any;
      return await cookieService.updateStatus(id, status);
    },
  },
  {
    channel: "gemini:cookies:delete",
    description: "Delete a cookie",
    handler: async (req: { id: string }) => {
      const { id } = req as any;
      return await cookieService.deleteCookie(id);
    },
  },
  {
    channel: "gemini:cookies:deleteByProfile",
    description: "Delete all cookies for a profile",
    handler: async (req: { profileId: string }) => {
      const { profileId } = req as any;
      return await cookieService.deleteProfileCookies(profileId);
    },
  },
  {
    channel: "gemini:cookies:getDueForRotation",
    description: "Get cookies due for rotation",
    handler: async () => {
      return await cookieService.getCookiesDueForRotation();
    },
  },
  {
    channel: "gemini:cookies:getByStatus",
    description: "Get cookies by status",
    handler: async (req: {
      status: "active" | "expired" | "renewal_failed";
    }) => {
      const { status } = req as any;
      return await cookieService.getCookiesByStatus(status);
    },
  },
  {
    channel: "gemini:cookies:extractAndStore",
    description: "Extract cookies from page and store in database",
    handler: async (req: {
      profileId: string;
      url: string;
      service: string;
      pageUrl: string;
      cookies: Array<{
        name: string;
        value: string;
        domain: string;
        expires?: number;
      }>;
    }) => {
      const { profileId, url, service, pageUrl, cookies } = req as any;
      return await cookieService.extractAndStoreCookiesFromPage(
        profileId,
        url,
        service,
        pageUrl,
        cookies
      );
    },
  },
];

export const chatRegistrations: IpcRegistration[] = [
  {
    channel: "gemini:chat:send",
    description: "Send a message to Gemini chat API",
    handler: async (req: any) => {
      return await sendChatMessage(req);
    },
  },
];

/**
 * Send chat message handler
 */
async function sendChatMessage(req: {
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
    if (!cookiesResult.success || !cookiesResult.data?.length) {
      return {
        success: false,
        error: `No cookies found for profile ${profileId}`,
      };
    }

    // Ensure cookie manager is initialized
    if (!cookieManager) {
      // Create a minimal cookie manager instance
      // In production, this should be properly initialized with full options
      const cookies = cookiesResult.data[0];
      const cookieObj: any = {};
      if (cookies.rawCookieString) {
        for (const part of cookies.rawCookieString.split(";")) {
          const trimmed = part.trim();
          if (trimmed && trimmed.includes("=")) {
            const [name, value] = trimmed.split("=", 2);
            cookieObj[name.trim()] = value.trim();
          }
        }
      }
      // TODO: Properly initialize CookieManagerDB with repository and options
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

    // Send the message
    const response = await chatService.sendMessage(prompt);

    return {
      success: response.success,
      data: response.fullText,
      metadata: response.metadata,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Chat error: ${message}`,
    };
  }
}
