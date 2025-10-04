import { ipcMain } from "electron";
import { automationService } from "../services/automation/automation.service";
import { profileService } from "../services/profile.service";
import { veo3Service } from "../services/veo3.service";
import { youtubeService } from "../services/youtube.service";

/**
 * Register all IPC handlers
 * This is the bridge between renderer process and services
 */
export function registerIPCHandlers(): void {
  // ============= Profile Handlers =============
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

  // ============= Automation Handlers =============
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

  // ============= VEO3 Handlers =============
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

  // ============= YouTube Handlers =============
  ipcMain.handle("youtube:getAllChannels", async () => {
    return await youtubeService.getAllChannels();
  });

  ipcMain.handle("youtube:getChannelById", async (_, id: string) => {
    return await youtubeService.getChannelById(id);
  });

  ipcMain.handle("youtube:createChannel", async (_, input) => {
    return await youtubeService.createChannel(input);
  });

  ipcMain.handle("youtube:updateChannelMetrics", async (_, id: string, metrics) => {
    return await youtubeService.updateChannelMetrics(id, metrics);
  });

  ipcMain.handle("youtube:analyzeChannel", async (_, id: string) => {
    return await youtubeService.analyzeChannel(id);
  });

  ipcMain.handle("youtube:deleteChannel", async (_, id: string) => {
    return await youtubeService.deleteChannel(id);
  });

  ipcMain.handle("youtube:getAllVideos", async () => {
    return await youtubeService.getAllVideoAnalyses();
  });

  ipcMain.handle("youtube:getVideosByChannel", async (_, channelId: string) => {
    return await youtubeService.getVideoAnalysesByChannel(channelId);
  });

  ipcMain.handle("youtube:analyzeVideo", async (_, videoId: string, channelId: string) => {
    return await youtubeService.analyzeVideo(videoId, channelId);
  });

  console.log("✅ IPC handlers registered");
}
