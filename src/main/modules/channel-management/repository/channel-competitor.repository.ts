import { database } from "../../../storage/database";
import { BaseRepository } from "../../../storage/repositories/base.repository";
import { ChannelCompetitor, CreateCompetitorInput, UpdateCompetitorInput } from "../youtube.types";
import { StringUtil } from "../../../../shared/utils/string";

interface ChannelCompetitorRow {
  id: string;
  channel_id: string;
  competitor_channel_id: string;
  competitor_name: string;
  competitor_url: string;
  subscriber_count: number | null;
  avg_views: number | null;
  upload_frequency: string | null;
  notes: string | null;
  last_analyzed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Repository for ChannelCompetitor entities
 */
export class ChannelCompetitorRepository extends BaseRepository<ChannelCompetitor> {
  constructor() {
    super("channel_competitors", database.getSQLiteDatabase());
  }

  protected rowToEntity(row: ChannelCompetitorRow): ChannelCompetitor {
    const competitor: ChannelCompetitor = {
      id: row.id,
      channelId: row.channel_id,
      competitorChannelId: row.competitor_channel_id,
      competitorName: row.competitor_name,
      competitorUrl: row.competitor_url,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    if (row.subscriber_count !== null) competitor.subscriberCount = row.subscriber_count;
    if (row.avg_views !== null) competitor.avgViews = row.avg_views;
    if (row.upload_frequency) competitor.uploadFrequency = row.upload_frequency;
    if (row.notes) competitor.notes = row.notes;
    if (row.last_analyzed_at) competitor.lastAnalyzedAt = new Date(row.last_analyzed_at);

    return competitor;
  }

  protected entityToRow(entity: Partial<ChannelCompetitor>): Partial<ChannelCompetitorRow> {
    const row: Partial<ChannelCompetitorRow> = {};

    if (entity.id) row.id = entity.id;
    if (entity.channelId) row.channel_id = entity.channelId;
    if (entity.competitorChannelId) row.competitor_channel_id = entity.competitorChannelId;
    if (entity.competitorName) row.competitor_name = entity.competitorName;
    if (entity.competitorUrl) row.competitor_url = entity.competitorUrl;
    if (entity.subscriberCount !== undefined) row.subscriber_count = entity.subscriberCount ?? null;
    if (entity.avgViews !== undefined) row.avg_views = entity.avgViews ?? null;
    if (entity.uploadFrequency !== undefined) row.upload_frequency = entity.uploadFrequency || null;
    if (entity.notes !== undefined) row.notes = entity.notes || null;
    if (entity.lastAnalyzedAt !== undefined) {
      row.last_analyzed_at = entity.lastAnalyzedAt ? entity.lastAnalyzedAt.toISOString() : null;
    }
    if (entity.createdAt) row.created_at = entity.createdAt.toISOString();
    if (entity.updatedAt) row.updated_at = entity.updatedAt.toISOString();

    return row;
  }

  /**
   * Find competitors by channel ID
   */
  async findByChannelId(channelId: string): Promise<ChannelCompetitor[]> {
    const rows = await this.db.all<ChannelCompetitorRow>(
      `SELECT * FROM ${this.tableName} WHERE channel_id = ? ORDER BY subscriber_count DESC`,
      [channelId]
    );
    return rows.map(row => this.rowToEntity(row));
  }

  /**
   * Create new competitor entry
   */
  async create(input: CreateCompetitorInput): Promise<ChannelCompetitor> {
    const now = new Date();
    const competitor: ChannelCompetitor = {
      id: StringUtil.generateId("competitor"),
      channelId: input.channelId,
      competitorChannelId: input.competitorChannelId,
      competitorName: input.competitorName,
      competitorUrl: input.competitorUrl,
      uploadFrequency: input.uploadFrequency,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    await this.insert(competitor);
    return competitor;
  }

  /**
   * Update competitor entry
   */
  async updateCompetitor(id: string, updates: UpdateCompetitorInput): Promise<ChannelCompetitor | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: Partial<ChannelCompetitor> = {
      ...updates,
      updatedAt: new Date(),
    };

    await this.update(id, updated);
    return this.findById(id);
  }

  /**
   * Update competitor metrics from analysis
   */
  async updateMetrics(
    id: string,
    metrics: {
      subscriberCount?: number;
      avgViews?: number;
    }
  ): Promise<ChannelCompetitor | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: Partial<ChannelCompetitor> = {
      ...metrics,
      lastAnalyzedAt: new Date(),
      updatedAt: new Date(),
    };

    await this.update(id, updated);
    return this.findById(id);
  }
}

// Export singleton instance
export const channelCompetitorRepository = new ChannelCompetitorRepository();
