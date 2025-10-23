import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 24;
export const description = "Add per-cookie rotation configuration columns to cookies table";

export async function up(db: SQLiteDatabase, loggerParam?: Logger): Promise<void> {
  const logger = loggerParam || new Logger("Migration024");
  logger.info("Running migration 024: Add cookie rotation configuration columns");

  try {
    // Check which columns already exist
    const tableInfo = await db.all<{ name: string }>("PRAGMA table_info(cookies)");
    const existingColumns = (tableInfo || []).map((c) => c.name);

    // Add launch_worker_on_startup column if it doesn't exist
    if (!existingColumns.includes("launch_worker_on_startup")) {
      await db.run(`
        ALTER TABLE cookies
        ADD COLUMN launch_worker_on_startup INTEGER DEFAULT 0
      `);
      logger.info("✅ Added launch_worker_on_startup column");
    } else {
      logger.info("⚠️  launch_worker_on_startup column already exists");
    }

    // Add enabled_rotation_methods column if it doesn't exist
    if (!existingColumns.includes("enabled_rotation_methods")) {
      await db.run(`
        ALTER TABLE cookies
        ADD COLUMN enabled_rotation_methods TEXT DEFAULT '["refreshCreds","rotateCookie"]'
      `);
      logger.info("✅ Added enabled_rotation_methods column");
    } else {
      logger.info("⚠️  enabled_rotation_methods column already exists");
    }

    // Add rotation_method_order column if it doesn't exist
    if (!existingColumns.includes("rotation_method_order")) {
      await db.run(`
        ALTER TABLE cookies
        ADD COLUMN rotation_method_order TEXT DEFAULT '["refreshCreds","rotateCookie","headless"]'
      `);
      logger.info("✅ Added rotation_method_order column");
    } else {
      logger.info("⚠️  rotation_method_order column already exists");
    }

    // Create index for launch_worker_on_startup
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_cookies_launch_on_startup 
      ON cookies(launch_worker_on_startup) WHERE launch_worker_on_startup = 1
    `);
    logger.info("✅ Created index idx_cookies_launch_on_startup");

    logger.info("✅ Migration 024 completed successfully");
  } catch (error) {
    logger.error("❌ Migration 024 failed", error);
    throw error;
  }
}
