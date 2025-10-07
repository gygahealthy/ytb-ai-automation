import { ipcMain } from 'electron';
import { IpcRegistration } from '../../../core/ipc/types';
import { chatAutomationRegistrations } from './handlers/registrations';

export function registerModule(registrar?: (regs: IpcRegistration[]) => void): void {
  if (registrar) {
    registrar(chatAutomationRegistrations);
    return;
  }

  // no registrar provided: register handlers directly on ipcMain using registrations
  for (const reg of chatAutomationRegistrations) {
    ipcMain.handle(reg.channel, async (_event, ...args) => {
      const req = args.length <= 1 ? args[0] : args;
      return await reg.handler(req as any);
    });
  }
}
