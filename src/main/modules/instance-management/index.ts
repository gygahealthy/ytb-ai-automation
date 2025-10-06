import { registerAutomationHandlers as registerHandlers } from "./handlers/ipc.handlers";

export function registerModule(): void {
  registerHandlers();
}
