/**
 * Worker Log IPC Handlers
 * Provides IPC endpoints to read and stream worker log files to the renderer
 */

import { readWorkerLogFile, clearWorkerLogFile, listWorkerLogFiles } from "../workers/worker-file-logger.js";
import type { ApiResponse } from "../../../../../core/ipc/types.js";

/**
 * Get worker logs
 */
const getWorkerLogsHandler = {
  channel: "cookie-rotation:get-worker-logs",
  handler: async (req: any): Promise<ApiResponse<any>> => {
    try {
      console.log("[worker-logs] Handler called with req:", req);
      const [cookieId, options] = req;
      console.log("[worker-logs] cookieId:", cookieId, "options:", options);
      const logs = readWorkerLogFile(cookieId, options);
      console.log("[worker-logs] Read", logs.length, "logs");
      return {
        success: true,
        data: logs,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to read worker logs",
      };
    }
  },
};

/**
 * Clear worker logs
 */
const clearWorkerLogsHandler = {
  channel: "cookie-rotation:clear-worker-logs",
  handler: async (req: any): Promise<ApiResponse<any>> => {
    try {
      const [cookieId] = req;
      clearWorkerLogFile(cookieId);
      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to clear worker logs",
      };
    }
  },
};

/**
 * List all worker log files
 */
const listWorkerLogFilesHandler = {
  channel: "cookie-rotation:list-worker-log-files",
  handler: async (): Promise<ApiResponse<any>> => {
    try {
      const files = listWorkerLogFiles();
      return {
        success: true,
        data: files,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to list worker log files",
      };
    }
  },
};

export const workerLogHandlers = [getWorkerLogsHandler, clearWorkerLogsHandler, listWorkerLogFilesHandler];
