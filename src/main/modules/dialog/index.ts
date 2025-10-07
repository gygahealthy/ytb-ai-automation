import { ipcMain } from 'electron';
import {
  selectFolder,
  getDefaultProfilePath,
  generateUserAgent,
  getDefaultChromePath,
  selectBrowserExecutable,
} from '../../utils/dialog.service';
import { IpcRegistration } from '../../../core/ipc/types';

export const dialogRegistrations: IpcRegistration[] = [
  {
    channel: 'dialog:selectFolder',
    description: 'Open folder selection dialog',
    handler: async (req: any) => {
      const defaultPath = req as string | undefined;
      try {
        const res = await selectFolder(defaultPath);
        return { success: true, data: res };
      } catch (e) {
        return { success: false, error: e };
      }
    },
  },
  {
    channel: 'dialog:getDefaultProfilePath',
    description: 'Get default profile path',
    handler: async () => {
      try {
        const res = getDefaultProfilePath();
        return { success: true, data: res };
      } catch (e) {
        return { success: false, error: e };
      }
    },
  },
  {
    channel: 'dialog:generateUserAgent',
    description: 'Generate a random user agent',
    handler: async () => {
      try {
        const res = generateUserAgent();
        return { success: true, data: res };
      } catch (e) {
        return { success: false, error: e };
      }
    },
  },
  {
    channel: 'dialog:getDefaultChromePath',
    description: 'Get default Chrome path',
    handler: async () => {
      try {
        const res = getDefaultChromePath();
        return { success: true, data: res };
      } catch (e) {
        return { success: false, error: e };
      }
    },
  },
  {
    channel: 'dialog:selectBrowserExecutable',
    description: 'Select browser executable',
    handler: async () => {
      try {
        const res = await selectBrowserExecutable();
        return { success: true, data: res };
      } catch (e) {
        return { success: false, error: e };
      }
    },
  },
];

export function registerModule(registrar?: (regs: IpcRegistration[]) => void): void {
  if (registrar) {
    registrar(dialogRegistrations);
    return;
  }

  // Register handlers directly when called without a registrar (fallback)
  for (const reg of dialogRegistrations) {
    ipcMain.handle(reg.channel, async (_event, ...args) => {
      const req = args.length <= 1 ? args[0] : args;
      return await reg.handler(req as any);
    });
  }

  console.log('✅ Dialog module registered (src/main/modules/dialog/index.ts)');
}
