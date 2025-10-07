import { collectModuleRegistrations } from './module-loader';
import { registerAll } from '../../core/ipc/registry';
import { logger } from '../utils/logger-backend';

/**
 * Register all IPC handlers
 * This is the bridge between renderer process and services
 */
export function registerIPCHandlers(): void {
  // Collect registrations from modules
  const allRegistrations = collectModuleRegistrations();

  // Register core ipc handlers via centralized registry
  // All module registrations are collected and registered here
  registerAll([...allRegistrations], logger);

  console.log("✅ All IPC handlers registered");
}
