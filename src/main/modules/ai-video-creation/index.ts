import { registerVeo3Handlers as registerHandlers } from "./handlers/ipc.handlers";

export function registerModule(): void {
  registerHandlers();
}
