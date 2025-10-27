import { IpcRegistration } from "@/core/ipc/types";
import { registrations } from "./handlers/registrations";

export function registerModule(registrar?: (regs: IpcRegistration[]) => void): void {
  if (registrar) {
    registrar(registrations);
    return;
  }

  console.log("✅ Dialog module loaded (src/main/modules/dialog/index.ts)");
}
