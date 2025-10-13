import { invoke } from './invoke';
import { ApiResponse } from '../../shared/types';
import { 
  YoutubeChannel, 
  CreateChannelInput,
  ChannelDeepDive,
  CreateDeepDiveInput,
  UpdateDeepDiveInput,
  ChannelPlaylist,
  CreatePlaylistInput,
  UpdatePlaylistInput,
  PlaylistVideo,
  ChannelCompetitor,
  CreateCompetitorInput,
  UpdateCompetitorInput,
  ChannelPerformance,
  CreatePerformanceInput,
  PerformanceMetrics,
  ChannelTopic,
  CreateTopicInput,
  UpdateTopicInput,
  ChannelCompleteView,
  VideoAnalysis
} from '../../main/modules/channel-management/youtube.types';

// ============= Base Channel API =============

export const getAllChannels = async (): Promise<ApiResponse<YoutubeChannel[]>> => {
  return invoke('youtube:getAllChannels');
};

export const getChannelById = async (id: string): Promise<ApiResponse<YoutubeChannel>> => {
  return invoke('youtube:getChannelById', { id });
};

export const createChannel = async (input: CreateChannelInput): Promise<ApiResponse<YoutubeChannel>> => {
  return invoke('youtube:createChannel', input);
};

export const updateChannelMetrics = async (
  id: string, 
  metrics: { subscriberCount: number; videoCount: number; viewCount: number }
): Promise<ApiResponse<YoutubeChannel>> => {
  return invoke('youtube:updateChannelMetrics', { id, metrics });
};

export const analyzeChannel = async (id: string): Promise<ApiResponse<YoutubeChannel>> => {
  return invoke('youtube:analyzeChannel', { id });
};

export const deleteChannel = async (id: string): Promise<ApiResponse<boolean>> => {
  return invoke('youtube:deleteChannel', { id });
};

// ============= Video API =============

export const getAllVideos = async (): Promise<ApiResponse<VideoAnalysis[]>> => {
  return invoke('youtube:getAllVideos');
};

export const getVideosByChannel = async (channelId: string): Promise<ApiResponse<VideoAnalysis[]>> => {
  return invoke('youtube:getVideosByChannel', { channelId });
};

export const analyzeVideo = async (videoId: string, channelId: string): Promise<ApiResponse<VideoAnalysis>> => {
  return invoke('youtube:analyzeVideo', { videoId, channelId });
};

// ============= Channel Deep Dive API =============

export const getChannelDeepDive = async (channelId: string): Promise<ApiResponse<ChannelDeepDive>> => {
  return invoke('youtube:getChannelDeepDive', { channelId });
};

export const upsertChannelDeepDive = async (
  channelId: string, 
  data: CreateDeepDiveInput | UpdateDeepDiveInput
): Promise<ApiResponse<ChannelDeepDive>> => {
  return invoke('youtube:upsertChannelDeepDive', { channelId, data });
};

export const deleteChannelDeepDive = async (channelId: string): Promise<ApiResponse<boolean>> => {
  return invoke('youtube:deleteChannelDeepDive', { channelId });
};

// ============= Playlist API =============

export const getChannelPlaylists = async (channelId: string): Promise<ApiResponse<ChannelPlaylist[]>> => {
  return invoke('youtube:getChannelPlaylists', { channelId });
};

export const createPlaylist = async (input: CreatePlaylistInput): Promise<ApiResponse<ChannelPlaylist>> => {
  return invoke('youtube:createPlaylist', input);
};

export const updatePlaylist = async (
  id: string, 
  updates: UpdatePlaylistInput
): Promise<ApiResponse<ChannelPlaylist>> => {
  return invoke('youtube:updatePlaylist', { id, updates });
};

export const deletePlaylist = async (id: string): Promise<ApiResponse<boolean>> => {
  return invoke('youtube:deletePlaylist', { id });
};

export const addVideoToPlaylist = async (
  playlistId: string, 
  videoId: string, 
  position?: number
): Promise<ApiResponse<PlaylistVideo>> => {
  return invoke('youtube:addVideoToPlaylist', { playlistId, videoId, position });
};

export const removeVideoFromPlaylist = async (
  playlistId: string, 
  videoId: string
): Promise<ApiResponse<boolean>> => {
  return invoke('youtube:removeVideoFromPlaylist', { playlistId, videoId });
};

export const getPlaylistVideos = async (playlistId: string): Promise<ApiResponse<PlaylistVideo[]>> => {
  return invoke('youtube:getPlaylistVideos', { playlistId });
};

// ============= Competitor API =============

export const getChannelCompetitors = async (channelId: string): Promise<ApiResponse<ChannelCompetitor[]>> => {
  return invoke('youtube:getChannelCompetitors', { channelId });
};

export const addCompetitor = async (input: CreateCompetitorInput): Promise<ApiResponse<ChannelCompetitor>> => {
  return invoke('youtube:addCompetitor', input);
};

export const updateCompetitor = async (
  id: string, 
  updates: UpdateCompetitorInput
): Promise<ApiResponse<ChannelCompetitor>> => {
  return invoke('youtube:updateCompetitor', { id, updates });
};

export const deleteCompetitor = async (id: string): Promise<ApiResponse<boolean>> => {
  return invoke('youtube:deleteCompetitor', { id });
};

export const updateCompetitorMetrics = async (
  id: string, 
  metrics: { subscriberCount?: number; avgViews?: number }
): Promise<ApiResponse<ChannelCompetitor>> => {
  return invoke('youtube:updateCompetitorMetrics', { id, metrics });
};

// ============= Performance API =============

export const getChannelPerformance = async (
  channelId: string, 
  limit?: number
): Promise<ApiResponse<ChannelPerformance[]>> => {
  return invoke('youtube:getChannelPerformance', { channelId, limit });
};

export const getPerformanceMetrics = async (channelId: string): Promise<ApiResponse<PerformanceMetrics>> => {
  return invoke('youtube:getPerformanceMetrics', { channelId });
};

export const createPerformanceSnapshot = async (
  input: CreatePerformanceInput
): Promise<ApiResponse<ChannelPerformance>> => {
  return invoke('youtube:createPerformanceSnapshot', input);
};

export const getPerformanceDateRange = async (
  channelId: string, 
  startDate: string, 
  endDate: string
): Promise<ApiResponse<ChannelPerformance[]>> => {
  return invoke('youtube:getPerformanceDateRange', { channelId, startDate, endDate });
};

// ============= Topic API =============

export const getChannelTopics = async (channelId: string): Promise<ApiResponse<ChannelTopic[]>> => {
  return invoke('youtube:getChannelTopics', { channelId });
};

export const getUpcomingTopics = async (
  channelId: string, 
  limit?: number
): Promise<ApiResponse<ChannelTopic[]>> => {
  return invoke('youtube:getUpcomingTopics', { channelId, limit });
};

export const createTopic = async (input: CreateTopicInput): Promise<ApiResponse<ChannelTopic>> => {
  return invoke('youtube:createTopic', input);
};

export const updateTopic = async (
  id: string, 
  updates: UpdateTopicInput
): Promise<ApiResponse<ChannelTopic>> => {
  return invoke('youtube:updateTopic', { id, updates });
};

export const deleteTopic = async (id: string): Promise<ApiResponse<boolean>> => {
  return invoke('youtube:deleteTopic', { id });
};

// ============= Complete View API =============

export const getChannelCompleteView = async (channelId: string): Promise<ApiResponse<ChannelCompleteView>> => {
  return invoke('youtube:getChannelCompleteView', { channelId });
};
