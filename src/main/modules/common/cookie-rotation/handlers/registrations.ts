import { cookieRotationConfigService } from "../services/cookie-rotation-config.service";
import { globalRotationWorkerManager, getGlobalRotationWorkerManager } from "../services/global-rotation-worker-manager.service";
import type { ApiResponse } from "../../../../../core/ipc/types";
import { workerLogHandlers } from "./worker-logs.js";

// Use permissive type during scaffolding to avoid tight coupling with IPC signatures.
export const registrations: any[] = [
  // Renderer expects a slightly different set of channel names — expose both
  // the legacy and the UI-oriented names here to be resilient.
  {
    channel: "cookie-rotation:get-profiles-config",
    handler: async (): Promise<ApiResponse<any>> => {
      try {
        // Ensure manager is initialized (this initializes cookieRotationConfigService)
        await getGlobalRotationWorkerManager();
        const data = await cookieRotationConfigService.getAll();
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    },
  },
  {
    channel: "cookie-rotation:get-profiles",
    handler: async (): Promise<ApiResponse<any>> => {
      try {
        const data = await globalRotationWorkerManager.listMonitors();
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    },
  },
  {
    channel: "cookie-rotation:get-status",
    handler: async (): Promise<ApiResponse<any>> => {
      try {
        const mgr = await getGlobalRotationWorkerManager();
        const data = await mgr.getStatus();
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    },
  },
  {
    channel: "cookie-rotation:get-config",
    handler: async (): Promise<ApiResponse<any>> => {
      try {
        // Ensure manager is initialized (this initializes cookieRotationConfigService)
        await getGlobalRotationWorkerManager();
        const data = await cookieRotationConfigService.getAll();
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    },
  },
  {
    channel: "cookie-rotation:update-cookie-config",
    handler: async (req: any): Promise<ApiResponse<any>> => {
      try {
        // Ensure manager is initialized (this initializes cookieRotationConfigService)
        await getGlobalRotationWorkerManager();
        const [id, patch] = req;
        const data = await cookieRotationConfigService.update(id, patch);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    },
  },
  {
    channel: "cookie-rotation:update-config",
    handler: async (req: any): Promise<ApiResponse<any>> => {
      try {
        // Ensure manager is initialized (this initializes cookieRotationConfigService)
        await getGlobalRotationWorkerManager();
        const [id, patch] = req;
        const data = await cookieRotationConfigService.update(id, patch);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    },
  },
  {
    channel: "cookie-rotation:get-cookie-config",
    handler: async (req: any): Promise<ApiResponse<any>> => {
      try {
        // Ensure manager is initialized (this initializes cookieRotationConfigService)
        await getGlobalRotationWorkerManager();
        const [id] = req;
        const data = await cookieRotationConfigService.getCookieConfig(id);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    },
  },
  {
    channel: "cookie-rotation:get-monitors",
    handler: async (): Promise<ApiResponse<any>> => {
      try {
        const data = await globalRotationWorkerManager.listMonitors();
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    },
  },
  {
    channel: "cookie-rotation:force-rotate",
    handler: async (req: any): Promise<ApiResponse<any>> => {
      try {
        const [targetId] = req;
        const data = await globalRotationWorkerManager.forceRotate(targetId);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    },
  },
  {
    channel: "cookie-rotation:start-worker",
    handler: async (req: any): Promise<ApiResponse<any>> => {
      try {
        const [profileId, cookieId] = req;
        const mgr = await getGlobalRotationWorkerManager();
        const data = await mgr.startWorkerByIds(profileId, cookieId);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    },
  },
  {
    channel: "cookie-rotation:restart-worker",
    handler: async (req: any): Promise<ApiResponse<any>> => {
      try {
        const [profileId, cookieId] = req;
        const mgr = await getGlobalRotationWorkerManager();
        const data = await mgr.restartWorker(profileId, cookieId);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    },
  },
  {
    channel: "cookie-rotation:stop-worker",
    handler: async (req: any): Promise<ApiResponse<any>> => {
      try {
        const [profileId, cookieId] = req;
        const mgr = await getGlobalRotationWorkerManager();
        const data = await mgr.stopWorkerForCookie(profileId, cookieId);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    },
  },
  {
    channel: "cookie-rotation:stop-all",
    handler: async (): Promise<ApiResponse<any>> => {
      try {
        const data = await globalRotationWorkerManager.stopAll();
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    },
  },
  {
    channel: "cookie-rotation:start-all",
    handler: async (): Promise<ApiResponse<any>> => {
      try {
        const data = await globalRotationWorkerManager.startAll();
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message || String(error) };
      }
    },
  },
  ...workerLogHandlers,
];

// Intentionally do NOT default-export `registrations`.
// The module-loader inspects both named exports and default exports; if a
// file exports the same array as both the named `registrations` and the
// default export, the loader will collect it twice which leads to duplicate
// IPC registration warnings. Keep only the named export.
