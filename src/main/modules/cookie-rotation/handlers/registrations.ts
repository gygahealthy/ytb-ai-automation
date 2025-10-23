import { IpcRegistration } from "../../../../core/ipc/types";
import { cookieRotationConfigService } from "../services/cookie-rotation-config.service";
import { globalRotationWorkerManager } from "../services/global-rotation-worker-manager.service";

// Public IPC handlers for cookie-rotation module
export const registrations: IpcRegistration[] = [
  {
    channel: "cookie-rotation:get-config",
    handler: async (event: any) => {
      return await cookieRotationConfigService.getAll();
    },
  },
  {
    channel: "cookie-rotation:update-config",
    handler: async (event: any, id: string, patch: Partial<any>) => {
      return await cookieRotationConfigService.update(id, patch);
    },
  },
  {
    channel: "cookie-rotation:list-monitors",
    handler: async (event: any) => {
      return await globalRotationWorkerManager.listMonitors();
    },
  },
  {
    channel: "cookie-rotation:force-rotate",
    handler: async (event: any, targetId: string) => {
      return await globalRotationWorkerManager.forceRotate(targetId);
    },
  },
  {
    channel: "cookie-rotation:start-worker",
    handler: async (event: any) => {
      return await globalRotationWorkerManager.startAll();
    },
  },
  {
    channel: "cookie-rotation:stop-worker",
    handler: async (event: any) => {
      return await globalRotationWorkerManager.stopAll();
    },
  },
];

export default registrations;
