import { Logger } from "../../../../../shared/utils/logger";
import { database } from "../../../../storage/database";
import { SQLiteDatabase } from "../../../../storage/sqlite-database";
import type { VideoUpscale } from "../../../../../shared/types/video-creation.types";

const logger = new Logger("VideoUpscaleRepository");

export class VideoUpscaleRepository {
  constructor(private db: SQLiteDatabase) {}

  /**
   * Create a new video upscale record
   */
  async create(upscale: Omit<VideoUpscale, "createdAt" | "updatedAt">): Promise<VideoUpscale> {
    logger.info(`Creating video upscale record: ${upscale.id}`);

    const now = new Date().toISOString();
    const record: VideoUpscale = {
      ...upscale,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.run(
      `INSERT INTO veo3_video_upscales (
        id, source_generation_id, profile_id, project_id, scene_id, operation_name,
        status, model, seed, aspect_ratio, media_generation_id, fife_url, 
        serving_base_uri, video_url, video_path, error_message, raw_response, 
        created_at, updated_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.sourceGenerationId,
        record.profileId,
        record.projectId,
        record.sceneId,
        record.operationName,
        record.status,
        record.model,
        record.seed || null,
        record.aspectRatio || null,
        record.mediaGenerationId || null,
        record.fifeUrl || null,
        record.servingBaseUri || null,
        record.videoUrl || null,
        record.videoPath || null,
        record.errorMessage || null,
        record.rawResponse || null,
        record.createdAt,
        record.updatedAt,
        record.completedAt || null,
      ]
    );

    logger.info(`Video upscale record created: ${upscale.id}`);
    return record;
  }

  /**
   * Update video upscale status and metadata
   */
  async updateStatus(
    id: string,
    status: VideoUpscale["status"],
    data: {
      mediaGenerationId?: string;
      fifeUrl?: string;
      servingBaseUri?: string;
      videoUrl?: string;
      videoPath?: string;
      errorMessage?: string;
      rawResponse?: string;
      seed?: number;
      aspectRatio?: string;
    }
  ): Promise<void> {
    logger.info(`Updating video upscale status: ${id} -> ${status}`);

    const now = new Date().toISOString();
    const completedAt = status === "completed" ? now : undefined;

    await this.db.run(
      `UPDATE veo3_video_upscales 
       SET status = ?, media_generation_id = ?, fife_url = ?, serving_base_uri = ?,
           video_url = ?, video_path = ?, error_message = ?, raw_response = ?,
           seed = ?, aspect_ratio = ?, updated_at = ?, completed_at = ?
       WHERE id = ?`,
      [
        status,
        data.mediaGenerationId || null,
        data.fifeUrl || null,
        data.servingBaseUri || null,
        data.videoUrl || null,
        data.videoPath || null,
        data.errorMessage || null,
        data.rawResponse || null,
        data.seed || null,
        data.aspectRatio || null,
        now,
        completedAt || null,
        id,
      ]
    );

    logger.info(`Video upscale status updated: ${id}`);
  }

  /**
   * Get video upscale by ID
   */
  async getById(id: string): Promise<VideoUpscale | null> {
    logger.info(`Fetching video upscale by ID: ${id}`);

    const row = await this.db.get<any>(
      `SELECT 
        id, source_generation_id as sourceGenerationId, profile_id as profileId, 
        project_id as projectId, scene_id as sceneId, operation_name as operationName,
        status, model, seed, aspect_ratio as aspectRatio, 
        media_generation_id as mediaGenerationId, fife_url as fifeUrl, 
        serving_base_uri as servingBaseUri, video_url as videoUrl, 
        video_path as videoPath, error_message as errorMessage, 
        raw_response as rawResponse, created_at as createdAt, 
        updated_at as updatedAt, completed_at as completedAt
       FROM veo3_video_upscales 
       WHERE id = ?`,
      [id]
    );

    return row || null;
  }

  /**
   * Get video upscales by source generation ID
   */
  async getBySourceGenerationId(sourceGenerationId: string): Promise<VideoUpscale[]> {
    logger.info(`Fetching video upscales for source generation: ${sourceGenerationId}`);

    const rows = await this.db.all<any>(
      `SELECT 
        id, source_generation_id as sourceGenerationId, profile_id as profileId, 
        project_id as projectId, scene_id as sceneId, operation_name as operationName,
        status, model, seed, aspect_ratio as aspectRatio, 
        media_generation_id as mediaGenerationId, fife_url as fifeUrl, 
        serving_base_uri as servingBaseUri, video_url as videoUrl, 
        video_path as videoPath, error_message as errorMessage, 
        raw_response as rawResponse, created_at as createdAt, 
        updated_at as updatedAt, completed_at as completedAt
       FROM veo3_video_upscales 
       WHERE source_generation_id = ?
       ORDER BY created_at DESC`,
      [sourceGenerationId]
    );

    return rows || [];
  }

  /**
   * Get video upscales by scene ID
   */
  async getBySceneId(sceneId: string): Promise<VideoUpscale | null> {
    logger.info(`Fetching video upscale by scene ID: ${sceneId}`);

    const row = await this.db.get<any>(
      `SELECT 
        id, source_generation_id as sourceGenerationId, profile_id as profileId, 
        project_id as projectId, scene_id as sceneId, operation_name as operationName,
        status, model, seed, aspect_ratio as aspectRatio, 
        media_generation_id as mediaGenerationId, fife_url as fifeUrl, 
        serving_base_uri as servingBaseUri, video_url as videoUrl, 
        video_path as videoPath, error_message as errorMessage, 
        raw_response as rawResponse, created_at as createdAt, 
        updated_at as updatedAt, completed_at as completedAt
       FROM veo3_video_upscales 
       WHERE scene_id = ?`,
      [sceneId]
    );

    return row || null;
  }

  /**
   * Get video upscales by profile ID
   */
  async getByProfile(profileId: string, limit: number = 50, offset: number = 0): Promise<VideoUpscale[]> {
    logger.info(`Fetching video upscales for profile: ${profileId}`);

    const rows = await this.db.all<any>(
      `SELECT 
        id, source_generation_id as sourceGenerationId, profile_id as profileId, 
        project_id as projectId, scene_id as sceneId, operation_name as operationName,
        status, model, seed, aspect_ratio as aspectRatio, 
        media_generation_id as mediaGenerationId, fife_url as fifeUrl, 
        serving_base_uri as servingBaseUri, video_url as videoUrl, 
        video_path as videoPath, error_message as errorMessage, 
        raw_response as rawResponse, created_at as createdAt, 
        updated_at as updatedAt, completed_at as completedAt
       FROM veo3_video_upscales 
       WHERE profile_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [profileId, limit, offset]
    );

    return rows || [];
  }

  /**
   * Get video upscales by status
   */
  async getByStatus(status: VideoUpscale["status"], limit: number = 50, offset: number = 0): Promise<VideoUpscale[]> {
    logger.info(`Fetching video upscales with status: ${status}`);

    const rows = await this.db.all<any>(
      `SELECT 
        id, source_generation_id as sourceGenerationId, profile_id as profileId, 
        project_id as projectId, scene_id as sceneId, operation_name as operationName,
        status, model, seed, aspect_ratio as aspectRatio, 
        media_generation_id as mediaGenerationId, fife_url as fifeUrl, 
        serving_base_uri as servingBaseUri, video_url as videoUrl, 
        video_path as videoPath, error_message as errorMessage, 
        raw_response as rawResponse, created_at as createdAt, 
        updated_at as updatedAt, completed_at as completedAt
       FROM veo3_video_upscales 
       WHERE status = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [status, limit, offset]
    );

    return rows || [];
  }

  /**
   * Get all video upscales (paginated)
   */
  async getAll(limit: number = 50, offset: number = 0): Promise<VideoUpscale[]> {
    logger.info(`Fetching all video upscales (limit: ${limit}, offset: ${offset})`);

    const rows = await this.db.all<any>(
      `SELECT 
        id, source_generation_id as sourceGenerationId, profile_id as profileId, 
        project_id as projectId, scene_id as sceneId, operation_name as operationName,
        status, model, seed, aspect_ratio as aspectRatio, 
        media_generation_id as mediaGenerationId, fife_url as fifeUrl, 
        serving_base_uri as servingBaseUri, video_url as videoUrl, 
        video_path as videoPath, error_message as errorMessage, 
        raw_response as rawResponse, created_at as createdAt, 
        updated_at as updatedAt, completed_at as completedAt
       FROM veo3_video_upscales 
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return rows || [];
  }

  /**
   * Delete video upscale by ID
   */
  async deleteById(id: string): Promise<void> {
    logger.info(`Deleting video upscale: ${id}`);

    await this.db.run(`DELETE FROM veo3_video_upscales WHERE id = ?`, [id]);

    logger.info(`Video upscale deleted: ${id}`);
  }

  /**
   * Count video upscales by profile
   */
  async countByProfile(profileId: string, status?: VideoUpscale["status"]): Promise<number> {
    const whereClauses = ["profile_id = ?"];
    const params: any[] = [profileId];

    if (status) {
      whereClauses.push("status = ?");
      params.push(status);
    }

    const row = await this.db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM veo3_video_upscales WHERE ${whereClauses.join(" AND ")}`,
      params
    );

    return row?.count || 0;
  }

  /**
   * Count video upscales by status
   */
  async countByStatus(status: VideoUpscale["status"]): Promise<number> {
    const row = await this.db.get<{ count: number }>(`SELECT COUNT(*) as count FROM veo3_video_upscales WHERE status = ?`, [
      status,
    ]);

    return row?.count || 0;
  }

  /**
   * Count all video upscales
   */
  async countAll(): Promise<number> {
    const row = await this.db.get<{ count: number }>(`SELECT COUNT(*) as count FROM veo3_video_upscales`);

    return row?.count || 0;
  }

  /**
   * Get status counts for all video upscales
   */
  async getStatusCounts(profileId?: string): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const whereClause = profileId ? "WHERE profile_id = ?" : "";
    const params = profileId ? [profileId] : [];

    const rows = await this.db.all<{ status: string; count: number }>(
      `SELECT status, COUNT(*) as count FROM veo3_video_upscales ${whereClause} GROUP BY status`,
      params
    );

    const counts = {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    for (const row of rows || []) {
      counts.total += row.count;
      if (row.status === "pending") counts.pending = row.count;
      if (row.status === "processing") counts.processing = row.count;
      if (row.status === "completed") counts.completed = row.count;
      if (row.status === "failed") counts.failed = row.count;
    }

    return counts;
  }
}

// Lazy singleton to avoid triggering database access in worker threads during module import
let _videoUpscaleRepositoryInstance: VideoUpscaleRepository | null = null;

export function getVideoUpscaleRepository(): VideoUpscaleRepository {
  if (!_videoUpscaleRepositoryInstance) {
    _videoUpscaleRepositoryInstance = new VideoUpscaleRepository(database.getSQLiteDatabase());
  }
  return _videoUpscaleRepositoryInstance;
}

// Export singleton with lazy getter for backward compatibility
export const videoUpscaleRepository = new Proxy({} as VideoUpscaleRepository, {
  get(_target, prop) {
    return getVideoUpscaleRepository()[prop as keyof VideoUpscaleRepository];
  },
});
