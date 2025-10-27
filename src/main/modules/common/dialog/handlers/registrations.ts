import { IpcRegistration } from "@/core/ipc/types";
import {
  selectFolder,
  getDefaultProfilePath,
  generateUserAgent,
  getDefaultChromePath,
  selectBrowserExecutable,
  showOpenDialog,
  validateBrowserPath,
} from "../dialog.service";

export const registrations: IpcRegistration[] = [
  {
    channel: "dialog:selectFolder",
    description: "Open folder selection dialog",
    handler: async (req: any) => {
      const defaultPath = req as string | undefined;
      try {
        const res = await selectFolder(defaultPath);
        return { success: true, data: res };
      } catch (e) {
        return { success: false, error: e };
      }
    },
  },
  {
    channel: "dialog:getDefaultProfilePath",
    description: "Get default profile path",
    handler: async () => {
      try {
        const res = getDefaultProfilePath();
        return { success: true, data: res };
      } catch (e) {
        return { success: false, error: e };
      }
    },
  },
  {
    channel: "dialog:generateUserAgent",
    description: "Generate a random user agent",
    handler: async () => {
      try {
        const res = generateUserAgent();
        return { success: true, data: res };
      } catch (e) {
        return { success: false, error: e };
      }
    },
  },
  {
    channel: "dialog:getDefaultChromePath",
    description: "Get default Chrome path",
    handler: async () => {
      try {
        const res = getDefaultChromePath();
        return { success: true, data: res };
      } catch (e) {
        return { success: false, error: e };
      }
    },
  },
  {
    channel: "dialog:selectBrowserExecutable",
    description: "Select browser executable",
    handler: async () => {
      try {
        const res = await selectBrowserExecutable();
        return { success: true, data: res };
      } catch (e) {
        return { success: false, error: e };
      }
    },
  },
  {
    channel: "dialog:showOpenDialog",
    description: "Show generic open dialog",
    handler: async (req: any) => {
      try {
        const options = req as Electron.OpenDialogOptions;
        const res = await showOpenDialog(options);
        return { success: true, data: res };
      } catch (e) {
        return { success: false, error: e };
      }
    },
  },
  {
    channel: "validateBrowserPath",
    description: "Validate browser executable path",
    handler: async (req: any) => {
      try {
        const browserPath = req as string;
        const res = await validateBrowserPath(browserPath);
        return { success: true, data: res };
      } catch (e) {
        return { success: false, error: e };
      }
    },
  },
];
