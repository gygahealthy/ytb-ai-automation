import { registerModule as registerProfileModule } from "../modules/profile-management";
import { registerModule as registerChatAutomationModule } from "../modules/chat-automation";
import { registerModule as registerVeo3Module } from "../modules/ai-video-creation";
import { registerModule as registerInstanceManagementModule } from "../modules/instance-management";
import { registerModule as registerAutomationModule } from "../modules/workflow-task-automation";
import { registerModule as registerYoutubeModule } from "../modules/youtube-analysis";
import { registerDialogHandlers as registerDialogModule } from "./dialog.handlers";

/**
 * Collect all IPC registrations from modules and return an array of registrations.
 * Modules receive a registrar callback and push their IpcRegistration[] via that callback.
 */
export function collectModuleRegistrations(): any[] {
  const allRegistrations: any[] = [];
  registerProfileModule((regs: any[]) => allRegistrations.push(...regs));
  registerAutomationModule((regs: any[]) => allRegistrations.push(...regs));
  registerInstanceManagementModule((regs: any[]) => allRegistrations.push(...regs));
  registerChatAutomationModule((regs: any[]) => allRegistrations.push(...regs));
  registerVeo3Module((regs: any[]) => allRegistrations.push(...regs));
  registerYoutubeModule((regs: any[]) => allRegistrations.push(...regs));

  // Dialog handlers may be available as a function; guard the call to avoid startup crash
  try {
    if (typeof registerDialogModule === 'function') {
      registerDialogModule();
    }
  } catch (e) {
    console.warn('Failed to register dialog handlers, continuing startup', e);
  }

  return allRegistrations;
}
