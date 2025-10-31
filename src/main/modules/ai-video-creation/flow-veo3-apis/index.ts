import { ipcMain } from "electron";
import { IpcRegistration } from "../../../../core/ipc/types";
import { flowVeo3ApiRegistrations } from "./handlers/registrations";
import { videoDownloadEventListenerService } from "./services/video-download-event-listener.service";

export function registerModule(registrar?: (regs: IpcRegistration[]) => void): void {
  // Initialize the video download event listener
  console.log("[flow-veo3-apis] Initializing video download event listener...");
  videoDownloadEventListenerService.initialize();
  console.log("[flow-veo3-apis] Video download event listener initialization complete");

  if (registrar) {
    registrar(flowVeo3ApiRegistrations);
    return;
  }

  for (const reg of flowVeo3ApiRegistrations) {
    ipcMain.handle(reg.channel, async (_event, ...args) => {
      const req = args.length <= 1 ? args[0] : args;
      return await reg.handler(req as any);
    });
  }
}
