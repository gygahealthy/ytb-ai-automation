import { ipcMain } from 'electron';
import {
  selectFolder,
  getDefaultProfilePath,
  generateUserAgent,
  getDefaultChromePath,
  selectBrowserExecutable,
} from '../../utils/dialog.service';

/**
 * Standard module registration entrypoint used by module-loader
 */
export function registerModule(registrar: (registrations: any[]) => void): void {
  ipcMain.handle('dialog:selectFolder', async (_, defaultPath?: string) => {
    return selectFolder(defaultPath);
  });

  ipcMain.handle('dialog:getDefaultProfilePath', async () => {
    return getDefaultProfilePath();
  });

  ipcMain.handle('dialog:generateUserAgent', () => {
    return generateUserAgent();
  });

  ipcMain.handle('dialog:getDefaultChromePath', () => {
    return getDefaultChromePath();
  });

  ipcMain.handle('dialog:selectBrowserExecutable', async () => {
    return selectBrowserExecutable();
  });

  // Optionally report the registered channels back to the registrar
  try {
    registrar([
      { channel: 'dialog:selectFolder' },
      { channel: 'dialog:getDefaultProfilePath' },
      { channel: 'dialog:generateUserAgent' },
      { channel: 'dialog:getDefaultChromePath' },
      { channel: 'dialog:selectBrowserExecutable' },
    ]);
  } catch (e) {
    // ignore if registrar is not used by consumer
  }

  console.log('✅ Dialog module registered (src/main/modules/dialog/index.ts)');
}
