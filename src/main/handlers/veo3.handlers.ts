import { ipcMain } from "electron";
import { veo3Service } from "../../services/veo3.service";

/**
 * Register VEO3 IPC handlers
 */
export function registerVeo3Handlers(): void {
  ipcMain.handle("veo3:getAll", async () => {
    return await veo3Service.getAllProjects();
  });

  ipcMain.handle("veo3:getById", async (_, id: string) => {
    return await veo3Service.getProjectById(id);
  });

  ipcMain.handle("veo3:create", async (_, input) => {
    return await veo3Service.createProject(input);
  });

  ipcMain.handle("veo3:updateStatus", async (_, id: string, status) => {
    return await veo3Service.updateProjectStatus(id, status);
  });

  ipcMain.handle("veo3:addScene", async (_, projectId: string, scene) => {
    return await veo3Service.addScene(projectId, scene);
  });

  ipcMain.handle("veo3:removeScene", async (_, projectId: string, sceneId: string) => {
    return await veo3Service.removeScene(projectId, sceneId);
  });

  ipcMain.handle("veo3:updatePrompt", async (_, projectId: string, jsonPrompt) => {
    return await veo3Service.updateJsonPrompt(projectId, jsonPrompt);
  });

  ipcMain.handle("veo3:delete", async (_, id: string) => {
    return await veo3Service.deleteProject(id);
  });

  console.log("✅ VEO3 handlers registered");
}
