import { app, BrowserWindow, dialog, ipcMain } from "electron";
import * as fs from "fs";
import * as path from "path";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const UserAgent = require("user-agents");

/**
 * Get default Chrome/Chromium executable path for the current platform
 */
function getDefaultChromePath(): string {
  const platform = process.platform;

  if (platform === "win32") {
    // Windows
    const possiblePaths = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
      path.join(process.env.PROGRAMFILES || "", "Google\\Chrome\\Application\\chrome.exe"),
      path.join(process.env["PROGRAMFILES(X86)"] || "", "Google\\Chrome\\Application\\chrome.exe"),
    ];

    for (const chromePath of possiblePaths) {
      if (fs.existsSync(chromePath)) {
        return chromePath;
      }
    }
  } else if (platform === "darwin") {
    // macOS
    const possiblePaths = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      path.join(process.env.HOME || "", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
    ];

    for (const chromePath of possiblePaths) {
      if (fs.existsSync(chromePath)) {
        return chromePath;
      }
    }
  } else {
    // Linux
    const possiblePaths = [
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/snap/bin/chromium",
    ];

    for (const chromePath of possiblePaths) {
      if (fs.existsSync(chromePath)) {
        return chromePath;
      }
    }
  }

  return ""; // Return empty if not found
}

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

  ipcMain.handle("dialog:getDefaultChromePath", () => {
    return getDefaultChromePath();
  });

  ipcMain.handle("dialog:selectBrowserExecutable", async () => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) {
      return { filePaths: [] };
    }

    const filters =
      process.platform === "win32"
        ? [
            { name: "Executable Files", extensions: ["exe"] },
            { name: "All Files", extensions: ["*"] },
          ]
        : process.platform === "darwin"
        ? [{ name: "Applications", extensions: ["app"] }]
        : [{ name: "All Files", extensions: ["*"] }];

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      title: "Select Browser Executable",
      filters,
    });

    return result;
  });

  console.log("✅ Dialog handlers registered");
}
