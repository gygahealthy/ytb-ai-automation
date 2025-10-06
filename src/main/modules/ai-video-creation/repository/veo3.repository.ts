import { VEO3Project, VideoScene } from "../veo3.types";
import { sqliteDatabase } from "../../../../storage/sqlite-database";
import { BaseRepository } from "../../../../storage/repositories";

interface VEO3ProjectRow {
  id: string;
  project_id: string;
  profile_id: string;
  name: string;
  status: "draft" | "processing" | "completed" | "failed";
  scenes: string;
  json_prompt: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Repository for VEO3Project entities
 */
export class VEO3Repository extends BaseRepository<VEO3Project> {
  constructor() {
    super("veo3_projects", sqliteDatabase);
  }

  protected rowToEntity(row: VEO3ProjectRow): VEO3Project {
    const project: VEO3Project = {
      id: row.id,
      projectId: row.project_id,
      profileId: row.profile_id,
      name: row.name,
      status: row.status,
      scenes: JSON.parse(row.scenes) as VideoScene[],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    if (row.json_prompt) {
      try {
        project.jsonPrompt = JSON.parse(row.json_prompt);
      } catch (e) {
        project.jsonPrompt = undefined;
      }
    }

    return project;
  }

  protected entityToRow(entity: Partial<VEO3Project>): Partial<VEO3ProjectRow> {
    const row: Partial<VEO3ProjectRow> = {};

    if (entity.id) row.id = entity.id;
    if (entity.projectId) row.project_id = entity.projectId;
    if (entity.profileId) row.profile_id = entity.profileId;
    if (entity.name) row.name = entity.name;
    if (entity.status) row.status = entity.status;
    if (entity.scenes) row.scenes = JSON.stringify(entity.scenes);

    if (entity.jsonPrompt !== undefined) {
      row.json_prompt = entity.jsonPrompt ? JSON.stringify(entity.jsonPrompt) : null;
    }

    if (entity.createdAt) row.created_at = entity.createdAt.toISOString();
    if (entity.updatedAt) row.updated_at = entity.updatedAt.toISOString();

    return row;
  }

  /**
   * Find project by project ID
   */
  async findByProjectId(projectId: string): Promise<VEO3Project | null> {
    const row = await this.db.get<VEO3ProjectRow>(`SELECT * FROM ${this.tableName} WHERE project_id = ?`, [projectId]);
    return row ? this.rowToEntity(row) : null;
  }

  /**
   * Find projects by profile ID
   */
  async findByProfileId(profileId: string): Promise<VEO3Project[]> {
    const rows = await this.db.all<VEO3ProjectRow>(`SELECT * FROM ${this.tableName} WHERE profile_id = ?`, [profileId]);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Find projects by status
   */
  async findByStatus(status: VEO3Project["status"]): Promise<VEO3Project[]> {
    const rows = await this.db.all<VEO3ProjectRow>(`SELECT * FROM ${this.tableName} WHERE status = ?`, [status]);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Update project status
   */
  async updateStatus(id: string, status: VEO3Project["status"]): Promise<void> {
    await this.db.run(`UPDATE ${this.tableName} SET status = ?, updated_at = ? WHERE id = ?`, [
      status,
      new Date().toISOString(),
      id,
    ]);
  }
}

export const veo3Repository = new VEO3Repository();
