import { IpcRegistration } from '../../../../core/ipc/types';
import { youtubeService } from '../services/youtube.service';

export const youtubeRegistrations: IpcRegistration[] = [
  { channel: 'youtube:getAllChannels', description: 'Get all channels', handler: async () => { return await youtubeService.getAllChannels(); } },
  { channel: 'youtube:getChannelById', description: 'Get channel', handler: async (req: { id: string }) => { return await youtubeService.getChannelById((req as any).id); } },
  { channel: 'youtube:createChannel', description: 'Create channel', handler: async (req: any) => { return await youtubeService.createChannel(req); } },
  { channel: 'youtube:updateChannelMetrics', description: 'Update metrics', handler: async (req: { id: string; metrics: any }) => { return await youtubeService.updateChannelMetrics((req as any).id, (req as any).metrics); } },
  { channel: 'youtube:analyzeChannel', description: 'Analyze channel', handler: async (req: { id: string }) => { return await youtubeService.analyzeChannel((req as any).id); } },
  { channel: 'youtube:deleteChannel', description: 'Delete channel', handler: async (req: { id: string }) => { return await youtubeService.deleteChannel((req as any).id); } },
  { channel: 'youtube:getAllVideos', description: 'Get all video analyses', handler: async () => { return await youtubeService.getAllVideoAnalyses(); } },
  { channel: 'youtube:getVideosByChannel', description: 'Get videos by channel', handler: async (req: { channelId: string }) => { return await youtubeService.getVideoAnalysesByChannel((req as any).channelId); } },
  { channel: 'youtube:analyzeVideo', description: 'Analyze video', handler: async (req: { videoId: string; channelId: string }) => { return await youtubeService.analyzeVideo((req as any).videoId, (req as any).channelId); } },
];
