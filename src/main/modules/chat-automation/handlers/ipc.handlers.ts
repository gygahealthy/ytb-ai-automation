// Legacy ipc handlers file (deprecated)
// The module now uses registration arrays (handlers/registrations.ts).
// This stub exists for backward compatibility and no longer auto-registers handlers.
export function registerChatAutomationHandlers(): void {
  throw new Error('registerChatAutomationHandlers is deprecated. Use registrations array or module.registerModule(registrar)');
}
