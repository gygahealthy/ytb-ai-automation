import { IpcRegistration, ApiResponse } from "./types";
import { Logger } from "../logging/types";

export function wrapWithMiddleware(reg: IpcRegistration, logger: Logger) {
  return async (_event: any, ...args: any[]): Promise<any> => {
    const start = Date.now();

    // Skip logging for high-frequency file system operations
    const skipLogging = reg.channel.startsWith("fs:");

    if (!skipLogging) {
      logger.info(`IPC ${reg.channel} called`);
    }

    // If multiple args were passed via ipcRenderer.invoke(channel, a, b, c)
    // forward them to the handler as an array so handlers can support
    // either a single object or an array of positional args.
    const req = args.length === 1 ? args[0] : args;

    // Simple auth placeholder - expand as needed
    // if (reg.requiresAuth && !_event.sender.isAuthorized) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } };

    try {
      // Validation would go here (zod) if enabled
      const res = await reg.handler(req);
      const duration = Date.now() - start;

      if (!skipLogging) {
        logger.info(`IPC ${reg.channel} completed in ${duration}ms`);
      }

      // Log response details for debugging specific handlers
      if (reg.channel === "componentDiscovery:getComponentTreeForUI") {
        logger.info(`[IPC-Middleware] Returning response for ${reg.channel}:`, res);
        if (res && res.data) {
          logger.info(`[IPC-Middleware] Response has data array with ${res.data.length} items`);
        }
      }

      return res;
    } catch (err: any) {
      logger.error(`IPC ${reg.channel} failed`, err);
      return {
        success: false,
        error: { code: "INTERNAL_ERROR", message: String(err) },
      } as ApiResponse<any>;
    }
  };
}
