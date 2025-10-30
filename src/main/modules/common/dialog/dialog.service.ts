import { app, BrowserWindow, dialog } from "electron";
import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const UserAgent = require("user-agents");

export function getDefaultChromePath(): string {
  const platform = process.platform;

  if (platform === "win32") {
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

  return "";
}

export async function selectFolder(defaultPath?: string) {
  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (!mainWindow) {
    return { canceled: false, filePaths: [] } as Electron.OpenDialogReturnValue;
  }

  const dialogOptions: Electron.OpenDialogOptions = {
    properties: ["openDirectory"],
    title: "Select Profile Folder",
  };

  if (defaultPath) {
    dialogOptions.defaultPath = defaultPath;
  }

  const result = await dialog.showOpenDialog(mainWindow, dialogOptions);
  return result;
}

export function getDefaultProfilePath(): string {
  return path.join(app.getPath("userData"), "profiles");
}

export function generateUserAgent(): string {
  try {
    const userAgent = new UserAgent();
    return userAgent.toString();
  } catch (error) {
    // fallback UA
    return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  }
}

export async function selectBrowserExecutable() {
  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (!mainWindow) {
    return { canceled: false, filePaths: [] } as Electron.OpenDialogReturnValue;
  }

  const platform = process.platform;
  const filters =
    platform === "win32"
      ? [
          { name: "Executable Files", extensions: ["exe"] },
          { name: "All Files", extensions: ["*"] },
        ]
      : platform === "darwin"
      ? [
          { name: "Applications", extensions: ["app"] },
          { name: "All Files", extensions: ["*"] },
        ]
      : [{ name: "All Files", extensions: ["*"] }];

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    title: "Select Browser Executable",
    filters,
  });

  // On macOS, if user selected a .app bundle, convert to the actual executable path
  if (platform === "darwin" && !result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0];

    // If it's a .app bundle, resolve to the executable inside
    if (selectedPath.endsWith(".app")) {
      const appName = path.basename(selectedPath, ".app");
      const executablePath = path.join(selectedPath, "Contents", "MacOS", appName);

      // Verify the executable exists
      if (fs.existsSync(executablePath)) {
        return { ...result, filePaths: [executablePath] };
      }

      // If standard path doesn't exist, try common browser names
      const commonNames = ["Google Chrome", "Brave Browser", "Microsoft Edge", "Chromium"];
      for (const name of commonNames) {
        const altPath = path.join(selectedPath, "Contents", "MacOS", name);
        if (fs.existsSync(altPath)) {
          return { ...result, filePaths: [altPath] };
        }
      }
    }
  }

  return result;
}

export async function showOpenDialog(options: Electron.OpenDialogOptions) {
  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (!mainWindow) {
    return { canceled: true, filePaths: [] } as Electron.OpenDialogReturnValue;
  }

  const result = await dialog.showOpenDialog(mainWindow, options);
  console.log("[DialogService] showOpenDialog result:", JSON.stringify(result, null, 2));
  return result;
}

export async function validateBrowserPath(browserPath: string): Promise<{
  valid: boolean;
  error?: string;
  detectedName?: string;
  version?: string;
}> {
  try {
    // Check if file exists
    if (!fs.existsSync(browserPath)) {
      return { valid: false, error: "File does not exist" };
    }

    // Check if it's a file (not a directory) - except on macOS where .app bundles are directories
    const stats = fs.statSync(browserPath);
    const platform = process.platform;

    if (platform === "darwin" && browserPath.endsWith(".app")) {
      // On macOS, .app bundles are directories - convert to executable
      const appName = path.basename(browserPath, ".app");
      let executablePath = path.join(browserPath, "Contents", "MacOS", appName);

      // If standard path doesn't exist, try common browser names
      if (!fs.existsSync(executablePath)) {
        const commonNames = ["Google Chrome", "Brave Browser", "Microsoft Edge", "Chromium"];
        let found = false;
        for (const name of commonNames) {
          const altPath = path.join(browserPath, "Contents", "MacOS", name);
          if (fs.existsSync(altPath)) {
            executablePath = altPath;
            found = true;
            break;
          }
        }
        if (!found) {
          return { valid: false, error: "Invalid .app bundle structure" };
        }
      }

      // Update browserPath to the actual executable for validation
      browserPath = executablePath;
    } else if (!stats.isFile()) {
      return { valid: false, error: "Path is not a file" };
    }

    // Try to detect browser name from path
    const fileName = path.basename(browserPath).toLowerCase();
    let detectedName = "Browser";

    if (fileName.includes("chrome")) detectedName = "Chrome";
    else if (fileName.includes("brave")) detectedName = "Brave";
    else if (fileName.includes("edge")) detectedName = "Edge";
    else if (fileName.includes("chromium")) detectedName = "Chromium";
    else if (fileName.includes("opera")) detectedName = "Opera";
    else if (fileName.includes("vivaldi")) detectedName = "Vivaldi";

    // Try to get version by spawning with --version flag
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        // If version check times out, still return valid
        resolve({
          valid: true,
          detectedName,
          version: undefined,
        });
      }, 3000);

      try {
        const proc = spawn(browserPath, ["--version"]);
        let output = "";

        proc.stdout.on("data", (data) => {
          output += data.toString();
        });

        proc.on("close", (code) => {
          clearTimeout(timeout);
          if (code === 0 && output) {
            // Extract version from output (e.g., "Google Chrome 120.0.6099.109")
            const versionMatch = output.match(/(\d+\.\d+\.\d+\.\d+)/);
            resolve({
              valid: true,
              detectedName,
              version: versionMatch ? versionMatch[1] : output.trim(),
            });
          } else {
            resolve({
              valid: true,
              detectedName,
              version: undefined,
            });
          }
        });

        proc.on("error", () => {
          clearTimeout(timeout);
          resolve({
            valid: false,
            error: "Could not execute browser",
          });
        });
      } catch (e) {
        clearTimeout(timeout);
        resolve({
          valid: true,
          detectedName,
          version: undefined,
        });
      }
    });
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
