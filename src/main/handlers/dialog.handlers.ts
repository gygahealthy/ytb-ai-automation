import { ipcMain } from "electron";
import {
  selectFolder,
  getDefaultProfilePath,
  generateUserAgent,
  getDefaultChromePath,
  selectBrowserExecutable,
} from "../../utils/dialog.util";

export function registerDialogHandlers(): void {
  ipcMain.handle("dialog:selectFolder", async (_, defaultPath?: string) => {
    return selectFolder(defaultPath);
  });

  ipcMain.handle("dialog:getDefaultProfilePath", async () => {
    return getDefaultProfilePath();
  });

  ipcMain.handle("dialog:generateUserAgent", () => {
    return generateUserAgent();
  });

  ipcMain.handle("dialog:getDefaultChromePath", () => {
    return getDefaultChromePath();
  });

  ipcMain.handle("dialog:selectBrowserExecutable", async () => {
    return selectBrowserExecutable();
  });

  console.log("✅ Dialog handlers registered (via handlers/dialog.handlers.ts)");
}
