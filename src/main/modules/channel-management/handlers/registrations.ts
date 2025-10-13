import { IpcRegistration } from '../../../../core/ipc/types';
import { youtubeService } from '../services/youtube.service';

export const youtubeRegistrations: IpcRegistration[] = [
  // ============= Base Channel Operations =============
  { channel: 'youtube:getAllChannels', description: 'Get all channels', handler: async () => { return await youtubeService.getAllChannels(); } },
  { channel: 'youtube:getChannelById', description: 'Get channel', handler: async (req: { id: string }) => { return await youtubeService.getChannelById((req as any).id); } },
  { channel: 'youtube:createChannel', description: 'Create channel', handler: async (req: any) => { return await youtubeService.createChannel(req); } },
  { channel: 'youtube:updateChannelMetrics', description: 'Update metrics', handler: async (req: { id: string; metrics: any }) => { return await youtubeService.updateChannelMetrics((req as any).id, (req as any).metrics); } },
  { channel: 'youtube:analyzeChannel', description: 'Analyze channel', handler: async (req: { id: string }) => { return await youtubeService.analyzeChannel((req as any).id); } },
  { channel: 'youtube:deleteChannel', description: 'Delete channel', handler: async (req: { id: string }) => { return await youtubeService.deleteChannel((req as any).id); } },
  
  // ============= Video Operations =============
  { channel: 'youtube:getAllVideos', description: 'Get all video analyses', handler: async () => { return await youtubeService.getAllVideoAnalyses(); } },
  { channel: 'youtube:getVideosByChannel', description: 'Get videos by channel', handler: async (req: { channelId: string }) => { return await youtubeService.getVideoAnalysesByChannel((req as any).channelId); } },
  { channel: 'youtube:analyzeVideo', description: 'Analyze video', handler: async (req: { videoId: string; channelId: string }) => { return await youtubeService.analyzeVideo((req as any).videoId, (req as any).channelId); } },
  
  // ============= Channel Deep Dive Operations =============
  { channel: 'youtube:getChannelDeepDive', description: 'Get channel deep dive', handler: async (req: { channelId: string }) => { return await youtubeService.getChannelDeepDive((req as any).channelId); } },
  { channel: 'youtube:upsertChannelDeepDive', description: 'Create/update deep dive', handler: async (req: { channelId: string; data: any }) => { return await youtubeService.upsertChannelDeepDive((req as any).channelId, (req as any).data); } },
  { channel: 'youtube:deleteChannelDeepDive', description: 'Delete deep dive', handler: async (req: { channelId: string }) => { return await youtubeService.deleteChannelDeepDive((req as any).channelId); } },
  
  // ============= Playlist Operations =============
  { channel: 'youtube:getChannelPlaylists', description: 'Get channel playlists', handler: async (req: { channelId: string }) => { return await youtubeService.getChannelPlaylists((req as any).channelId); } },
  { channel: 'youtube:createPlaylist', description: 'Create playlist', handler: async (req: any) => { return await youtubeService.createPlaylist(req); } },
  { channel: 'youtube:updatePlaylist', description: 'Update playlist', handler: async (req: { id: string; updates: any }) => { return await youtubeService.updatePlaylist((req as any).id, (req as any).updates); } },
  { channel: 'youtube:deletePlaylist', description: 'Delete playlist', handler: async (req: { id: string }) => { return await youtubeService.deletePlaylist((req as any).id); } },
  { channel: 'youtube:addVideoToPlaylist', description: 'Add video to playlist', handler: async (req: { playlistId: string; videoId: string; position?: number }) => { return await youtubeService.addVideoToPlaylist((req as any).playlistId, (req as any).videoId, (req as any).position); } },
  { channel: 'youtube:removeVideoFromPlaylist', description: 'Remove video from playlist', handler: async (req: { playlistId: string; videoId: string }) => { return await youtubeService.removeVideoFromPlaylist((req as any).playlistId, (req as any).videoId); } },
  { channel: 'youtube:getPlaylistVideos', description: 'Get playlist videos', handler: async (req: { playlistId: string }) => { return await youtubeService.getPlaylistVideos((req as any).playlistId); } },
  
  // ============= Competitor Operations =============
  { channel: 'youtube:getChannelCompetitors', description: 'Get channel competitors', handler: async (req: { channelId: string }) => { return await youtubeService.getChannelCompetitors((req as any).channelId); } },
  { channel: 'youtube:addCompetitor', description: 'Add competitor', handler: async (req: any) => { return await youtubeService.addCompetitor(req); } },
  { channel: 'youtube:updateCompetitor', description: 'Update competitor', handler: async (req: { id: string; updates: any }) => { return await youtubeService.updateCompetitor((req as any).id, (req as any).updates); } },
  { channel: 'youtube:deleteCompetitor', description: 'Delete competitor', handler: async (req: { id: string }) => { return await youtubeService.deleteCompetitor((req as any).id); } },
  { channel: 'youtube:updateCompetitorMetrics', description: 'Update competitor metrics', handler: async (req: { id: string; metrics: any }) => { return await youtubeService.updateCompetitorMetrics((req as any).id, (req as any).metrics); } },
  
  // ============= Performance Operations =============
  { channel: 'youtube:getChannelPerformance', description: 'Get channel performance', handler: async (req: { channelId: string; limit?: number }) => { return await youtubeService.getChannelPerformance((req as any).channelId, (req as any).limit); } },
  { channel: 'youtube:getPerformanceMetrics', description: 'Get performance metrics with growth', handler: async (req: { channelId: string }) => { return await youtubeService.getPerformanceMetrics((req as any).channelId); } },
  { channel: 'youtube:createPerformanceSnapshot', description: 'Create performance snapshot', handler: async (req: any) => { return await youtubeService.createPerformanceSnapshot(req); } },
  { channel: 'youtube:getPerformanceDateRange', description: 'Get performance date range', handler: async (req: { channelId: string; startDate: string; endDate: string }) => { return await youtubeService.getPerformanceDateRange((req as any).channelId, (req as any).startDate, (req as any).endDate); } },
  
  // ============= Topic Operations =============
  { channel: 'youtube:getChannelTopics', description: 'Get channel topics', handler: async (req: { channelId: string }) => { return await youtubeService.getChannelTopics((req as any).channelId); } },
  { channel: 'youtube:getUpcomingTopics', description: 'Get upcoming topics', handler: async (req: { channelId: string; limit?: number }) => { return await youtubeService.getUpcomingTopics((req as any).channelId, (req as any).limit); } },
  { channel: 'youtube:createTopic', description: 'Create topic', handler: async (req: any) => { return await youtubeService.createTopic(req); } },
  { channel: 'youtube:updateTopic', description: 'Update topic', handler: async (req: { id: string; updates: any }) => { return await youtubeService.updateTopic((req as any).id, (req as any).updates); } },
  { channel: 'youtube:deleteTopic', description: 'Delete topic', handler: async (req: { id: string }) => { return await youtubeService.deleteTopic((req as any).id); } },
  
  // ============= Complete View Operations =============
  { channel: 'youtube:getChannelCompleteView', description: 'Get complete channel view', handler: async (req: { channelId: string }) => { return await youtubeService.getChannelCompleteView((req as any).channelId); } },
];
