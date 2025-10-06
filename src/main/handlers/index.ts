import { registerModule as registerProfileModule } from "../modules/profile-management";
import { registerModule as registerChatAutomationModule } from "../modules/chat-automation";
import { registerModule as registerVeo3Module } from "../modules/ai-video-creation";
import { registerModule as registerInstanceManagementModule } from "../modules/instance-management";
import { registerModule as registerAutomationModule } from "../modules/workflow-task-automation";
import { registerModule as registerYoutubeModule } from "../modules/youtube-analysis";
import { registerDialogHandlers as registerDialogModule } from "./dialog.handlers";

/**
 * Register all IPC handlers
 * This is the bridge between renderer process and services
 */
export function registerIPCHandlers(): void {
  registerProfileModule();
  registerAutomationModule();
  registerInstanceManagementModule();
  registerChatAutomationModule();
  registerVeo3Module();
  registerYoutubeModule();
  registerDialogModule();

  console.log("✅ All IPC handlers registered");
}
