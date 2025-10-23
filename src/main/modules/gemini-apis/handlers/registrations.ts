import { IpcRegistration } from "../../../../core/ipc/types";
import { cookieService } from "../services/cookie.service";
import { sendChatMessage } from "./chat/sendChatMessage";
import { extractAndCreateHandler } from "./cookie/extractAndCreate";
import { getGlobalRotationWorkerManager } from "../services/global-rotation-worker-manager.service";
import { logger } from "../../../utils/logger-backend";

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
    description:
      "Extract cookies from page and store in database (DEPRECATED - use extractAndCreate)",
    handler: async (req: {
      profileId: string;
      service: string;
      url: string;
    }) => {
      // Redirect to unified extractAndCreate handler
      return await extractAndCreateHandler(req as any);
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
    description:
      "Extract cookies from browser user data directory (DEPRECATED - use extractAndCreate)",
    handler: async (req: {
      profileId: string;
      service: string;
      url: string;
    }) => {
      // Redirect to unified extractAndCreate handler
      return await extractAndCreateHandler(req as any);
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

export const cookieRotationRegistrations: IpcRegistration[] = [
  {
    channel: "cookie-rotation:get-status",
    description: "Get current rotation status",
    handler: async () => {
      try {
        const manager = await getGlobalRotationWorkerManager();
        const status = await manager.getStatus();
        return { success: true, data: status };
      } catch (error) {
        logger.error("[cookie-rotation] Failed to get status", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  },
  {
    channel: "cookie-rotation:get-profiles",
    description: "Get list of profiles with active cookies",
    handler: async () => {
      try {
        const manager = await getGlobalRotationWorkerManager();
        const profiles = await manager.getProfilesWithCookies();
        return { success: true, data: profiles };
      } catch (error) {
        logger.error("[cookie-rotation] Failed to get profiles", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  },
  {
    channel: "cookie-rotation:start-worker",
    description: "Start worker for a specific profile/cookie",
    handler: async (req: any) => {
      try {
        const profileId = Array.isArray(req) ? req[0] : req?.profileId;
        const cookieId = Array.isArray(req) ? req[1] : req?.cookieId;
        const manager = await getGlobalRotationWorkerManager();
        await manager.startWorkerByIds(profileId, cookieId);
        return { success: true };
      } catch (error) {
        logger.error("[cookie-rotation] Failed to start worker", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  },
  {
    channel: "cookie-rotation:restart-worker",
    description: "Restart worker for a specific profile/cookie",
    handler: async (req: any) => {
      try {
        const profileId = Array.isArray(req) ? req[0] : req?.profileId;
        const cookieId = Array.isArray(req) ? req[1] : req?.cookieId;
        const manager = await getGlobalRotationWorkerManager();
        await manager.restartWorker(profileId, cookieId);
        return { success: true };
      } catch (error) {
        logger.error("[cookie-rotation] Failed to restart worker", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  },
  {
    channel: "cookie-rotation:stop-worker",
    description: "Stop worker for a specific profile/cookie",
    handler: async (req: any) => {
      try {
        const profileId = Array.isArray(req) ? req[0] : req?.profileId;
        const cookieId = Array.isArray(req) ? req[1] : req?.cookieId;
        const manager = await getGlobalRotationWorkerManager();
        await manager.stopWorkerForCookie(profileId, cookieId);
        return { success: true };
      } catch (error) {
        logger.error("[cookie-rotation] Failed to stop worker", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  },
  {
    channel: "cookie-rotation:stop-all",
    description: "Stop all workers",
    handler: async () => {
      try {
        const manager = await getGlobalRotationWorkerManager();
        await manager.stop();
        return { success: true };
      } catch (error) {
        logger.error("[cookie-rotation] Failed to stop workers", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  },
  {
    channel: "cookie-rotation:start-all",
    description: "Start all workers",
    handler: async () => {
      try {
        const manager = await getGlobalRotationWorkerManager();
        await manager.start();
        return { success: true };
      } catch (error) {
        logger.error("[cookie-rotation] Failed to start workers", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  },
];
