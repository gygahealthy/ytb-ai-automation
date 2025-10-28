import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 10;
export const description = "Create veo3_video_generations table";

export async function up(db: SQLiteDatabase, loggerParam?: Logger): Promise<void> {
  const logger = loggerParam || new Logger("Migration010");
  logger.info("Running migration 010: Create veo3_video_generations table");
  // Check existing table columns so this migration is safe to run against DBs
  // which may already have a differently-shaped `veo3_video_generations` table
  const tableInfo = await db.all<{ name: string }>("PRAGMA table_info(veo3_video_generations)");
  const columns = (tableInfo || []).map((c) => c.name);

  if ((columns || []).length === 0) {
    // Table does not exist — create it with the intended schema
    await db.run(`
      CREATE TABLE IF NOT EXISTS veo3_video_generations (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        scene_id TEXT UNIQUE,
        operation_name TEXT NOT NULL,
        prompt TEXT NOT NULL,
        seed INTEGER,
        aspect_ratio TEXT,
        status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
        video_url TEXT,
        video_path TEXT,
        error_message TEXT,
        raw_response TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      )
    `);
    logger.info("Created veo3_video_generations table");
  } else {
    // Table exists — add any missing columns required by newer code
    const neededColumns: Array<{ name: string; ddl: string }> = [
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

    for (const col of neededColumns) {
      if (!columns.includes(col.name)) {
        await db.run(`ALTER TABLE veo3_video_generations ADD COLUMN ${col.ddl}`);
        logger.info(`Added ${col.name} column to veo3_video_generations`);
      }
    }
  }

  // Create indexes if the referenced columns exist
  if (!columns.includes("profile_id")) {
    // Re-read columns in case we just created/altered the table
    const refreshed = await db.all<{ name: string }>("PRAGMA table_info(veo3_video_generations)");
    columns.splice(0, columns.length, ...(refreshed || []).map((c) => c.name));
  }

  if (columns.includes("profile_id")) {
    await db.run("CREATE INDEX IF NOT EXISTS idx_veo3_generations_profile_id ON veo3_video_generations(profile_id)");
  }
  if (columns.includes("project_id")) {
    await db.run("CREATE INDEX IF NOT EXISTS idx_veo3_generations_project_id ON veo3_video_generations(project_id)");
  }
  if (columns.includes("status")) {
    await db.run("CREATE INDEX IF NOT EXISTS idx_veo3_generations_status ON veo3_video_generations(status)");
  }
  if (columns.includes("scene_id")) {
    await db.run("CREATE INDEX IF NOT EXISTS idx_veo3_generations_scene_id ON veo3_video_generations(scene_id)");
  }
}
