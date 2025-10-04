import { ipcMain } from "electron";
import { youtubeService } from "../../services/youtube.service";

/**
 * Register YouTube IPC handlers
 */
export function registerYoutubeHandlers(): void {
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

  console.log("✅ YouTube handlers registered");
}
