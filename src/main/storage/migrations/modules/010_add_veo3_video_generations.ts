import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 10;
export const description = "Create veo3_video_generations table";

export async function up(
  db: SQLiteDatabase,
  loggerParam?: Logger
): Promise<void> {
  const logger = loggerParam || new Logger("Migration010");
  logger.info("Running migration 010: Create veo3_video_generations table");
  await db.run(`
    CREATE TABLE IF NOT EXISTS veo3_video_generations (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      scene_id TEXT NOT NULL UNIQUE,
      operation_name TEXT NOT NULL,
      prompt TEXT NOT NULL,
      seed INTEGER NOT NULL,
      aspect_ratio TEXT NOT NULL,
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
  await db.run(
    "CREATE INDEX IF NOT EXISTS idx_veo3_generations_profile_id ON veo3_video_generations(profile_id)"
  );
  await db.run(
    "CREATE INDEX IF NOT EXISTS idx_veo3_generations_project_id ON veo3_video_generations(project_id)"
  );
  await db.run(
    "CREATE INDEX IF NOT EXISTS idx_veo3_generations_status ON veo3_video_generations(status)"
  );
  await db.run(
    "CREATE INDEX IF NOT EXISTS idx_veo3_generations_scene_id ON veo3_video_generations(scene_id)"
  );
}
