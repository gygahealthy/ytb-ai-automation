import { registerAutomationHandlers } from "./automation.handlers";
import { registerAutomationHandlers as registerAutomationMultiHandlers } from "./automation-multi.handlers";
import { registerChatAutomationHandlers } from "./chat-automation.handlers";
import { registerDialogHandlers } from "./dialog.handlers";
import { registerProfileHandlers } from "./profile.handlers";
import { registerVeo3Handlers } from "./veo3.handlers";
import { registerYoutubeHandlers } from "./youtube.handlers";

/**
 * Register all IPC handlers
 * This is the bridge between renderer process and services
 */
export function registerIPCHandlers(): void {
  registerProfileHandlers();
  registerAutomationHandlers();
  registerAutomationMultiHandlers();
  registerChatAutomationHandlers();
  registerVeo3Handlers();
  registerYoutubeHandlers();
  registerDialogHandlers();

  console.log("✅ All IPC handlers registered");
}
