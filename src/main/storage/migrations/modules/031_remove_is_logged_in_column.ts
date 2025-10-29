import { SQLiteDatabase } from "../../sqlite-database";
import { Logger } from "../../../../shared/utils/logger";

export const version = 31;
export const description = "Remove is_logged_in column from profiles table";

/**
 * Migration 031: Remove is_logged_in column from profiles table
 *
 * Rationale:
 * The is_logged_in flag is redundant and creates unnecessary coupling between
 * profile state and cookie state. A profile should be considered "logged in"
 * if it has valid, non-expired cookies - not based on a separate boolean flag.
 *
 * This migration:
 * 1. Removes the is_logged_in column from the profiles table
 * 2. Authentication checks should now query the cookies table directly
 *
 * Impact:
 * - Services should check for active cookies instead of isLoggedIn flag
 * - UI components should derive login status from cookie presence
 */
export async function up(db: SQLiteDatabase, logger?: Logger): Promise<void> {
  const log = logger || new Logger("Migration031");

  try {
    log.info("Starting migration 031: Remove is_logged_in column");

    // Check if the column exists
    const columns = await db.all("PRAGMA table_info(profiles)");
    const hasIsLoggedIn = columns.some((c: any) => c.name === "is_logged_in");

    if (!hasIsLoggedIn) {
      log.info("Column is_logged_in does not exist, skipping migration");
      return;
    }

    log.info("Creating new profiles table without is_logged_in column");

    // SQLite doesn't support DROP COLUMN directly, so we need to:
    // 1. Create a new table without the column
    // 2. Copy data from old table
    // 3. Drop old table
    // 4. Rename new table

    await db.run(`
      CREATE TABLE profiles_new (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        browser_path TEXT,
        user_data_dir TEXT NOT NULL,
        user_agent TEXT,
        proxy_server TEXT,
        proxy_username TEXT,
        proxy_password TEXT,
        credit_remaining REAL DEFAULT 0,
        tags TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    log.info("Copying data from old profiles table to new table");

    await db.run(`
      INSERT INTO profiles_new (
        id, name, browser_path, user_data_dir, user_agent,
        proxy_server, proxy_username, proxy_password,
        credit_remaining, tags, created_at, updated_at
      )
      SELECT 
        id, name, browser_path, user_data_dir, user_agent,
        proxy_server, proxy_username, proxy_password,
        credit_remaining, tags, created_at, updated_at
      FROM profiles
    `);

    log.info("Dropping old profiles table");
    await db.run("DROP TABLE profiles");

    log.info("Renaming new profiles table");
    await db.run("ALTER TABLE profiles_new RENAME TO profiles");

    log.info("Migration 031 completed successfully");
  } catch (error) {
    log.error("Migration 031 failed", error);
    throw error;
  }
}
