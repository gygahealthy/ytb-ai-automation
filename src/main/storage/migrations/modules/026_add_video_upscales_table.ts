import { SQLiteDatabase } from "../../sqlite-database";
import { Logger } from "../../../../shared/utils/logger";

export const version = 26;
export const description = "Add veo3_video_upscales table for tracking upscaling operations";

export async function up(db: SQLiteDatabase, logger?: Logger): Promise<void> {
  logger?.info(`[Migration ${version}] ${description}`);

  // Check if table already exists
  const tableExists = await db.get<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='veo3_video_upscales'"
  );

  if (tableExists) {
    logger?.info(`[Migration ${version}] Table veo3_video_upscales already exists, skipping`);
    return;
  }

  // Check if veo3_projects table exists (it should be in base schema)
  const projectsTableExists = await db.get<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='veo3_projects'"
  );

  if (!projectsTableExists) {
    logger?.warn(
      `[Migration ${version}] veo3_projects table not found. Creating veo3_video_upscales without project_id foreign key constraint.`
    );
  }

  // Create veo3_video_upscales table
  // Note: Only add project_id FK if veo3_projects table exists
  const createTableSQL = projectsTableExists
    ? `
    CREATE TABLE IF NOT EXISTS veo3_video_upscales (
      id TEXT PRIMARY KEY,
      source_generation_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
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
      completed_at TEXT,
      FOREIGN KEY (source_generation_id) REFERENCES veo3_video_generations(id) ON DELETE CASCADE,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES veo3_projects(id) ON DELETE CASCADE
    )
  `
    : `
    CREATE TABLE IF NOT EXISTS veo3_video_upscales (
      id TEXT PRIMARY KEY,
      source_generation_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
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
      completed_at TEXT,
      FOREIGN KEY (source_generation_id) REFERENCES veo3_video_generations(id) ON DELETE CASCADE,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    )
  `;

  await db.run(createTableSQL);

  logger?.info(`[Migration ${version}] Created table veo3_video_upscales`);

  // Create indexes for common queries
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

  logger?.info(`[Migration ${version}] Created indexes for veo3_video_upscales`);
  logger?.info(`[Migration ${version}] Migration completed successfully`);
}
