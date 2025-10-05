import { ipcMain } from "electron";
import { chatAutomationService } from "../../services/chat-automation/chat-automation.service";

/**
 * Register Chat Automation IPC handlers
 */
export function registerChatAutomationHandlers(): void {
  // Initialize chat session
  ipcMain.handle("chatAutomation:init", async (_, profileId: string, provider: "chatgpt" | "gemini") => {
    return await chatAutomationService.initSession(profileId, provider);
  });

  // Send message
  ipcMain.handle("chatAutomation:sendMessage", async (_, sessionId: string, message: string) => {
    return await chatAutomationService.sendMessage(sessionId, message);
  });

  // Close session
  ipcMain.handle("chatAutomation:closeSession", async (_, sessionId: string) => {
    return await chatAutomationService.closeSession(sessionId);
  });

  // Get active sessions
  ipcMain.handle("chatAutomation:getActiveSessions", async () => {
    const sessions = chatAutomationService.getActiveSessions();
    return { success: true, data: sessions };
  });

  console.log("✅ Chat Automation handlers registered");
}
