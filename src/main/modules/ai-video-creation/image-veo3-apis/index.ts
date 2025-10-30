/**
 * Image VEO3 APIs Module
 * Handles image upload, fetch, sync, and local storage for Flow video generation
 */

import { ipcMain } from "electron";
import { IpcRegistration } from "../../../../core/ipc/types";
import { imageVeo3Registrations } from "./handlers/registrations";

export { imageVeo3Registrations } from "./handlers/registrations";
export { imageVeo3Service } from "./services/image-veo3.service";
export { veo3ImageRepository } from "./repository/image.repository";
export type { Veo3ImageGeneration, CreateImageGenerationInput } from "./types/image.types";

export function registerModule(registrar?: (regs: IpcRegistration[]) => void): void {
  if (registrar) {
    registrar(imageVeo3Registrations);
    return;
  }

  for (const reg of imageVeo3Registrations) {
    ipcMain.handle(reg.channel, async (_event, ...args) => {
      const req = args.length <= 1 ? args[0] : args;
      return await reg.handler(req as any);
    });
  }

  console.log("✅ Image VEO3 APIs module loaded");
}
