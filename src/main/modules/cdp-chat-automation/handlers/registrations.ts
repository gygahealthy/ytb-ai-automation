import { IpcRegistration } from '../../../../core/ipc/types';
import { chatAutomationService } from '../services/chat-automation.service';

export const chatAutomationRegistrations: IpcRegistration[] = [
  {
    channel: 'chatAutomation:init',
    description: 'Initialize chat session',
    handler: async (req: { profileId: string; provider: 'chatgpt' | 'gemini' }) => {
      const { profileId, provider } = req as any;
      return await chatAutomationService.initSession(profileId, provider);
    },
  },
  {
    channel: 'chatAutomation:closeSession',
    description: 'Close chat session',
    handler: async (req: { sessionId: string }) => {
      return await chatAutomationService.closeSession((req as any).sessionId);
    },
  },
  {
    channel: 'chatAutomation:getActiveSessions',
    description: 'Get active chat sessions',
    handler: async () => {
      const sessions = chatAutomationService.getActiveSessions();
      return { success: true, data: sessions };
    },
  },
];
