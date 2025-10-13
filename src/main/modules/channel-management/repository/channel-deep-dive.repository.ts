import { database } from "../../../storage/database";
import { BaseRepository } from "../../../storage/repositories/base.repository";
import { ChannelDeepDive, CreateDeepDiveInput, UpdateDeepDiveInput, TargetAudience, ChannelGoal } from "../youtube.types";
import { StringUtil } from "../../../../shared/utils/string";

interface ChannelDeepDiveRow {
  id: string;
  channel_id: string;
  strategy_markdown: string | null;
  usp_markdown: string | null;
  target_audience: string | null;
  content_pillars: string | null;
  tone_and_style: string | null;
  goals: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Repository for ChannelDeepDive entities
 */
export class ChannelDeepDiveRepository extends BaseRepository<ChannelDeepDive> {
  constructor() {
    super("channel_deep_dive", database.getSQLiteDatabase());
  }

  protected rowToEntity(row: ChannelDeepDiveRow): ChannelDeepDive {
    const deepDive: ChannelDeepDive = {
      id: row.id,
      channelId: row.channel_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    if (row.strategy_markdown) deepDive.strategyMarkdown = row.strategy_markdown;
    if (row.usp_markdown) deepDive.uspMarkdown = row.usp_markdown;
    if (row.target_audience) deepDive.targetAudience = this.parseJson<TargetAudience>(row.target_audience);
    if (row.content_pillars) deepDive.contentPillars = this.parseJson<string[]>(row.content_pillars);
    if (row.tone_and_style) deepDive.toneAndStyle = row.tone_and_style;
    if (row.goals) deepDive.goals = this.parseJson<ChannelGoal[]>(row.goals);
    if (row.notes) deepDive.notes = row.notes;

    return deepDive;
  }

  protected entityToRow(entity: Partial<ChannelDeepDive>): Partial<ChannelDeepDiveRow> {
    const row: Partial<ChannelDeepDiveRow> = {};

    if (entity.id) row.id = entity.id;
    if (entity.channelId) row.channel_id = entity.channelId;
    if (entity.strategyMarkdown !== undefined) row.strategy_markdown = entity.strategyMarkdown || null;
    if (entity.uspMarkdown !== undefined) row.usp_markdown = entity.uspMarkdown || null;
    if (entity.targetAudience !== undefined) row.target_audience = entity.targetAudience ? JSON.stringify(entity.targetAudience) : null;
    if (entity.contentPillars !== undefined) row.content_pillars = entity.contentPillars ? JSON.stringify(entity.contentPillars) : null;
    if (entity.toneAndStyle !== undefined) row.tone_and_style = entity.toneAndStyle || null;
    if (entity.goals !== undefined) row.goals = entity.goals ? JSON.stringify(entity.goals) : null;
    if (entity.notes !== undefined) row.notes = entity.notes || null;
    if (entity.createdAt) row.created_at = entity.createdAt.toISOString();
    if (entity.updatedAt) row.updated_at = entity.updatedAt.toISOString();

    return row;
  }

  /**
   * Find deep dive by channel ID
   */
  async findByChannelId(channelId: string): Promise<ChannelDeepDive | null> {
    const row = await this.db.get<ChannelDeepDiveRow>(
      `SELECT * FROM ${this.tableName} WHERE channel_id = ?`,
      [channelId]
    );
    return row ? this.rowToEntity(row) : null;
  }

  /**
   * Create new deep dive entry
   */
  async create(input: CreateDeepDiveInput): Promise<ChannelDeepDive> {
    const now = new Date();
    const deepDive: ChannelDeepDive = {
      id: StringUtil.generateId("deep_dive"),
      channelId: input.channelId,
      strategyMarkdown: input.strategyMarkdown,
      uspMarkdown: input.uspMarkdown,
      targetAudience: input.targetAudience,
      contentPillars: input.contentPillars,
      toneAndStyle: input.toneAndStyle,
      goals: input.goals,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    await this.insert(deepDive);
    return deepDive;
  }

  /**
   * Update deep dive entry
   */
  async updateByChannelId(channelId: string, updates: UpdateDeepDiveInput): Promise<ChannelDeepDive | null> {
    const existing = await this.findByChannelId(channelId);
    if (!existing) return null;

    const updated: Partial<ChannelDeepDive> = {
      ...updates,
      updatedAt: new Date(),
    };

    await this.update(existing.id, updated);
    return this.findById(existing.id);
  }

  /**
   * Delete deep dive by channel ID
   */
  async deleteByChannelId(channelId: string): Promise<boolean> {
    const existing = await this.findByChannelId(channelId);
    if (!existing) return false;
    await this.delete(existing.id);
    return true;
  }

  private parseJson<T>(json: string): T | undefined {
    try {
      return JSON.parse(json) as T;
    } catch {
      return undefined;
    }
  }
}

// Export singleton instance
export const channelDeepDiveRepository = new ChannelDeepDiveRepository();
