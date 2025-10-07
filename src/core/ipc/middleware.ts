import { IpcRegistration, ApiResponse } from './types';
import { Logger } from '../logging/types';

export function wrapWithMiddleware(reg: IpcRegistration, logger: Logger) {
  return async (_event: any, req: any) : Promise<any> => {
    const start = Date.now();
    logger.info(`IPC ${reg.channel} called`);

    // Simple auth placeholder - expand as needed
    // if (reg.requiresAuth && !_event.sender.isAuthorized) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } };

    try {
      // Validation would go here (zod) if enabled
      const res = await reg.handler(req);
      const duration = Date.now() - start;
      logger.info(`IPC ${reg.channel} completed in ${duration}ms`);
      return res;
    } catch (err: any) {
      logger.error(`IPC ${reg.channel} failed`, err);
      return { success: false, error: { code: 'INTERNAL_ERROR', message: String(err) } } as ApiResponse<any>;
    }
  };
}
