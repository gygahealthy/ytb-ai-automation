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

class ElectronApp {
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.initializeApp();
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

    app.on("before-quit", async () => {
      // Final cleanup before app quits
      try {
        const manager = await getGlobalRotationWorkerManager();
        if (manager) {
          await manager.stop();
          console.log("✅ Cookie rotation manager cleaned up on quit");
        }
      } catch (error) {
        console.error("⚠️ Error during quit cleanup", error);
      }
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
