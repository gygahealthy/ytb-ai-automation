import { database } from "../../../storage/database";
import { BaseRepository } from "../../../storage/repositories/base.repository";
import { ChannelTopic, CreateTopicInput, UpdateTopicInput } from "../youtube.types";
import { StringUtil } from "../../../../shared/utils/string";

interface ChannelTopicRow {
  id: string;
  channel_id: string;
  topic_title: string;
  topic_description: string | null;
  priority: string;
  status: string;
  target_date: string | null;
  tags: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Repository for ChannelTopic entities
 */
export class ChannelTopicRepository extends BaseRepository<ChannelTopic> {
  constructor() {
    super("channel_topics", database.getSQLiteDatabase());
  }

  protected rowToEntity(row: ChannelTopicRow): ChannelTopic {
    const topic: ChannelTopic = {
      id: row.id,
      channelId: row.channel_id,
      topicTitle: row.topic_title,
      priority: row.priority as any,
      status: row.status as any,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    if (row.topic_description) topic.topicDescription = row.topic_description;
    if (row.target_date) topic.targetDate = row.target_date;
    if (row.tags) topic.tags = this.parseJson<string[]>(row.tags);
    if (row.notes) topic.notes = row.notes;

    return topic;
  }

  protected entityToRow(entity: Partial<ChannelTopic>): Partial<ChannelTopicRow> {
    const row: Partial<ChannelTopicRow> = {};

    if (entity.id) row.id = entity.id;
    if (entity.channelId) row.channel_id = entity.channelId;
    if (entity.topicTitle) row.topic_title = entity.topicTitle;
    if (entity.topicDescription !== undefined) row.topic_description = entity.topicDescription || null;
    if (entity.priority) row.priority = entity.priority;
    if (entity.status) row.status = entity.status;
    if (entity.targetDate !== undefined) row.target_date = entity.targetDate || null;
    if (entity.tags !== undefined) row.tags = entity.tags ? JSON.stringify(entity.tags) : null;
    if (entity.notes !== undefined) row.notes = entity.notes || null;
    if (entity.createdAt) row.created_at = entity.createdAt.toISOString();
    if (entity.updatedAt) row.updated_at = entity.updatedAt.toISOString();

    return row;
  }

  /**
   * Find topics by channel ID
   */
  async findByChannelId(channelId: string): Promise<ChannelTopic[]> {
    const rows = await this.db.all<ChannelTopicRow>(
      `SELECT * FROM ${this.tableName} WHERE channel_id = ? ORDER BY 
       CASE priority 
         WHEN 'high' THEN 1 
         WHEN 'medium' THEN 2 
         WHEN 'low' THEN 3 
       END, 
       target_date ASC`,
      [channelId]
    );
    return rows.map(row => this.rowToEntity(row));
  }

  /**
   * Find topics by status
   */
  async findByStatus(channelId: string, status: string): Promise<ChannelTopic[]> {
    const rows = await this.db.all<ChannelTopicRow>(
      `SELECT * FROM ${this.tableName} WHERE channel_id = ? AND status = ? ORDER BY target_date ASC`,
      [channelId, status]
    );
    return rows.map(row => this.rowToEntity(row));
  }

  /**
   * Create new topic
   */
  async create(input: CreateTopicInput): Promise<ChannelTopic> {
    const now = new Date();
    const topic: ChannelTopic = {
      id: StringUtil.generateId("topic"),
      channelId: input.channelId,
      topicTitle: input.topicTitle,
      topicDescription: input.topicDescription,
      priority: input.priority || 'medium',
      status: input.status || 'idea',
      targetDate: input.targetDate,
      tags: input.tags,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    await this.insert(topic);
    return topic;
  }

  /**
   * Update topic
   */
  async updateTopic(id: string, updates: UpdateTopicInput): Promise<ChannelTopic | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: Partial<ChannelTopic> = {
      ...updates,
      updatedAt: new Date(),
    };

    await this.update(id, updated);
    return this.findById(id);
  }

  /**
   * Get upcoming topics (not completed/archived)
   */
  async getUpcoming(channelId: string, limit?: number): Promise<ChannelTopic[]> {
    const sql = limit
      ? `SELECT * FROM ${this.tableName} 
         WHERE channel_id = ? AND status NOT IN ('completed', 'archived')
         ORDER BY 
           CASE priority 
             WHEN 'high' THEN 1 
             WHEN 'medium' THEN 2 
             WHEN 'low' THEN 3 
           END,
           target_date ASC
         LIMIT ?`
      : `SELECT * FROM ${this.tableName} 
         WHERE channel_id = ? AND status NOT IN ('completed', 'archived')
         ORDER BY 
           CASE priority 
             WHEN 'high' THEN 1 
             WHEN 'medium' THEN 2 
             WHEN 'low' THEN 3 
           END,
           target_date ASC`;

    const params = limit ? [channelId, limit] : [channelId];
    const rows = await this.db.all<ChannelTopicRow>(sql, params);
    return rows.map(row => this.rowToEntity(row));
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
export const channelTopicRepository = new ChannelTopicRepository();
