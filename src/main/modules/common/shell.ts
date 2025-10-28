import { shell } from "electron";
import { IpcRegistration } from "../../../core/ipc/types";
import { logger } from "../../utils/logger-backend";
import * as path from "path";

/**
 * Shell utility IPC handlers
 * Provides safe access to shell operations like opening folders
 */

const openPathHandler: IpcRegistration<string> = {
  channel: "shell:openPath",
  handler: async (filePath: string) => {
    try {
      logger.info(`Opening path in file explorer: ${filePath}`);

      // Validate path exists and is absolute
      if (!path.isAbsolute(filePath)) {
        return {
          success: false,
          error: "Path must be absolute",
        };
      }

      // If it's a file, open its containing folder
      const { statSync } = await import("fs");
      let pathToOpen = filePath;

      try {
        const stats = statSync(filePath);
        if (stats.isFile()) {
          pathToOpen = path.dirname(filePath);
        }
      } catch {
        // If path doesn't exist, try parent directory
        pathToOpen = path.dirname(filePath);
      }

      // Show item in file explorer without stealing focus from app
      // shell.showItemInFolder highlights the item in explorer without focusing the window
      shell.showItemInFolder(filePath);

      logger.info(`Successfully revealed path in explorer: ${filePath}`);
      return {
        success: true,
        data: { path: pathToOpen },
      };
    } catch (error) {
      logger.error("Failed to open path in explorer", error);
      return {
        success: false,
        error: String(error),
      };
    }
  },
};

export const shellRegistrations: IpcRegistration[] = [openPathHandler];
