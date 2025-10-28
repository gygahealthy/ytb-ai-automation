import { videoAnalysisRepository, youtubeChannelRepository } from "../repository/youtube.repository";
import { ApiResponse } from "../../../../shared/types";
import { Logger } from "../../../../shared/utils/logger";
import { StringUtil } from "../../../../shared/utils/string";
import {
  CreateChannelInput,
  VideoAnalysis,
  YoutubeChannel,
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
} from "../youtube.types";
import { channelDeepDiveRepository } from "../repository/channel-deep-dive.repository";
import { channelPlaylistRepository } from "../repository/channel-playlist.repository";
import { channelCompetitorRepository } from "../repository/channel-competitor.repository";
import { channelPerformanceRepository } from "../repository/channel-performance.repository";
import { channelTopicRepository } from "../repository/channel-topic.repository";
import { promptRepository } from "../../master-prompt-management/repository/master-prompt.repository";

const logger = new Logger("YouTubeService");

export class YouTubeService {
  // ============= Channel Methods =============

  /**
   * Get all channels
   */
  async getAllChannels(): Promise<ApiResponse<YoutubeChannel[]>> {
    try {
      const channels = await youtubeChannelRepository.findAll();
      return { success: true, data: channels };
    } catch (error) {
      logger.error("Failed to get channels", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get channel by ID
   */
  async getChannelById(id: string): Promise<ApiResponse<YoutubeChannel>> {
    try {
      const channel = await youtubeChannelRepository.findById(id);
      if (!channel) {
        return { success: false, error: "Channel not found" };
      }
      return { success: true, data: channel };
    } catch (error) {
      logger.error("Failed to get channel", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Create new channel
   */
  async createChannel(input: CreateChannelInput): Promise<ApiResponse<YoutubeChannel>> {
    try {
      const channel: YoutubeChannel = {
        id: StringUtil.generateId("channel"),
        channelId: input.channelId,
        channelName: input.channelName,
        channelUrl: input.channelUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await youtubeChannelRepository.insert(channel);
      logger.info(`Channel created: ${channel.id}`);

      return { success: true, data: channel };
    } catch (error) {
      logger.error("Failed to create channel", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Update channel metrics
   */
  async updateChannelMetrics(
    id: string,
    metrics: {
      subscriberCount: number;
      videoCount: number;
      viewCount: number;
    }
  ): Promise<ApiResponse<YoutubeChannel>> {
    try {
      if (!(await youtubeChannelRepository.exists(id))) {
        return { success: false, error: "Channel not found" };
      }

      await youtubeChannelRepository.updateMetrics(id, metrics);
      const updatedChannel = await youtubeChannelRepository.findById(id);

      logger.info(`Channel metrics updated: ${id}`);
      return { success: true, data: updatedChannel! };
    } catch (error) {
      logger.error("Failed to update channel metrics", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Analyze channel via API
   * This would call YouTube API to get channel data
   */
  async analyzeChannel(id: string): Promise<ApiResponse<YoutubeChannel>> {
    try {
      const channel = await youtubeChannelRepository.findById(id);
      if (!channel) {
        return { success: false, error: "Channel not found" };
      }

      // TODO: Call YouTube API here
      // For now, just update the last analyzed timestamp
      await youtubeChannelRepository.update(id, {
        lastAnalyzedAt: new Date(),
        updatedAt: new Date(),
      });

      const updatedChannel = await youtubeChannelRepository.findById(id);
      logger.info(`Channel analyzed: ${id}`);
      return { success: true, data: updatedChannel! };
    } catch (error) {
      logger.error("Failed to analyze channel", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete channel
   */
  async deleteChannel(id: string): Promise<ApiResponse<boolean>> {
    try {
      if (!(await youtubeChannelRepository.exists(id))) {
        return { success: false, error: "Channel not found" };
      }

      await youtubeChannelRepository.delete(id);
      logger.info(`Channel deleted: ${id}`);
      return { success: true, data: true };
    } catch (error) {
      logger.error("Failed to delete channel", error);
      return { success: false, error: String(error) };
    }
  }

  // ============= Video Analysis Methods =============

  /**
   * Get all video analyses
   */
  async getAllVideoAnalyses(): Promise<ApiResponse<VideoAnalysis[]>> {
    try {
      const videos = await videoAnalysisRepository.findAll();
      return { success: true, data: videos };
    } catch (error) {
      logger.error("Failed to get video analyses", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get video analyses for a channel
   */
  async getVideoAnalysesByChannel(channelId: string): Promise<ApiResponse<VideoAnalysis[]>> {
    try {
      const videos = await videoAnalysisRepository.findByChannelId(channelId);
      return { success: true, data: videos };
    } catch (error) {
      logger.error("Failed to get video analyses by channel", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Create video analysis
   */
  async createVideoAnalysis(data: Omit<VideoAnalysis, "id" | "createdAt">): Promise<ApiResponse<VideoAnalysis>> {
    try {
      const analysis: VideoAnalysis = {
        ...data,
        id: StringUtil.generateId("video"),
        createdAt: new Date(),
      };

      await videoAnalysisRepository.insert(analysis);
      logger.info(`Video analysis created: ${analysis.id}`);

      return { success: true, data: analysis };
    } catch (error) {
      logger.error("Failed to create video analysis", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Analyze video via API
   * This would call YouTube API to get video data
   */
  async analyzeVideo(videoId: string, channelId: string): Promise<ApiResponse<VideoAnalysis>> {
    try {
      // TODO: Call YouTube API here to get video data
      // For now, create a mock analysis
      const analysis = await this.createVideoAnalysis({
        videoId,
        videoTitle: "Video Title",
        videoUrl: `https://youtube.com/watch?v=${videoId}`,
        channelId,
        views: 0,
        likes: 0,
        comments: 0,
        duration: 0,
        publishedAt: new Date(),
        analyzedAt: new Date(),
      });

      logger.info(`Video analyzed: ${videoId}`);
      return analysis;
    } catch (error) {
      logger.error("Failed to analyze video", error);
      return { success: false, error: String(error) };
    }
  }

  // ============= Channel Deep Dive Methods =============

  /**
   * Get channel deep dive data
   */
  async getChannelDeepDive(channelId: string): Promise<ApiResponse<ChannelDeepDive>> {
    try {
      const deepDive = await channelDeepDiveRepository.findByChannelId(channelId);
      if (!deepDive) {
        return { success: false, error: "Deep dive not found for this channel" };
      }
      return { success: true, data: deepDive };
    } catch (error) {
      logger.error("Failed to get channel deep dive", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Create or update channel deep dive
   */
  async upsertChannelDeepDive(
    channelId: string,
    input: CreateDeepDiveInput | UpdateDeepDiveInput
  ): Promise<ApiResponse<ChannelDeepDive>> {
    try {
      const existing = await channelDeepDiveRepository.findByChannelId(channelId);

      let deepDive: ChannelDeepDive | null;
      if (existing) {
        deepDive = await channelDeepDiveRepository.updateByChannelId(channelId, input);
        logger.info(`Channel deep dive updated: ${channelId}`);
      } else {
        deepDive = await channelDeepDiveRepository.create({ ...input, channelId });
        logger.info(`Channel deep dive created: ${channelId}`);
      }

      return { success: true, data: deepDive! };
    } catch (error) {
      logger.error("Failed to upsert channel deep dive", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete channel deep dive
   */
  async deleteChannelDeepDive(channelId: string): Promise<ApiResponse<boolean>> {
    try {
      const result = await channelDeepDiveRepository.deleteByChannelId(channelId);
      return { success: true, data: result };
    } catch (error) {
      logger.error("Failed to delete channel deep dive", error);
      return { success: false, error: String(error) };
    }
  }

  // ============= Playlist Methods =============

  /**
   * Get playlists for a channel
   */
  async getChannelPlaylists(channelId: string): Promise<ApiResponse<ChannelPlaylist[]>> {
    try {
      const playlists = await channelPlaylistRepository.findByChannelId(channelId);
      return { success: true, data: playlists };
    } catch (error) {
      logger.error("Failed to get channel playlists", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Create new playlist
   */
  async createPlaylist(input: CreatePlaylistInput): Promise<ApiResponse<ChannelPlaylist>> {
    try {
      const playlist = await channelPlaylistRepository.create(input);
      logger.info(`Playlist created: ${playlist.id}`);
      return { success: true, data: playlist };
    } catch (error) {
      logger.error("Failed to create playlist", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Update playlist
   */
  async updatePlaylist(id: string, updates: UpdatePlaylistInput): Promise<ApiResponse<ChannelPlaylist>> {
    try {
      const playlist = await channelPlaylistRepository.updatePlaylist(id, updates);
      if (!playlist) {
        return { success: false, error: "Playlist not found" };
      }
      logger.info(`Playlist updated: ${id}`);
      return { success: true, data: playlist };
    } catch (error) {
      logger.error("Failed to update playlist", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete playlist
   */
  async deletePlaylist(id: string): Promise<ApiResponse<boolean>> {
    try {
      await channelPlaylistRepository.delete(id);
      logger.info(`Playlist deleted: ${id}`);
      return { success: true, data: true };
    } catch (error) {
      logger.error("Failed to delete playlist", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Add video to playlist
   */
  async addVideoToPlaylist(playlistId: string, videoId: string, position?: number): Promise<ApiResponse<PlaylistVideo>> {
    try {
      const playlistVideo = await channelPlaylistRepository.addVideoToPlaylist(playlistId, videoId, position);
      logger.info(`Video added to playlist: ${playlistId}`);
      return { success: true, data: playlistVideo };
    } catch (error) {
      logger.error("Failed to add video to playlist", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Remove video from playlist
   */
  async removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<ApiResponse<boolean>> {
    try {
      const result = await channelPlaylistRepository.removeVideoFromPlaylist(playlistId, videoId);
      logger.info(`Video removed from playlist: ${playlistId}`);
      return { success: true, data: result };
    } catch (error) {
      logger.error("Failed to remove video from playlist", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get videos in playlist
   */
  async getPlaylistVideos(playlistId: string): Promise<ApiResponse<PlaylistVideo[]>> {
    try {
      const videos = await channelPlaylistRepository.getPlaylistVideos(playlistId);
      return { success: true, data: videos };
    } catch (error) {
      logger.error("Failed to get playlist videos", error);
      return { success: false, error: String(error) };
    }
  }

  // ============= Competitor Methods =============

  /**
   * Get competitors for a channel
   */
  async getChannelCompetitors(channelId: string): Promise<ApiResponse<ChannelCompetitor[]>> {
    try {
      const competitors = await channelCompetitorRepository.findByChannelId(channelId);
      return { success: true, data: competitors };
    } catch (error) {
      logger.error("Failed to get channel competitors", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Add competitor
   */
  async addCompetitor(input: CreateCompetitorInput): Promise<ApiResponse<ChannelCompetitor>> {
    try {
      const competitor = await channelCompetitorRepository.create(input);
      logger.info(`Competitor added: ${competitor.id}`);
      return { success: true, data: competitor };
    } catch (error) {
      logger.error("Failed to add competitor", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Update competitor
   */
  async updateCompetitor(id: string, updates: UpdateCompetitorInput): Promise<ApiResponse<ChannelCompetitor>> {
    try {
      const competitor = await channelCompetitorRepository.updateCompetitor(id, updates);
      if (!competitor) {
        return { success: false, error: "Competitor not found" };
      }
      logger.info(`Competitor updated: ${id}`);
      return { success: true, data: competitor };
    } catch (error) {
      logger.error("Failed to update competitor", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete competitor
   */
  async deleteCompetitor(id: string): Promise<ApiResponse<boolean>> {
    try {
      await channelCompetitorRepository.delete(id);
      logger.info(`Competitor deleted: ${id}`);
      return { success: true, data: true };
    } catch (error) {
      logger.error("Failed to delete competitor", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Update competitor metrics (from analysis)
   */
  async updateCompetitorMetrics(
    id: string,
    metrics: { subscriberCount?: number; avgViews?: number }
  ): Promise<ApiResponse<ChannelCompetitor>> {
    try {
      const competitor = await channelCompetitorRepository.updateMetrics(id, metrics);
      if (!competitor) {
        return { success: false, error: "Competitor not found" };
      }
      logger.info(`Competitor metrics updated: ${id}`);
      return { success: true, data: competitor };
    } catch (error) {
      logger.error("Failed to update competitor metrics", error);
      return { success: false, error: String(error) };
    }
  }

  // ============= Performance Methods =============

  /**
   * Get channel performance history
   */
  async getChannelPerformance(channelId: string, limit?: number): Promise<ApiResponse<ChannelPerformance[]>> {
    try {
      const performance = await channelPerformanceRepository.findByChannelId(channelId, limit);
      return { success: true, data: performance };
    } catch (error) {
      logger.error("Failed to get channel performance", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get latest performance with growth metrics
   */
  async getPerformanceMetrics(channelId: string): Promise<ApiResponse<PerformanceMetrics>> {
    try {
      const metrics = await channelPerformanceRepository.getMetricsWithGrowth(channelId);
      if (!metrics) {
        return { success: false, error: "No performance data found" };
      }
      return { success: true, data: metrics };
    } catch (error) {
      logger.error("Failed to get performance metrics", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Create performance snapshot
   */
  async createPerformanceSnapshot(input: CreatePerformanceInput): Promise<ApiResponse<ChannelPerformance>> {
    try {
      const performance = await channelPerformanceRepository.create(input);
      logger.info(`Performance snapshot created for channel: ${input.channelId}`);
      return { success: true, data: performance };
    } catch (error) {
      logger.error("Failed to create performance snapshot", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get performance for date range
   */
  async getPerformanceDateRange(
    channelId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<ChannelPerformance[]>> {
    try {
      const performance = await channelPerformanceRepository.getDateRange(channelId, startDate, endDate);
      return { success: true, data: performance };
    } catch (error) {
      logger.error("Failed to get performance date range", error);
      return { success: false, error: String(error) };
    }
  }

  // ============= Topic Methods =============

  /**
   * Get topics for a channel
   */
  async getChannelTopics(channelId: string): Promise<ApiResponse<ChannelTopic[]>> {
    try {
      const topics = await channelTopicRepository.findByChannelId(channelId);
      return { success: true, data: topics };
    } catch (error) {
      logger.error("Failed to get channel topics", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get upcoming topics
   */
  async getUpcomingTopics(channelId: string, limit?: number): Promise<ApiResponse<ChannelTopic[]>> {
    try {
      const topics = await channelTopicRepository.getUpcoming(channelId, limit);
      return { success: true, data: topics };
    } catch (error) {
      logger.error("Failed to get upcoming topics", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Create topic
   */
  async createTopic(input: CreateTopicInput): Promise<ApiResponse<ChannelTopic>> {
    try {
      const topic = await channelTopicRepository.create(input);
      logger.info(`Topic created: ${topic.id}`);
      return { success: true, data: topic };
    } catch (error) {
      logger.error("Failed to create topic", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Update topic
   */
  async updateTopic(id: string, updates: UpdateTopicInput): Promise<ApiResponse<ChannelTopic>> {
    try {
      const topic = await channelTopicRepository.updateTopic(id, updates);
      if (!topic) {
        return { success: false, error: "Topic not found" };
      }
      logger.info(`Topic updated: ${id}`);
      return { success: true, data: topic };
    } catch (error) {
      logger.error("Failed to update topic", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete topic
   */
  async deleteTopic(id: string): Promise<ApiResponse<boolean>> {
    try {
      await channelTopicRepository.delete(id);
      logger.info(`Topic deleted: ${id}`);
      return { success: true, data: true };
    } catch (error) {
      logger.error("Failed to delete topic", error);
      return { success: false, error: String(error) };
    }
  }

  // ============= Complete View Methods =============

  /**
   * Get complete channel view with all related data
   */
  async getChannelCompleteView(channelId: string): Promise<ApiResponse<ChannelCompleteView>> {
    try {
      // Get base channel
      const channel = await youtubeChannelRepository.findByChannelId(channelId);
      if (!channel) {
        return { success: false, error: "Channel not found" };
      }

      // Get all related data in parallel
      const [deepDive, playlists, competitors, performanceMetrics, recentVideos, upcomingTopics, assignedPromptsCount] =
        await Promise.all([
          channelDeepDiveRepository.findByChannelId(channelId),
          channelPlaylistRepository.findByChannelId(channelId),
          channelCompetitorRepository.findByChannelId(channelId),
          channelPerformanceRepository.getMetricsWithGrowth(channelId),
          videoAnalysisRepository.findByChannelId(channelId),
          channelTopicRepository.getUpcoming(channelId, 10),
          promptRepository.countByChannelId(channelId),
        ]);

      const completeView: ChannelCompleteView = {
        channel,
        deepDive: deepDive || undefined,
        playlists,
        competitors,
        performance: performanceMetrics || undefined,
        recentVideos: recentVideos.slice(0, 10), // Latest 10 videos
        upcomingTopics,
        assignedPrompts: assignedPromptsCount,
      };

      return { success: true, data: completeView };
    } catch (error) {
      logger.error("Failed to get channel complete view", error);
      return { success: false, error: String(error) };
    }
  }
}

export const youtubeService = new YouTubeService();
