/**
 * IPC handlers for cookie rotation monitoring and control
 */
import { logger } from "../utils/logger-backend";

// Cookie rotation handlers are now registered by the gemini-apis module.
// Keep this shim to avoid accidentally registering the handlers twice.
export function registerCookieRotationHandlers(): void {
  logger.info(
    "[cookie-rotation] shim: handlers are registered via gemini-apis module registrations"
  );
}
