import { app, BrowserWindow, Menu } from "electron";
import * as path from "path";
import { database } from "./storage/database";
import { registerIPCHandlers } from "./handlers";

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
      width: 1400,
      height: 900,
      minWidth: 1000,
      minHeight: 600,
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
      // Open DevTools in development
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
    }
  }
}

// Initialize the app
new ElectronApp();
