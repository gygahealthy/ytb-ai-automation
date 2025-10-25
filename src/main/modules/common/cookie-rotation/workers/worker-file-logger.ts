/**
 * Worker File Logger
 * Dedicated file-based logger for cookie rotation workers running in forked processes
 * Each worker gets its own log file in logs/workers/
 */

import * as fs from "fs";
import * as path from "path";
import { app } from "electron";

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface WorkerLogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  cookieId: string;
  service?: string;
  profileId?: string;
  args?: any[];
}

/**
 * WorkerFileLogger - Writes logs to worker-specific files
 */
export class WorkerFileLogger {
  private cookieId: string;
  private service?: string;
  private profileId?: string;
  private logFilePath: string;
  private writeStream: fs.WriteStream | null = null;
  private isForkedProcess: boolean;

  constructor(cookieId: string, service?: string, profileId?: string) {
    this.cookieId = cookieId;
    this.service = service;
    this.profileId = profileId;
    this.isForkedProcess = process.send !== undefined && typeof process.send === "function";
    this.isForkedProcess = process.send !== undefined && typeof process.send === "function";

    // Determine log directory
    const userDataPath = this.isForkedProcess
      ? process.env.WORKER_LOG_DIR || path.join(process.cwd(), "logs")
      : path.join(app.getPath("userData"), "logs");

    const workerLogDir = path.join(userDataPath, "workers");

    // Ensure directory exists
    if (!fs.existsSync(workerLogDir)) {
      fs.mkdirSync(workerLogDir, { recursive: true });
    }

    // Log file path with sanitized cookie ID
    const sanitizedCookieId = cookieId.replace(/[^a-zA-Z0-9-]/g, "_");
    this.logFilePath = path.join(workerLogDir, `worker-${sanitizedCookieId}.log`);

    // Initialize write stream
    this.initWriteStream();
  }

  private initWriteStream(): void {
    try {
      // Append mode, create if not exists
      this.writeStream = fs.createWriteStream(this.logFilePath, {
        flags: "a",
        encoding: "utf8",
      });

      this.writeStream.on("error", (err) => {
        console.error(`[WorkerFileLogger] Write stream error for ${this.cookieId}:`, err);
      });
    } catch (error) {
      console.error(`[WorkerFileLogger] Failed to create write stream for ${this.cookieId}:`, error);
    }
  }

  private writeLog(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.writeStream) {
      // Fallback to console if stream is not available
      console[level === "error" ? "error" : "log"](`[${level.toUpperCase()}]`, message, ...args);
      return;
    }

    const entry: WorkerLogEntry = {
      timestamp: Date.now(),
      level,
      message,
      cookieId: this.cookieId,
      service: this.service,
      profileId: this.profileId,
      args: args.length > 0 ? args : undefined,
    };

    // Write as JSON lines (one JSON object per line)
    const line = JSON.stringify(entry) + "\n";

    this.writeStream.write(line, (err) => {
      if (err) {
        console.error(`[WorkerFileLogger] Failed to write log for ${this.cookieId}:`, err);
      }
    });

    // Also log to console for immediate visibility during development
    console[level === "error" ? "error" : "log"](`[${level.toUpperCase()}] [${this.cookieId.slice(0, 8)}]`, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.writeLog("info", message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.writeLog("warn", message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.writeLog("error", message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.writeLog("debug", message, ...args);
  }

  /**
   * Close the write stream
   */
  close(): void {
    if (this.writeStream) {
      this.writeStream.end();
      this.writeStream = null;
    }
  }

  /**
   * Get the log file path
   */
  getLogFilePath(): string {
    return this.logFilePath;
  }
}

/**
 * Read log file and parse entries
 */
export function readWorkerLogFile(cookieId: string, options?: { tail?: number; profileId?: string }): WorkerLogEntry[] {
  try {
    const userDataPath = app.getPath("userData");
    const sanitizedCookieId = cookieId.replace(/[^a-zA-Z0-9-]/g, "_");
    const logFilePath = path.join(userDataPath, "logs", "workers", `worker-${sanitizedCookieId}.log`);

    console.log("[readWorkerLogFile] cookieId:", cookieId);
    console.log("[readWorkerLogFile] logFilePath:", logFilePath);
    console.log("[readWorkerLogFile] exists:", fs.existsSync(logFilePath));

    if (!fs.existsSync(logFilePath)) {
      return [];
    }

    const content = fs.readFileSync(logFilePath, "utf8");
    const lines = content
      .trim()
      .split("\n")
      .filter((line) => line.trim());

    let entries: WorkerLogEntry[] = [];

    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as WorkerLogEntry;
        entries.push(entry);
      } catch (parseErr) {
        // Skip malformed lines
        console.warn(`[readWorkerLogFile] Failed to parse line:`, line);
      }
    }

    // Filter by profileId if specified (only filter entries that have profileId set)
    if (options?.profileId) {
      entries = entries.filter((entry) => !entry.profileId || entry.profileId === options.profileId);
    }

    console.log("[readWorkerLogFile] After filtering, entries:", entries.length);

    // Return last N entries if tail is specified
    if (options?.tail && options.tail > 0) {
      entries = entries.slice(-options.tail);
    }

    return entries;
  } catch (error) {
    console.error(`[readWorkerLogFile] Failed to read log file for ${cookieId}:`, error);
    return [];
  }
}

/**
 * Clear log file for a worker
 */
export function clearWorkerLogFile(cookieId: string): void {
  try {
    const userDataPath = app.getPath("userData");
    const sanitizedCookieId = cookieId.replace(/[^a-zA-Z0-9-]/g, "_");
    const logFilePath = path.join(userDataPath, "logs", "workers", `worker-${sanitizedCookieId}.log`);

    if (fs.existsSync(logFilePath)) {
      fs.unlinkSync(logFilePath);
    }
  } catch (error) {
    console.error(`[clearWorkerLogFile] Failed to clear log file for ${cookieId}:`, error);
  }
}

/**
 * Get all worker log files
 */
export function listWorkerLogFiles(): string[] {
  try {
    const userDataPath = app.getPath("userData");
    const workerLogDir = path.join(userDataPath, "logs", "workers");

    if (!fs.existsSync(workerLogDir)) {
      return [];
    }

    return fs
      .readdirSync(workerLogDir)
      .filter((file) => file.startsWith("worker-") && file.endsWith(".log"))
      .map((file) => path.join(workerLogDir, file));
  } catch (error) {
    console.error("[listWorkerLogFiles] Failed to list worker log files:", error);
    return [];
  }
}
