import { collectModuleRegistrations } from './module-loader';
import { registerAll } from '../../core/ipc/registry';
import { logger } from '../utils/logger-backend';
import { IpcRegistration } from '../../core/ipc/types';
import { registerDevToolsHandlers } from './devtools';

/**
 * Register all IPC handlers
 * This is the bridge between renderer process and services
 */
export function registerIPCHandlers(): void {
  // Collect registrations from modules
  const allRegistrations = collectModuleRegistrations();

  // Deduplicate registrations by channel to avoid "second handler" errors
  const uniqueMap = new Map<string, IpcRegistration>();
  for (const reg of allRegistrations) {
    if (!uniqueMap.has(reg.channel)) {
      uniqueMap.set(reg.channel, reg);
    } else {
      console.warn(`Duplicate IPC registration for channel '${reg.channel}' detected — ignoring subsequent registration`);
    }
  }

  const uniqueRegistrations = Array.from(uniqueMap.values());

  // Register core ipc handlers via centralized registry
  registerAll(uniqueRegistrations, logger);

  // Register devtools handlers
  registerDevToolsHandlers();

  // master-prompts handlers are provided by the prompt-management module

  console.log("✅ All IPC handlers registered");
}
