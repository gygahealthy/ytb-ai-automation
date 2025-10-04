import { app, BrowserWindow, dialog, ipcMain } from "electron";
import * as path from "path";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const UserAgent = require("user-agents");

/**
 * Register Dialog IPC handlers
 */
export function registerDialogHandlers(): void {
  ipcMain.handle("dialog:selectFolder", async (_, defaultPath?: string) => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) {
      return { filePaths: [] };
    }

    const dialogOptions: Electron.OpenDialogOptions = {
      properties: ["openDirectory"],
      title: "Select Profile Folder",
    };

    // Set default path if provided
    if (defaultPath) {
      dialogOptions.defaultPath = defaultPath;
    }

    const result = await dialog.showOpenDialog(mainWindow, dialogOptions);
    return result;
  });

  ipcMain.handle("dialog:getDefaultProfilePath", async () => {
    const defaultPath = path.join(app.getPath("userData"), "profiles");
    return defaultPath;
  });

  ipcMain.handle("dialog:generateUserAgent", () => {
    try {
      const userAgent = new UserAgent();
      return userAgent.toString();
    } catch (error) {
      console.error("Failed to generate user agent:", error);
      // Fallback user agent
      return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    }
  });

  console.log("✅ Dialog handlers registered");
}
