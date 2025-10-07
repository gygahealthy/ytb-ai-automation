import { sqliteDatabase } from "../../../storage/sqlite-database";
import { BaseRepository } from "../../../storage/repositories/base.repository";
import { VideoAnalysis, YoutubeChannel } from "../youtube.types";

interface YoutubeChannelRow {
  id: string;
  channel_id: string;
  channel_name: string;
  channel_url: string;
  subscriber_count: number | null;
  video_count: number | null;
  view_count: number | null;
  last_analyzed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface VideoAnalysisRow {
  id: string;
  video_id: string;
  video_title: string;
  video_url: string;
  channel_id: string;
  views: number;
  likes: number;
  comments: number;
  duration: number;
  published_at: string;
  analyzed_at: string;
  created_at: string;
}

/**
 * Repository for YoutubeChannel entities
 */
export class YoutubeChannelRepository extends BaseRepository<YoutubeChannel> {
  constructor() {
    super("youtube_channels", sqliteDatabase);
  }

  protected rowToEntity(row: YoutubeChannelRow): YoutubeChannel {
    const channel: YoutubeChannel = {
      id: row.id,
      channelId: row.channel_id,
      channelName: row.channel_name,
      channelUrl: row.channel_url,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    if (row.subscriber_count !== null) channel.subscriberCount = row.subscriber_count;
    if (row.video_count !== null) channel.videoCount = row.video_count;
    if (row.view_count !== null) channel.viewCount = row.view_count;
    if (row.last_analyzed_at) channel.lastAnalyzedAt = new Date(row.last_analyzed_at);

    return channel;
  }

  protected entityToRow(entity: Partial<YoutubeChannel>): Partial<YoutubeChannelRow> {
    const row: Partial<YoutubeChannelRow> = {};

    if (entity.id) row.id = entity.id;
    if (entity.channelId) row.channel_id = entity.channelId;
    if (entity.channelName) row.channel_name = entity.channelName;
    if (entity.channelUrl) row.channel_url = entity.channelUrl;

    if (entity.subscriberCount !== undefined) {
      row.subscriber_count = entity.subscriberCount ?? null;
    }
    if (entity.videoCount !== undefined) {
      row.video_count = entity.videoCount ?? null;
    }
    if (entity.viewCount !== undefined) {
      row.view_count = entity.viewCount ?? null;
    }
    if (entity.lastAnalyzedAt !== undefined) {
      row.last_analyzed_at = entity.lastAnalyzedAt ? entity.lastAnalyzedAt.toISOString() : null;
    }

    if (entity.createdAt) row.created_at = entity.createdAt.toISOString();
    if (entity.updatedAt) row.updated_at = entity.updatedAt.toISOString();

    return row;
  }

  /**
   * Find channel by channel ID
   */
  async findByChannelId(channelId: string): Promise<YoutubeChannel | null> {
    const row = await this.db.get<YoutubeChannelRow>(`SELECT * FROM ${this.tableName} WHERE channel_id = ?`, [channelId]);
    return row ? this.rowToEntity(row) : null;
  }

  /**
   * Update channel metrics
   */
  async updateMetrics(
    id: string,
    metrics: {
      subscriberCount?: number;
      videoCount?: number;
      viewCount?: number;
    }
  ): Promise<void> {
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (metrics.subscriberCount !== undefined) {
      updates.push("subscriber_count = ?");
      values.push(metrics.subscriberCount);
    }
    if (metrics.videoCount !== undefined) {
      updates.push("video_count = ?");
      values.push(metrics.videoCount);
    }
    if (metrics.viewCount !== undefined) {
      updates.push("view_count = ?");
      values.push(metrics.viewCount);
    }

    if (updates.length > 0) {
      updates.push("last_analyzed_at = ?", "updated_at = ?");
      const now = new Date().toISOString();
      values.push(now, now);

      await this.db.run(`UPDATE ${this.tableName} SET ${updates.join(", ")} WHERE id = ?`, [...values, id]);
    }
  }
}

/**
 * Repository for VideoAnalysis entities
 */
export class VideoAnalysisRepository extends BaseRepository<VideoAnalysis> {
  constructor() {
    super("youtube_video_analyses", sqliteDatabase);
  }

  protected rowToEntity(row: VideoAnalysisRow): VideoAnalysis {
    return {
      id: row.id,
      videoId: row.video_id,
      videoTitle: row.video_title,
      videoUrl: row.video_url,
      channelId: row.channel_id,
      views: row.views,
      likes: row.likes,
      comments: row.comments,
      duration: row.duration,
      publishedAt: new Date(row.published_at),
      analyzedAt: new Date(row.analyzed_at),
      createdAt: new Date(row.created_at),
    };
  }

  protected entityToRow(entity: Partial<VideoAnalysis>): Partial<VideoAnalysisRow> {
    const row: Partial<VideoAnalysisRow> = {};

    if (entity.id) row.id = entity.id;
    if (entity.videoId) row.video_id = entity.videoId;
    if (entity.videoTitle) row.video_title = entity.videoTitle;
    if (entity.videoUrl) row.video_url = entity.videoUrl;
    if (entity.channelId) row.channel_id = entity.channelId;
    if (entity.views !== undefined) row.views = entity.views;
    if (entity.likes !== undefined) row.likes = entity.likes;
    if (entity.comments !== undefined) row.comments = entity.comments;
    if (entity.duration !== undefined) row.duration = entity.duration;

    if (entity.publishedAt) row.published_at = entity.publishedAt.toISOString();
    if (entity.analyzedAt) row.analyzed_at = entity.analyzedAt.toISOString();
    if (entity.createdAt) row.created_at = entity.createdAt.toISOString();

    return row;
  }

  /**
   * Find video by video ID
   */
  async findByVideoId(videoId: string): Promise<VideoAnalysis | null> {
    const row = await this.db.get<VideoAnalysisRow>(`SELECT * FROM ${this.tableName} WHERE video_id = ?`, [videoId]);
    return row ? this.rowToEntity(row) : null;
  }

  /**
   * Find videos by channel ID
   */
  async findByChannelId(channelId: string): Promise<VideoAnalysis[]> {
    const rows = await this.db.all<VideoAnalysisRow>(
      `SELECT * FROM ${this.tableName} WHERE channel_id = ? ORDER BY published_at DESC`,
      [channelId]
    );
    return rows.map((row) => this.rowToEntity(row));
  }
}

export const youtubeChannelRepository = new YoutubeChannelRepository();
export const videoAnalysisRepository = new VideoAnalysisRepository();
