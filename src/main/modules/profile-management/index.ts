import { ipcMain } from 'electron';
import { profileRegistrations } from './handlers/registrations';
import { IpcRegistration } from '../../../core/ipc/types';

export function registerModule(registrar?: (regs: IpcRegistration[]) => void): void {
  if (registrar) {
    registrar(profileRegistrations);
    return;
  }

  for (const reg of profileRegistrations) {
    ipcMain.handle(reg.channel, async (_event, ...args) => {
      const req = args.length <= 1 ? args[0] : args;
      return await reg.handler(req as any);
    });
  }
}
