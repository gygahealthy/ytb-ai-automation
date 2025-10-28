// Register tsconfig-paths to resolve TypeScript path aliases at runtime
// Configure paths manually since tsconfig.json is not in dist/
import * as tsConfigPaths from "tsconfig-paths";
import * as path from "path";

// Set up path mappings for runtime resolution
const baseUrl = __dirname; // dist/main
tsConfigPaths.register({
  baseUrl,
  paths: {
    "@/*": ["../*"],
    "@main/*": ["./*"],
    "@handlers/*": ["./handlers/*"],
    "@modules/*": ["./modules/*"],
    "@renderer/*": ["../renderer/*"],
    "@components/*": ["../renderer/components/*"],
    "@constants/*": ["../renderer/constants/*"],
    "@contexts/*": ["../renderer/contexts/*"],
    "@hooks/*": ["../renderer/hooks/*"],
    "@ipc/*": ["../renderer/ipc/*"],
    "@pages/*": ["../renderer/pages/*"],
    "@store/*": ["../renderer/store/*"],
    "@shared/*": ["../shared/*"],
  },
});

import { app, BrowserWindow, Menu } from "electron";
import { database } from "./storage/database";
import { registerIPCHandlers } from "./handlers";
import { veo3PollingService } from "./modules/ai-video-creation/video-project-manage/services/veo3.service";
import { getGlobalRotationWorkerManager } from "./modules/common/cookie-rotation/services/global-rotation-worker-manager.service";
import { killAllTrackedChromePIDs } from "./modules/gemini-apis/helpers/browser/browser-launcher-headless.helpers";
import { execSync } from "child_process";

class ElectronApp {
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.setupShutdownHandlers();
    this.initializeApp();
  }

  /**
   * Setup graceful and forced shutdown handlers
   * Ensures Chrome processes are cleaned up even on unexpected termination
   */
  private setupShutdownHandlers(): void {
    process.on("SIGTERM", async () => {
      console.log("[Electron] SIGTERM received - graceful shutdown");
      await this.cleanupAndExit();
    });

    process.on("SIGINT", async () => {
      console.log("[Electron] SIGINT received - graceful shutdown");
      await this.cleanupAndExit();
    });

    process.on("uncaughtException", async (error) => {
      console.error("[Electron] Uncaught exception:", error);
      await this.cleanupAndExit(1);
    });

    process.on("unhandledRejection", async (reason) => {
      console.error("[Electron] Unhandled rejection:", reason);
      await this.cleanupAndExit(1);
    });
  }

  /**
   * Cleanup and exit helper - ensures Chrome processes are terminated
   */
  private async cleanupAndExit(exitCode: number = 0): Promise<void> {
    console.log("[Electron] Starting cleanup routine before exit");

    try {
      const manager = await getGlobalRotationWorkerManager();
      if (manager) {
        await manager.stop();
        console.log("✅ Rotation manager stopped");
      }
    } catch (error) {
      console.error("⚠️ Error stopping rotation manager:", error);
    }

    // Kill all tracked Chrome PIDs first (most precise)
    try {
      console.log("[Electron] Killing all tracked Chrome processes");
      killAllTrackedChromePIDs();
      console.log("✅ Tracked Chrome processes cleaned up");
    } catch (error) {
      console.warn("⚠️ Error killing tracked Chrome processes:", error);
    }

    // Force kill any remaining Chrome processes as final safety net
    if (process.platform === "win32") {
      try {
        console.log("[Electron] Force killing any remaining Chrome processes");
        execSync("taskkill /F /IM chrome.exe 2>nul || true", {
          windowsHide: true,
          timeout: 5000,
        });
        console.log("✅ Chrome cleanup complete");
      } catch (error) {
        console.warn("⚠️ Failed to force kill Chrome processes:", error);
      }
    }

    process.exit(exitCode);
  }

  private initializeApp(): void {
    // Register app lifecycle handlers first
    app.on("ready", async () => {
      // Initialize database when app is ready
      await database.initialize();

      // Register IPC handlers
      registerIPCHandlers();

      // Restore pending video generations to polling queue
      await veo3PollingService.restorePendingGenerations();

      // Create window first (fast startup)
      this.createWindow();

      // Phase 2: Initialize startup workers in the background (don't block UI)
      // This will automatically start workers for cookies marked with launch_worker_on_startup=1
      // Run asynchronously so it doesn't delay the renderer from appearing
      setImmediate(async () => {
        try {
          const rotationManager = await getGlobalRotationWorkerManager();
          console.log("✅ Cookie rotation manager initialized (workers not started)");
          await rotationManager.initializeStartupWorkers();
          console.log("✅ Startup cookie rotation workers initialized (background)");
        } catch (error) {
          console.error("❌ Failed to initialize cookie rotation manager and startup workers", error);
        }
      });
    });

    app.on("before-quit", async (event) => {
      event.preventDefault();
      console.log("[Electron] Before-quit event - starting cleanup");

      try {
        const manager = await getGlobalRotationWorkerManager();
        if (manager) {
          await manager.stop();
          console.log("✅ Cookie rotation manager cleaned up on quit");
        }
        // Kill tracked Chrome PIDs
        try {
          killAllTrackedChromePIDs();
          console.log("✅ Tracked Chrome processes cleaned up");
        } catch (e) {
          /* ignore */
        }
        // Final safety net
        if (process.platform === "win32") {
          try {
            execSync("taskkill /F /IM chrome.exe 2>nul || true", { windowsHide: true, timeout: 3000 });
          } catch (e) {
            /* ignore */
          }
        }
      } catch (error) {
        console.error("⚠️ Error during quit cleanup", error);
      }
      app.exit(0);
    });

    app.on("window-all-closed", async () => {
      // Clean up rotation manager before quitting
      try {
        const manager = await getGlobalRotationWorkerManager();
        await manager.stop();
        console.log("✅ Cookie rotation manager stopped");
      } catch (error) {
        console.error("⚠️ Failed to stop cookie rotation manager", error);
      }

      if (process.platform !== "darwin") {
        app.quit();
      }
    });

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }

  private createWindow(): void {
    // Remove the application menu
    Menu.setApplicationMenu(null);

    // Icon path - handle both dev and production
    const iconPath =
      process.env.NODE_ENV === "development"
        ? path.join(__dirname, "../../src/renderer/assets/icon.png")
        : path.join(__dirname, "../renderer/assets/icon.png");

    this.mainWindow = new BrowserWindow({
      width: 1440,
      height: 900,
      minWidth: 1000,
      minHeight: 600,
      fullscreen: false,
      center: true,
      icon: iconPath,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js"),
      },
      frame: true,
      titleBarStyle: "default",
    });

    // Load the app
    if (process.env.NODE_ENV === "development") {
      this.mainWindow.loadURL("http://localhost:5173");
      // if (process.env.OPEN_DEVTOOLS !== "0") {
      //   this.mainWindow.webContents.openDevTools();
      // }
    } else {
      this.mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
    }
  }
}

// Initialize the app
new ElectronApp();
