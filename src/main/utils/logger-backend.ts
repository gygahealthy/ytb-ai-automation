import { BrowserWindow } from "electron";
import { Logger } from "../../core/logging/types";

/**
 * Broadcasts log messages to all renderer windows via IPC
 */
function broadcastLog(level: string, message: string, args: any[]): void {
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
