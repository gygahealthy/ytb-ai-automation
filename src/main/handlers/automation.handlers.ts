import { ipcMain } from "electron";
import { automationService } from "../../services/automation/automation.service";

/**
 * Register Automation IPC handlers
 */
export function registerAutomationHandlers(): void {
  ipcMain.handle("automation:getAll", async () => {
    return await automationService.getAllTasks();
  });

  ipcMain.handle("automation:getById", async (_, id: string) => {
    return await automationService.getTaskById(id);
  });

  ipcMain.handle("automation:create", async (_, input) => {
    return await automationService.createTask(input);
  });

  ipcMain.handle("automation:start", async (_, id: string) => {
    return await automationService.startTask(id);
  });

  ipcMain.handle("automation:stop", async (_, id: string) => {
    return await automationService.stopTask(id);
  });

  console.log("✅ Automation handlers registered");
}
