import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 29;
export const description = "Ensure veo3_video_generations has all expected columns";

export async function up(db: SQLiteDatabase, loggerParam?: Logger): Promise<void> {
  const logger = loggerParam || new Logger("Migration029");
  logger.info("Running migration 029: Ensure veo3_video_generations columns");

  const tableInfo = await db.all<{ name: string }>("PRAGMA table_info(veo3_video_generations)");
  const columns = (tableInfo || []).map((c) => c.name);

  if ((columns || []).length === 0) {
    // Table missing entirely — create with intended schema
    await db.run(`
      CREATE TABLE IF NOT EXISTS veo3_video_generations (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        scene_id TEXT,
        operation_name TEXT,
        prompt TEXT,
        seed INTEGER,
        aspect_ratio TEXT,
        status TEXT,
        video_url TEXT,
        video_path TEXT,
        error_message TEXT,
        raw_response TEXT,
        created_at TEXT,
        updated_at TEXT,
        completed_at TEXT,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      )
    `);
    logger.info("Created veo3_video_generations table (migration 029)");
    return;
  }

  // Add any missing columns that newer code expects
  const needed: Array<{ name: string; ddl: string }> = [
    { name: "scene_id", ddl: "scene_id TEXT" },
    { name: "operation_name", ddl: "operation_name TEXT" },
    { name: "prompt", ddl: "prompt TEXT" },
    { name: "seed", ddl: "seed INTEGER" },
    { name: "aspect_ratio", ddl: "aspect_ratio TEXT" },
    { name: "status", ddl: "status TEXT" },
    { name: "video_url", ddl: "video_url TEXT" },
    { name: "video_path", ddl: "video_path TEXT" },
    { name: "error_message", ddl: "error_message TEXT" },
    { name: "raw_response", ddl: "raw_response TEXT" },
    { name: "created_at", ddl: "created_at TEXT" },
    { name: "updated_at", ddl: "updated_at TEXT" },
    { name: "completed_at", ddl: "completed_at TEXT" },
  ];

  for (const col of needed) {
    if (!columns.includes(col.name)) {
      await db.run(`ALTER TABLE veo3_video_generations ADD COLUMN ${col.ddl}`);
      logger.info(`migration 029: added column ${col.name} to veo3_video_generations`);
    }
  }

  // Create indexes if missing
  const refreshed = await db.all<{ name: string }>("PRAGMA table_info(veo3_video_generations)");
  const refreshedCols = (refreshed || []).map((c) => c.name);
  if (refreshedCols.includes("profile_id")) {
    await db.run("CREATE INDEX IF NOT EXISTS idx_veo3_generations_profile_id ON veo3_video_generations(profile_id)");
  }
  if (refreshedCols.includes("project_id")) {
    await db.run("CREATE INDEX IF NOT EXISTS idx_veo3_generations_project_id ON veo3_video_generations(project_id)");
  }
  if (refreshedCols.includes("status")) {
    await db.run("CREATE INDEX IF NOT EXISTS idx_veo3_generations_status ON veo3_video_generations(status)");
  }
  if (refreshedCols.includes("scene_id")) {
    await db.run("CREATE INDEX IF NOT EXISTS idx_veo3_generations_scene_id ON veo3_video_generations(scene_id)");
  }
}
