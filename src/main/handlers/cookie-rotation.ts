/**
 * IPC handlers for cookie rotation monitoring and control
 */

import { ipcMain } from "electron";
import { getGlobalRotationWorkerManager } from "../modules/gemini-apis/services/global-rotation-worker-manager.service";
import { logger } from "../utils/logger-backend";

export function registerCookieRotationHandlers(): void {
  /**
   * Get current rotation status
   */
  ipcMain.handle("cookie-rotation:get-status", async () => {
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
  });

  /**
   * Get list of profiles with active cookies
   */
  ipcMain.handle("cookie-rotation:get-profiles", async () => {
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
  });

  /**
   * Start worker for a specific profile/cookie
   */
  ipcMain.handle(
    "cookie-rotation:start-worker",
    async (_event, profileId: string, cookieId: string) => {
      try {
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
    }
  );

  /**
   * Restart worker for a specific profile/cookie
   */
  ipcMain.handle(
    "cookie-rotation:restart-worker",
    async (_event, profileId: string, cookieId: string) => {
      try {
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
    }
  );

  /**
   * Stop worker for a specific profile/cookie
   */
  ipcMain.handle(
    "cookie-rotation:stop-worker",
    async (_event, profileId: string, cookieId: string) => {
      try {
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
    }
  );

  /**
   * Stop all workers
   */
  ipcMain.handle("cookie-rotation:stop-all", async () => {
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
  });

  /**
   * Start all workers
   */
  ipcMain.handle("cookie-rotation:start-all", async () => {
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
  });

  logger.info("[cookie-rotation] IPC handlers registered");
}
