import { IpcRegistration } from "../../../../core/ipc/types";
import { cookieService } from "../services/cookie.service";
import { sendChatMessage } from "./chat/sendChatMessage";
import { extractAndStoreHandler } from "./cookie/extractAndStore";
import { extractAndCreateHandler } from "./cookie/extractAndCreate";
import { extractFromBrowserHandler } from "./cookie/extractFromBrowser";

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
      return await extractAndStoreHandler(req as any);
    },
  },
  {
    channel: "gemini:cookies:extractAndCreate",
    description: "Extract cookies from URL for a profile",
    handler: async (req: {
      profileId: string;
      service: string;
      url: string;
    }) => {
      return await extractAndCreateHandler(req as any);
    },
  },
  {
    channel: "gemini:cookies:extractFromBrowser",
    description: "Extract cookies from browser user data directory",
    handler: async (req: { profileId: string }) => {
      return await extractFromBrowserHandler(req as any);
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
