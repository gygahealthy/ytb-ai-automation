import { ipcMain } from "electron";
import { registrations } from "./handlers/registrations";
import { IpcRegistration } from "../../../core/ipc/types";
import manifest from "./manifest.json";

// Export manifest and registrations for the module-loader to consume.
export { manifest, registrations };

export function registerModule(registrar?: (regs: IpcRegistration[]) => void): void {
  if (registrar) {
    registrar(registrations);
    return;
  }

  // Register handlers directly when called without a registrar (fallback)
  for (const reg of registrations) {
    ipcMain.handle(reg.channel, async (_event, ...args) => {
      const req = args.length <= 1 ? args[0] : args;
      return await reg.handler(req as any);
    });
  }

  console.log("✅ Cookie Rotation module registered (src/main/modules/cookie-rotation/index.ts)");
}

export default {
  manifest,
  registrations,
  registerModule,
};
