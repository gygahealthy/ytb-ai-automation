import { ipcMain } from 'electron';
import { IpcRegistration } from './types';
import { wrapWithMiddleware } from './middleware';
import { Logger } from '../logging/types';

export function registerAll(registrations: IpcRegistration[], logger: Logger) {
  for (const reg of registrations) {
    ipcMain.handle(reg.channel, wrapWithMiddleware(reg, logger));
  }
}
