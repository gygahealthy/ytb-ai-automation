import { SQLiteDatabase } from "../../sqlite-database";
import { Logger } from "../../../../shared/utils/logger";

export const version = 30;
export const description = "Fix foreign key constraints on veo3_video_upscales table - disable constraint enforcement on insert";

export async function up(db: SQLiteDatabase, logger?: Logger): Promise<void> {
  logger?.info(`[Migration ${version}] ${description}`);

  // Check if table exists
  const tableExists = await db.get<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='veo3_video_upscales'"
  );

  if (!tableExists) {
    logger?.info(`[Migration ${version}] Table veo3_video_upscales does not exist, skipping`);
    return;
  }

  logger?.info(`[Migration ${version}] Disabling foreign keys temporarily...`);

  // Disable foreign key constraint checking temporarily
  await db.run("PRAGMA foreign_keys = OFF");

  try {
    // Get current table structure to preserve data
    logger?.info(`[Migration ${version}] Creating new table with no foreign key constraints...`);

    // Create new table without ANY foreign key constraints
    // This allows inserting records even if referenced records don't exist
    await db.run(`
      CREATE TABLE IF NOT EXISTS veo3_video_upscales_new (
        id TEXT PRIMARY KEY,
        source_generation_id TEXT,
        profile_id TEXT,
        project_id TEXT,
        scene_id TEXT NOT NULL,
        operation_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        model TEXT NOT NULL DEFAULT 'veo_2_1080p_upsampler_8s',
        seed INTEGER,
        aspect_ratio TEXT,
        media_generation_id TEXT,
        fife_url TEXT,
        serving_base_uri TEXT,
        video_url TEXT,
        video_path TEXT,
        error_message TEXT,
        raw_response TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT
      )
    `);

    logger?.info(`[Migration ${version}] Created temporary table without constraints`);

    // Copy all data from old table to new table
    await db.run(`
      INSERT INTO veo3_video_upscales_new 
      SELECT * FROM veo3_video_upscales
    `);

    logger?.info(`[Migration ${version}] Copied data to new table`);

    // Drop indexes on old table
    await db.run(`DROP INDEX IF EXISTS idx_veo3_video_upscales_source_generation_id`);
    await db.run(`DROP INDEX IF EXISTS idx_veo3_video_upscales_profile_id`);
    await db.run(`DROP INDEX IF EXISTS idx_veo3_video_upscales_status`);
    await db.run(`DROP INDEX IF EXISTS idx_veo3_video_upscales_created_at`);

    // Drop old table
    await db.run(`DROP TABLE IF EXISTS veo3_video_upscales`);

    logger?.info(`[Migration ${version}] Dropped old table`);

    // Rename new table
    await db.run(`ALTER TABLE veo3_video_upscales_new RENAME TO veo3_video_upscales`);

    logger?.info(`[Migration ${version}] Renamed new table to veo3_video_upscales`);

    // Recreate indexes for better query performance
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_veo3_video_upscales_source_generation_id 
      ON veo3_video_upscales(source_generation_id)
    `);

    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_veo3_video_upscales_profile_id 
      ON veo3_video_upscales(profile_id)
    `);

    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_veo3_video_upscales_status 
      ON veo3_video_upscales(status)
    `);

    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_veo3_video_upscales_created_at 
      ON veo3_video_upscales(created_at)
    `);

    logger?.info(`[Migration ${version}] Recreated indexes for veo3_video_upscales`);
  } finally {
    // Re-enable foreign key constraint checking
    logger?.info(`[Migration ${version}] Re-enabling foreign keys...`);
    await db.run("PRAGMA foreign_keys = ON");
  }

  logger?.info(`[Migration ${version}] Migration completed successfully`);
}
