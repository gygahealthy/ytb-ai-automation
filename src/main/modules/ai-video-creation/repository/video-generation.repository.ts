import { Logger } from "../../../../shared/utils/logger";
import { database } from "../../../storage/database";
import { SQLiteDatabase } from "../../../storage/sqlite-database";
import type { VideoGeneration } from "../../../../shared/types/video-creation.types";

const logger = new Logger("VideoGenerationRepository");

export class VideoGenerationRepository {
  constructor(private db: SQLiteDatabase) {}

  /**
   * Create a new video generation record
   */
  async create(generation: Omit<VideoGeneration, "createdAt" | "updatedAt">): Promise<VideoGeneration> {
    logger.info(`Creating video generation record: ${generation.id}`);

    const now = new Date().toISOString();
    const record: VideoGeneration = {
      ...generation,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.run(
      `INSERT INTO veo3_video_generations (
        id, profile_id, project_id, scene_id, operation_name, prompt, seed, aspect_ratio,
        status, media_generation_id, fife_url, serving_base_uri, video_url, video_path, 
        error_message, raw_response, created_at, updated_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.profileId,
        record.projectId,
        record.sceneId,
        record.operationName,
        record.prompt,
        record.seed,
        record.aspectRatio,
        record.status,
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

    logger.info(`Video generation record created: ${generation.id}`);
    return record;
  }

  /**
   * Update video generation status and metadata
   */
  async updateStatus(
    id: string,
    status: VideoGeneration["status"],
    data: {
      mediaGenerationId?: string;
      fifeUrl?: string;
      servingBaseUri?: string;
      videoUrl?: string;
      videoPath?: string;
      errorMessage?: string;
      rawResponse?: string;
    }
  ): Promise<void> {
    logger.info(`Updating video generation status: ${id} -> ${status}`);

    const now = new Date().toISOString();
    const completedAt = status === "completed" ? now : undefined;

    await this.db.run(
      `UPDATE veo3_video_generations 
       SET status = ?, media_generation_id = ?, fife_url = ?, serving_base_uri = ?,
           video_url = ?, video_path = ?, error_message = ?, 
           raw_response = ?, updated_at = ?, completed_at = ?
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
        now,
        completedAt || null,
        id,
      ]
    );

    logger.info(`Video generation status updated: ${id}`);
  }

  /**
   * Get video generation by ID
   */
  async getById(id: string): Promise<VideoGeneration | null> {
    logger.info(`Fetching video generation by ID: ${id}`);

    const row = await this.db.get<any>(
      `SELECT 
        id, profile_id as profileId, project_id as projectId, scene_id as sceneId,
        operation_name as operationName, prompt, seed, aspect_ratio as aspectRatio,
        status, media_generation_id as mediaGenerationId, fife_url as fifeUrl, 
        serving_base_uri as servingBaseUri, video_url as videoUrl, video_path as videoPath, 
        error_message as errorMessage, raw_response as rawResponse, created_at as createdAt, 
        updated_at as updatedAt, completed_at as completedAt
       FROM veo3_video_generations 
       WHERE id = ?`,
      [id]
    );

    return row || null;
  }

  /**
   * Get video generation by scene ID
   */
  async getBySceneId(sceneId: string): Promise<VideoGeneration | null> {
    logger.info(`Fetching video generation by scene ID: ${sceneId}`);

    const row = await this.db.get<any>(
      `SELECT 
        id, profile_id as profileId, project_id as projectId, scene_id as sceneId,
        operation_name as operationName, prompt, seed, aspect_ratio as aspectRatio,
        status, media_generation_id as mediaGenerationId, fife_url as fifeUrl, 
        serving_base_uri as servingBaseUri, video_url as videoUrl, video_path as videoPath, 
        error_message as errorMessage, raw_response as rawResponse, created_at as createdAt, 
        updated_at as updatedAt, completed_at as completedAt
       FROM veo3_video_generations 
       WHERE scene_id = ?`,
      [sceneId]
    );

    return row || null;
  }

  /**
   * Get video generations by profile ID
   */
  async getByProfile(profileId: string, limit: number = 50, offset: number = 0): Promise<VideoGeneration[]> {
    logger.info(`Fetching video generations for profile: ${profileId}`);

    const rows = await this.db.all<any>(
      `SELECT 
        id, profile_id as profileId, project_id as projectId, scene_id as sceneId,
        operation_name as operationName, prompt, seed, aspect_ratio as aspectRatio,
        status, media_generation_id as mediaGenerationId, fife_url as fifeUrl, 
        serving_base_uri as servingBaseUri, video_url as videoUrl, video_path as videoPath, 
        error_message as errorMessage, raw_response as rawResponse, created_at as createdAt, 
        updated_at as updatedAt, completed_at as completedAt
       FROM veo3_video_generations 
       WHERE profile_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [profileId, limit, offset]
    );

    return rows || [];
  }

  /**
   * Get video generations by status
   */
  async getByStatus(status: VideoGeneration["status"], limit: number = 50, offset: number = 0): Promise<VideoGeneration[]> {
    logger.info(`Fetching video generations with status: ${status}`);

    const rows = await this.db.all<any>(
      `SELECT 
        id, profile_id as profileId, project_id as projectId, scene_id as sceneId,
        operation_name as operationName, prompt, seed, aspect_ratio as aspectRatio,
        status, media_generation_id as mediaGenerationId, fife_url as fifeUrl, 
        serving_base_uri as servingBaseUri, video_url as videoUrl, video_path as videoPath, 
        error_message as errorMessage, raw_response as rawResponse, created_at as createdAt, 
        updated_at as updatedAt, completed_at as completedAt
       FROM veo3_video_generations 
       WHERE status = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [status, limit, offset]
    );

    return rows || [];
  }

  /**
   * Get all video generations (paginated)
   */
  async getAll(limit: number = 50, offset: number = 0): Promise<VideoGeneration[]> {
    logger.info(`Fetching all video generations (limit: ${limit}, offset: ${offset})`);

    const rows = await this.db.all<any>(
      `SELECT 
        id, profile_id as profileId, project_id as projectId, scene_id as sceneId,
        operation_name as operationName, prompt, seed, aspect_ratio as aspectRatio,
        status, media_generation_id as mediaGenerationId, fife_url as fifeUrl, 
        serving_base_uri as servingBaseUri, video_url as videoUrl, video_path as videoPath, 
        error_message as errorMessage, raw_response as rawResponse, created_at as createdAt, 
        updated_at as updatedAt, completed_at as completedAt
       FROM veo3_video_generations 
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return rows || [];
  }

  /**
   * Delete video generation by ID
   */
  async deleteById(id: string): Promise<void> {
    logger.info(`Deleting video generation: ${id}`);

    await this.db.run(`DELETE FROM veo3_video_generations WHERE id = ?`, [id]);

    logger.info(`Video generation deleted: ${id}`);
  }
}

// Export singleton instance
export const videoGenerationRepository = new VideoGenerationRepository(database.getSQLiteDatabase());
