import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 25;
export const description = "Add required_cookies column to cookies table for per-page validation";

export async function up(db: SQLiteDatabase, loggerParam?: Logger): Promise<void> {
  const logger = loggerParam || new Logger("Migration025");
  logger.info("Running migration 025: Add required_cookies column to cookies table");

  try {
    // Check if column already exists
    const tableInfo = await db.all<{ name: string }>("PRAGMA table_info(cookies)");
    const existingColumns = (tableInfo || []).map((c) => c.name);

    // Add required_cookies column if it doesn't exist
    if (!existingColumns.includes("required_cookies")) {
      await db.run(`
        ALTER TABLE cookies
        ADD COLUMN required_cookies TEXT DEFAULT NULL
      `);
      logger.info("✅ Added required_cookies column");
    } else {
      logger.info("⚠️  required_cookies column already exists");
    }

    // Create index for non-null required_cookies (for filtering records with validation)
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_cookies_required_cookies 
      ON cookies(required_cookies) WHERE required_cookies IS NOT NULL
    `);
    logger.info("✅ Created index idx_cookies_required_cookies");

    logger.info("✅ Migration 025 completed successfully");
  } catch (error) {
    logger.error("❌ Migration 025 failed", error);
    throw error;
  }
}
