import { Logger } from '../../core/logging/types';

export const logger: Logger = {
  info: (message: string, ...args: any[]) => console.log('[INFO]', message, ...args),
  warn: (message: string, ...args: any[]) => console.warn('[WARN]', message, ...args),
  error: (message: string, ...args: any[]) => console.error('[ERROR]', message, ...args),
  debug: (message: string, ...args: any[]) => console.debug('[DEBUG]', message, ...args),
};
