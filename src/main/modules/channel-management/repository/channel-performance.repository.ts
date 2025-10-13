import { database } from "../../../storage/database";
import { BaseRepository } from "../../../storage/repositories/base.repository";
import { ChannelPerformance, CreatePerformanceInput, PerformanceMetrics } from "../youtube.types";
import { StringUtil } from "../../../../shared/utils/string";

interface ChannelPerformanceRow {
  id: string;
  channel_id: string;
  metric_date: string;
  subscriber_count: number;
  total_views: number;
  video_count: number;
  avg_views_per_video: number | null;
  engagement_rate: number | null;
  daily_views: number | null;
  daily_subscribers: number | null;
  created_at: string;
}

/**
 * Repository for ChannelPerformance entities
 */
export class ChannelPerformanceRepository extends BaseRepository<ChannelPerformance> {
  constructor() {
    super("channel_performance_metrics", database.getSQLiteDatabase());
  }

  protected rowToEntity(row: ChannelPerformanceRow): ChannelPerformance {
    const performance: ChannelPerformance = {
      id: row.id,
      channelId: row.channel_id,
      metricDate: row.metric_date,
      subscriberCount: row.subscriber_count,
      totalViews: row.total_views,
      videoCount: row.video_count,
      createdAt: new Date(row.created_at),
    };

    if (row.avg_views_per_video !== null) performance.avgViewsPerVideo = row.avg_views_per_video;
    if (row.engagement_rate !== null) performance.engagementRate = row.engagement_rate;
    if (row.daily_views !== null) performance.dailyViews = row.daily_views;
    if (row.daily_subscribers !== null) performance.dailySubscribers = row.daily_subscribers;

    return performance;
  }

  protected entityToRow(entity: Partial<ChannelPerformance>): Partial<ChannelPerformanceRow> {
    const row: Partial<ChannelPerformanceRow> = {};

    if (entity.id) row.id = entity.id;
    if (entity.channelId) row.channel_id = entity.channelId;
    if (entity.metricDate) row.metric_date = entity.metricDate;
    if (entity.subscriberCount !== undefined) row.subscriber_count = entity.subscriberCount;
    if (entity.totalViews !== undefined) row.total_views = entity.totalViews;
    if (entity.videoCount !== undefined) row.video_count = entity.videoCount;
    if (entity.avgViewsPerVideo !== undefined) row.avg_views_per_video = entity.avgViewsPerVideo ?? null;
    if (entity.engagementRate !== undefined) row.engagement_rate = entity.engagementRate ?? null;
    if (entity.dailyViews !== undefined) row.daily_views = entity.dailyViews ?? null;
    if (entity.dailySubscribers !== undefined) row.daily_subscribers = entity.dailySubscribers ?? null;
    if (entity.createdAt) row.created_at = entity.createdAt.toISOString();

    return row;
  }

  /**
   * Find performance records by channel ID
   */
  async findByChannelId(channelId: string, limit?: number): Promise<ChannelPerformance[]> {
    const sql = limit
      ? `SELECT * FROM ${this.tableName} WHERE channel_id = ? ORDER BY metric_date DESC LIMIT ?`
      : `SELECT * FROM ${this.tableName} WHERE channel_id = ? ORDER BY metric_date DESC`;
    
    const params = limit ? [channelId, limit] : [channelId];
    const rows = await this.db.all<ChannelPerformanceRow>(sql, params);
    return rows.map(row => this.rowToEntity(row));
  }

  /**
   * Get latest performance for channel
   */
  async getLatest(channelId: string): Promise<ChannelPerformance | null> {
    const row = await this.db.get<ChannelPerformanceRow>(
      `SELECT * FROM ${this.tableName} WHERE channel_id = ? ORDER BY metric_date DESC LIMIT 1`,
      [channelId]
    );
    return row ? this.rowToEntity(row) : null;
  }

  /**
   * Get performance metrics with growth calculations
   */
  async getMetricsWithGrowth(channelId: string): Promise<PerformanceMetrics | null> {
    const records = await this.findByChannelId(channelId, 2);
    
    if (records.length === 0) return null;

    const current = records[0];
    const previous = records.length > 1 ? records[1] : undefined;

    const growth = {
      subscribers: previous ? current.subscriberCount - previous.subscriberCount : 0,
      views: previous ? current.totalViews - previous.totalViews : 0,
      videos: previous ? current.videoCount - previous.videoCount : 0,
    };

    return {
      current,
      previous,
      growth,
    };
  }

  /**
   * Create new performance snapshot
   */
  async create(input: CreatePerformanceInput): Promise<ChannelPerformance> {
    const performance: ChannelPerformance = {
      id: StringUtil.generateId("perf"),
      channelId: input.channelId,
      metricDate: input.metricDate,
      subscriberCount: input.subscriberCount,
      totalViews: input.totalViews,
      videoCount: input.videoCount,
      avgViewsPerVideo: input.avgViewsPerVideo,
      engagementRate: input.engagementRate,
      dailyViews: input.dailyViews,
      dailySubscribers: input.dailySubscribers,
      createdAt: new Date(),
    };

    await this.insert(performance);
    return performance;
  }

  /**
   * Get performance for date range
   */
  async getDateRange(channelId: string, startDate: string, endDate: string): Promise<ChannelPerformance[]> {
    const rows = await this.db.all<ChannelPerformanceRow>(
      `SELECT * FROM ${this.tableName} 
       WHERE channel_id = ? AND metric_date >= ? AND metric_date <= ?
       ORDER BY metric_date ASC`,
      [channelId, startDate, endDate]
    );
    return rows.map(row => this.rowToEntity(row));
  }

  /**
   * Delete old performance records (keep recent N days)
   */
  async cleanupOldRecords(channelId: string, keepDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);
    const cutoffStr = cutoffDate.toISOString().split('T')[0]; // YYYY-MM-DD

    const result = await this.db.run(
      `DELETE FROM ${this.tableName} WHERE channel_id = ? AND metric_date < ?`,
      [channelId, cutoffStr]
    );

    return result.changes || 0;
  }
}

// Export singleton instance
export const channelPerformanceRepository = new ChannelPerformanceRepository();
