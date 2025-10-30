import { database } from "../../../../storage/database";
import { BaseRepository } from "../../../../storage/repositories/base.repository";
import { generateUuid } from "@/core/id";
import type { SQLiteDatabase } from "../../../../storage/sqlite-database";
import { Veo3ImageGeneration, Veo3ImageGenerationRow, CreateImageGenerationInput } from "../types/image.types";

/**
 * Repository for VEO3 Image Generation entities
 */
export class Veo3ImageRepository extends BaseRepository<Veo3ImageGeneration> {
  constructor(db?: SQLiteDatabase) {
    super("veo3_image_generations", db || database.getSQLiteDatabase());
  }

  protected rowToEntity(row: Veo3ImageGenerationRow): Veo3ImageGeneration {
    return {
      id: row.id,
      profileId: row.profile_id,
      name: row.name,
      aspectRatio: row.aspect_ratio as Veo3ImageGeneration["aspectRatio"],
      workflowId: row.workflow_id,
      mediaKey: row.media_key,
      localPath: row.local_path,
      fifeUrl: row.fife_url,
      createdAt: new Date(row.created_at),
    };
  }

  protected entityToRow(entity: Partial<Veo3ImageGeneration>): Partial<Veo3ImageGenerationRow> {
    const row: Partial<Veo3ImageGenerationRow> = {};

    if (entity.id) row.id = entity.id;
    if (entity.profileId) row.profile_id = entity.profileId;
    if (entity.name) row.name = entity.name;
    if (entity.aspectRatio) row.aspect_ratio = entity.aspectRatio;
    if (entity.workflowId) row.workflow_id = entity.workflowId;
    if (entity.mediaKey) row.media_key = entity.mediaKey;
    if (entity.localPath !== undefined) row.local_path = entity.localPath;
    if (entity.fifeUrl !== undefined) row.fife_url = entity.fifeUrl;
    if (entity.createdAt) row.created_at = entity.createdAt.toISOString();

    return row;
  }

  /**
   * Create a new image generation record
   */
  async createImageGeneration(input: CreateImageGenerationInput): Promise<Veo3ImageGeneration> {
    const now = new Date();
    const entity: Veo3ImageGeneration = {
      id: generateUuid(),
      profileId: input.profileId,
      name: input.name,
      aspectRatio: input.aspectRatio,
      workflowId: input.workflowId,
      mediaKey: input.mediaKey,
      localPath: input.localPath,
      fifeUrl: input.fifeUrl,
      createdAt: input.createdAt || now,
    };

    const row = this.entityToRow(entity);
    const columns = Object.keys(row).join(", ");
    const placeholders = Object.keys(row)
      .map(() => "?")
      .join(", ");
    const values = Object.values(row);

    await this.db.run(`INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`, values);

    return entity;
  }

  /**
   * Find images by profile ID
   */
  async findByProfileId(profileId: string): Promise<Veo3ImageGeneration[]> {
    const rows = await this.db.all<Veo3ImageGenerationRow>(
      `SELECT * FROM ${this.tableName} WHERE profile_id = ? ORDER BY created_at DESC`,
      [profileId]
    );
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Find image by workflow ID and media key
   */
  async findByWorkflowAndMediaKey(workflowId: string, mediaKey: string): Promise<Veo3ImageGeneration | null> {
    const row = await this.db.get<Veo3ImageGenerationRow>(
      `SELECT * FROM ${this.tableName} WHERE workflow_id = ? AND media_key = ?`,
      [workflowId, mediaKey]
    );
    return row ? this.rowToEntity(row) : null;
  }

  /**
   * Find image by name (Flow API name)
   */
  async findByName(name: string): Promise<Veo3ImageGeneration | null> {
    const row = await this.db.get<Veo3ImageGenerationRow>(`SELECT * FROM ${this.tableName} WHERE name = ?`, [name]);
    return row ? this.rowToEntity(row) : null;
  }

  /**
   * Update local path for an image
   */
  async updateLocalPath(id: string, localPath: string): Promise<void> {
    await this.db.run(`UPDATE ${this.tableName} SET local_path = ? WHERE id = ?`, [localPath, id]);
  }

  /**
   * Check if image exists by name
   */
  async existsByName(name: string): Promise<boolean> {
    const result = await this.db.get<{ count: number }>(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE name = ?`, [name]);
    return (result?.count ?? 0) > 0;
  }

  /**
   * Delete images by profile ID
   */
  async deleteByProfileId(profileId: string): Promise<number> {
    const result = await this.db.run(`DELETE FROM ${this.tableName} WHERE profile_id = ?`, [profileId]);
    return result.changes || 0;
  }
}

// Lazy singleton to avoid triggering database access in worker threads during module import
let _veo3ImageRepositoryInstance: Veo3ImageRepository | null = null;

export function getVeo3ImageRepository(): Veo3ImageRepository {
  if (!_veo3ImageRepositoryInstance) {
    _veo3ImageRepositoryInstance = new Veo3ImageRepository();
  }
  return _veo3ImageRepositoryInstance;
}

// Export singleton with lazy getter for worker thread safety
export const veo3ImageRepository = new Proxy({} as Veo3ImageRepository, {
  get(_target, prop) {
    return getVeo3ImageRepository()[prop as keyof Veo3ImageRepository];
  },
});
