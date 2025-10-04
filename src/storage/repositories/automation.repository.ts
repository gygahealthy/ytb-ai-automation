import { AutomationAction, AutomationTask } from "../../types";
import { sqliteDatabase } from "../sqlite-database";
import { BaseRepository } from "./base.repository";

interface AutomationTaskRow {
  id: string;
  profile_id: string;
  name: string;
  target_url: string;
  actions: string;
  status: "pending" | "running" | "completed" | "failed" | "stopped";
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
  logs: string;
  created_at: string;
  updated_at: string;
}

/**
 * Repository for AutomationTask entities
 */
export class AutomationRepository extends BaseRepository<AutomationTask> {
  constructor() {
    super("automation_tasks", sqliteDatabase);
  }

  protected rowToEntity(row: AutomationTaskRow): AutomationTask {
    const task: AutomationTask = {
      id: row.id,
      profileId: row.profile_id,
      name: row.name,
      targetUrl: row.target_url,
      actions: JSON.parse(row.actions) as AutomationAction[],
      status: row.status,
      logs: JSON.parse(row.logs) as string[],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    if (row.started_at) task.startedAt = new Date(row.started_at);
    if (row.completed_at) task.completedAt = new Date(row.completed_at);
    if (row.error) task.error = row.error;

    return task;
  }

  protected entityToRow(entity: Partial<AutomationTask>): Partial<AutomationTaskRow> {
    const row: Partial<AutomationTaskRow> = {};

    if (entity.id) row.id = entity.id;
    if (entity.profileId) row.profile_id = entity.profileId;
    if (entity.name) row.name = entity.name;
    if (entity.targetUrl) row.target_url = entity.targetUrl;
    if (entity.actions) row.actions = JSON.stringify(entity.actions);
    if (entity.status) row.status = entity.status;
    if (entity.logs) row.logs = JSON.stringify(entity.logs);
    if (entity.error !== undefined) row.error = entity.error || null;

    if (entity.startedAt !== undefined) {
      row.started_at = entity.startedAt ? entity.startedAt.toISOString() : null;
    }
    if (entity.completedAt !== undefined) {
      row.completed_at = entity.completedAt ? entity.completedAt.toISOString() : null;
    }

    if (entity.createdAt) row.created_at = entity.createdAt.toISOString();
    if (entity.updatedAt) row.updated_at = entity.updatedAt.toISOString();

    return row;
  }

  /**
   * Find tasks by profile ID
   */
  async findByProfileId(profileId: string): Promise<AutomationTask[]> {
    const rows = await this.db.all<AutomationTaskRow>(`SELECT * FROM ${this.tableName} WHERE profile_id = ?`, [profileId]);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Find tasks by status
   */
  async findByStatus(status: AutomationTask["status"]): Promise<AutomationTask[]> {
    const rows = await this.db.all<AutomationTaskRow>(`SELECT * FROM ${this.tableName} WHERE status = ?`, [status]);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Add log entry to task
   */
  async addLog(id: string, logEntry: string): Promise<void> {
    const task = await this.findById(id);
    if (task) {
      const updatedLogs = [...task.logs, logEntry];
      await this.db.run(`UPDATE ${this.tableName} SET logs = ?, updated_at = ? WHERE id = ?`, [
        JSON.stringify(updatedLogs),
        new Date().toISOString(),
        id,
      ]);
    }
  }
}

export const automationRepository = new AutomationRepository();
