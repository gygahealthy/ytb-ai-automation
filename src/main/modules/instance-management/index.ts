import { ipcMain } from 'electron';
import { IpcRegistration } from '../../../core/ipc/types';
import { instanceRegistrations } from './handlers/registrations';

export function registerModule(registrar?: (regs: IpcRegistration[]) => void): void {
  if (registrar) {
    registrar(instanceRegistrations);
    return;
  }

  for (const reg of instanceRegistrations) {
    ipcMain.handle(reg.channel, async (_event, ...args) => {
      const req = args.length <= 1 ? args[0] : args;
      return await reg.handler(req as any);
    });
  }
}
