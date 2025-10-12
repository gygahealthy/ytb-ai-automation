import { app, BrowserWindow, Menu } from "electron";
import * as path from "path";
import { database } from "./storage/database";
import { registerIPCHandlers } from "./handlers";
import { veo3PollingService } from "./modules/ai-video-creation/services/veo3.service";

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

      // Create window
      this.createWindow();
    });

    app.on("window-all-closed", () => {
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
      // Do not open DevTools automatically. Developers can set OPEN_DEVTOOLS=1 to open them.
      if (process.env.OPEN_DEVTOOLS === '1') {
        this.mainWindow.webContents.openDevTools();
      }
    } else {
      this.mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
    }
  }
}

// Initialize the app
new ElectronApp();
