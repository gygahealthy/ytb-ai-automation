import { registerModule as registerProfileModule } from "../modules/profile-management";
import { registerModule as registerChatAutomationModule } from "../modules/chat-automation";
import { registerModule as registerVeo3Module } from "../modules/ai-video-creation";
import { registerModule as registerInstanceManagementModule } from "../modules/instance-management";
import { registerModule as registerAutomationModule } from "../modules/workflow-task-automation";
import { registerModule as registerYoutubeModule } from "../modules/youtube-analysis";
import { registerDialogHandlers as registerDialogModule } from "./dialog.handlers";

// Core centralized IPC registry
import { registerAll } from '../../core/ipc/registry';
import { logger } from '../utils/logger-backend';

/**
 * Register all IPC handlers
 * This is the bridge between renderer process and services
 */
export function registerIPCHandlers(): void {
  // Hybrid registration: collect registrations from modules and centralize them
  const allRegistrations: any[] = [];
  // each module will push its registrations when provided the registrar callback
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
    } else {
      console.warn('Dialog handlers module did not export a function; skipping');
    }
  } catch (e) {
    console.warn('Failed to register dialog handlers, continuing startup', e);
  }

  // Register core ipc handlers via centralized registry
  // All module registrations are collected and registered here
  registerAll([...allRegistrations], logger);

  console.log("✅ All IPC handlers registered");
}
