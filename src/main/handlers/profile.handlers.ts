import { ipcMain } from "electron";
import { profileService } from "../../services/profile.service";

/**
 * Register Profile IPC handlers
 */
export function registerProfileHandlers(): void {
  ipcMain.handle("profile:getAll", async () => {
    return await profileService.getAllProfiles();
  });

  ipcMain.handle("profile:getById", async (_, id: string) => {
    return await profileService.getProfileById(id);
  });

  ipcMain.handle("profile:create", async (_, input) => {
    return await profileService.createProfile(input);
  });

  ipcMain.handle("profile:update", async (_, id: string, updates) => {
    return await profileService.updateProfile(id, updates);
  });

  ipcMain.handle("profile:delete", async (_, id: string) => {
    return await profileService.deleteProfile(id);
  });

  ipcMain.handle("profile:updateCredit", async (_, id: string, amount: number) => {
    return await profileService.updateCredit(id, amount);
  });

  console.log("✅ Profile handlers registered");
}
