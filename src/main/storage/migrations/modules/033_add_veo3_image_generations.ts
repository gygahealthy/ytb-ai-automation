import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 33;
export const description = "Create veo3_image_generations table";

export async function up(db: SQLiteDatabase, loggerParam?: Logger): Promise<void> {
  const logger = loggerParam || new Logger("Migration033");
  logger.info("Running migration 033: Create veo3_image_generations table");

  // Check existing table columns
  const tableInfo = await db.all<{ name: string }>("PRAGMA table_info(veo3_image_generations)");
  const columns = (tableInfo || []).map((c) => c.name);

  if ((columns || []).length === 0) {
    // Table does not exist — create it with the intended schema
    await db.run(`
      CREATE TABLE IF NOT EXISTS veo3_image_generations (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL,
        name TEXT NOT NULL,
        aspect_ratio TEXT,
        workflow_id TEXT NOT NULL,
        media_key TEXT NOT NULL,
        local_path TEXT,
        fife_url TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      )
    `);
    logger.info("✅ Created veo3_image_generations table");
  } else {
    // Table exists — add any missing columns
    const neededColumns: Array<{ name: string; ddl: string }> = [
      { name: "name", ddl: "name TEXT" },
      { name: "aspect_ratio", ddl: "aspect_ratio TEXT" },
      { name: "workflow_id", ddl: "workflow_id TEXT" },
      { name: "media_key", ddl: "media_key TEXT" },
      { name: "local_path", ddl: "local_path TEXT" },
      { name: "fife_url", ddl: "fife_url TEXT" },
      { name: "created_at", ddl: "created_at TEXT" },
    ];

    for (const col of neededColumns) {
      if (!columns.includes(col.name)) {
        await db.run(`ALTER TABLE veo3_image_generations ADD COLUMN ${col.ddl}`);
        logger.info(`✅ Added ${col.name} column to veo3_image_generations`);
      }
    }
  }

  // Create indexes
  const refreshed = await db.all<{ name: string }>("PRAGMA table_info(veo3_image_generations)");
  const finalColumns = (refreshed || []).map((c) => c.name);

  if (finalColumns.includes("profile_id")) {
    await db.run("CREATE INDEX IF NOT EXISTS idx_veo3_images_profile_id ON veo3_image_generations(profile_id)");
    logger.info("✅ Created index idx_veo3_images_profile_id");
  }
  if (finalColumns.includes("workflow_id")) {
    await db.run("CREATE INDEX IF NOT EXISTS idx_veo3_images_workflow_id ON veo3_image_generations(workflow_id)");
    logger.info("✅ Created index idx_veo3_images_workflow_id");
  }
  if (finalColumns.includes("media_key")) {
    await db.run("CREATE INDEX IF NOT EXISTS idx_veo3_images_media_key ON veo3_image_generations(media_key)");
    logger.info("✅ Created index idx_veo3_images_media_key");
  }

  logger.info("✅ Migration 033 completed successfully");
}
