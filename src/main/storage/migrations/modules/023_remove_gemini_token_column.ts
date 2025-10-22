import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 23;
export const description = "Remove gemini_token column from cookies table";

export async function up(
  db: SQLiteDatabase,
  loggerParam?: Logger
): Promise<void> {
  const logger = loggerParam || new Logger("Migration023");
  logger.info("Running migration 023: Remove gemini_token column from cookies");

  // Check if gemini_token column exists
  const tableInfo = await db.all<{ name: string }>(
    "PRAGMA table_info(cookies)"
  );
  const columns = (tableInfo || []).map((c) => c.name);

  // If gemini_token doesn't exist, migration already applied or not needed
  if (!columns.includes("gemini_token")) {
    logger.info("✅ gemini_token column not found, migration skipped");
    return;
  }

  try {
    logger.info("Creating backup of cookies table...");
    // Drop backup table if it exists from previous failed migration
    await db.run("DROP TABLE IF EXISTS cookies_backup");
    
    await db.run("CREATE TABLE cookies_backup AS SELECT * FROM cookies");

    logger.info("Dropping old cookies table...");
    await db.run("DROP TABLE cookies");

    logger.info("Creating new cookies table without gemini_token...");
    await db.run(`
      CREATE TABLE IF NOT EXISTS cookies (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL,
        url TEXT NOT NULL,
        service TEXT NOT NULL,
        raw_cookie_string TEXT,
        last_rotated_at TEXT,
        spid_expiration TEXT,
        rotation_data TEXT,
        rotation_interval_minutes INTEGER DEFAULT 1440,
        status TEXT NOT NULL CHECK(status IN ('active', 'expired', 'renewal_failed')) DEFAULT 'active',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
        UNIQUE(profile_id, url, service)
      )
    `);

    logger.info("Restoring data from backup (excluding gemini_token)...");
    await db.run(`
      INSERT INTO cookies (
        id, profile_id, url, service, raw_cookie_string,
        last_rotated_at, spid_expiration, rotation_data, rotation_interval_minutes,
        status, created_at, updated_at
      )
      SELECT 
        id, profile_id, url, service, raw_cookie_string,
        last_rotated_at, spid_expiration, rotation_data, rotation_interval_minutes,
        status, created_at, updated_at
      FROM cookies_backup
    `);

    logger.info("Dropping backup table...");
    await db.run("DROP TABLE cookies_backup");

    logger.info("Recreating indexes...");
    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_cookies_profile_id ON cookies(profile_id)"
    );
    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_cookies_status ON cookies(status)"
    );
    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_cookies_last_rotated ON cookies(last_rotated_at)"
    );

    logger.info("✅ Migration 023 completed successfully");
  } catch (error) {
    logger.error("❌ Migration 023 failed", error);
    // Attempt cleanup on failure
    try {
      logger.info("Attempting cleanup after failed migration...");
      await db.run("DROP TABLE IF EXISTS cookies_backup");
      logger.info("Cleanup completed");
    } catch (cleanupError) {
      logger.error("Cleanup also failed", cleanupError);
    }
    throw error;
  }
}
