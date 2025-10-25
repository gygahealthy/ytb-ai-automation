import { BrowserWindow } from "electron";
import { Logger } from "../../core/logging/types";

/**
 * Check if running in a forked child process (not the main Electron process)
 * In forked processes, BrowserWindow is not available
 */
function isForkedProcess(): boolean {
  return process.send !== undefined && typeof process.send === "function";
}

/**
 * Broadcasts log messages to all renderer windows via IPC
 * Only works in the main Electron process, not in forked child processes
 */
function broadcastLog(level: string, message: string, args: any[]): void {
  // Skip broadcasting if running in a forked child process
  if (isForkedProcess()) {
    return;
  }

  try {
    const allWindows = BrowserWindow.getAllWindows();
    const logData = {
      level,
      message,
      args,
      timestamp: Date.now(),
    };

    allWindows.forEach((window) => {
      if (window && !window.isDestroyed()) {
        window.webContents.send("logger:log", logData);
      }
    });
  } catch (error) {
    // Silently ignore errors when BrowserWindow is not available
    // (e.g., in forked processes or during shutdown)
  }
}

export const logger: Logger = {
  info: (message: string, ...args: any[]) => {
    console.log("[INFO]", message, ...args);
    broadcastLog("info", message, args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn("[WARN]", message, ...args);
    broadcastLog("warn", message, args);
  },
  error: (message: string, ...args: any[]) => {
    console.error("[ERROR]", message, ...args);
    broadcastLog("error", message, args);
  },
  debug: (message: string, ...args: any[]) => {
    console.debug("[DEBUG]", message, ...args);
    broadcastLog("debug", message, args);
  },
};
