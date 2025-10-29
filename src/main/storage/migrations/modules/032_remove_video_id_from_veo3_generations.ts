import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 32;
export const description = "Remove video_id and other unused columns from veo3_video_generations";

export async function up(db: SQLiteDatabase, loggerParam?: Logger): Promise<void> {
  const logger = loggerParam || new Logger("Migration032");
  logger.info("Running migration 032: Remove video_id from veo3_video_generations");

  // Check if the table exists
  const tableInfo = await db.all<{ name: string }>("PRAGMA table_info(veo3_video_generations)");
  const columns = (tableInfo || []).map((c) => c.name);

  if (columns.length === 0) {
    logger.info("Table veo3_video_generations does not exist, skipping migration");
    return;
  }

  // Check if video_id column exists (the problematic column)
  const hasVideoId = columns.includes("video_id");
  const hasTitle = columns.includes("title");
  const hasDescription = columns.includes("description");
  const hasMetadata = columns.includes("metadata");
  const hasProgressPercent = columns.includes("progress_percent");
  const hasGeneratedAt = columns.includes("generated_at");

  if (!hasVideoId && !hasTitle && !hasDescription && !hasMetadata && !hasProgressPercent && !hasGeneratedAt) {
    logger.info("No problematic columns found, table already has correct schema");
    return;
  }

  logger.info("Recreating veo3_video_generations table without video_id and other unused columns");

  // Backup existing data to a temporary table
  await db.run(`
    CREATE TABLE veo3_video_generations_backup AS 
    SELECT 
      id,
      profile_id,
      project_id,
      scene_id,
      operation_name,
      prompt,
      seed,
      aspect_ratio,
      status,
      ${columns.includes("media_generation_id") ? "media_generation_id" : "NULL as media_generation_id"},
      ${columns.includes("fife_url") ? "fife_url" : "NULL as fife_url"},
      ${columns.includes("serving_base_uri") ? "serving_base_uri" : "NULL as serving_base_uri"},
      video_url,
      video_path,
      error_message,
      raw_response,
      created_at,
      updated_at,
      ${columns.includes("completed_at") ? "completed_at" : "NULL as completed_at"}
    FROM veo3_video_generations
  `);
  logger.info("Backed up existing data to veo3_video_generations_backup");

  // Drop the old table
  await db.run("DROP TABLE veo3_video_generations");
  logger.info("Dropped old veo3_video_generations table");

  // Create the new table with correct schema
  await db.run(`
    CREATE TABLE veo3_video_generations (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      scene_id TEXT,
      operation_name TEXT,
      prompt TEXT,
      seed INTEGER,
      aspect_ratio TEXT,
      status TEXT,
      media_generation_id TEXT,
      fife_url TEXT,
      serving_base_uri TEXT,
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
  logger.info("Created new veo3_video_generations table with correct schema");

  // Restore data from backup
  await db.run(`
    INSERT INTO veo3_video_generations 
    SELECT * FROM veo3_video_generations_backup
  `);
  logger.info("Restored data from backup");

  // Drop backup table
  await db.run("DROP TABLE veo3_video_generations_backup");
  logger.info("Dropped backup table");

  // Recreate indexes
  await db.run("CREATE INDEX IF NOT EXISTS idx_veo3_generations_profile_id ON veo3_video_generations(profile_id)");
  await db.run("CREATE INDEX IF NOT EXISTS idx_veo3_generations_project_id ON veo3_video_generations(project_id)");
  await db.run("CREATE INDEX IF NOT EXISTS idx_veo3_generations_status ON veo3_video_generations(status)");
  await db.run("CREATE INDEX IF NOT EXISTS idx_veo3_generations_scene_id ON veo3_video_generations(scene_id)");
  logger.info("Recreated indexes");

  logger.info("Migration 032 completed successfully");
}
