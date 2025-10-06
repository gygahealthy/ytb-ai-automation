import { videoAnalysisRepository, youtubeChannelRepository } from "../../../../storage/database";
import { ApiResponse,  } from "../../../../types";
import { Logger } from "../../../../utils/logger.util";
import { StringUtil } from "../../../../utils/string.util";
import { CreateChannelInput, VideoAnalysis, YoutubeChannel } from "../youtube.types";

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
}

export const youtubeService = new YouTubeService();
