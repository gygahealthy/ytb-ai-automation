import { Logger } from "../utils/logger.util";
import { SQLiteDatabase } from "./sqlite-database";

const logger = new Logger("DatabaseMigrations");

/**
 * Database migrations
 * Add new migrations here as the schema evolves
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  try {
    // Get current schema version
    const version = await getCurrentVersion(db);
    logger.info(`Current database version: ${version}`);

    // Run migrations in order
    if (version < 1) {
      await migration_001_add_user_agent_and_tags(db);
    }

    // Add more migrations here as needed
    // if (version < 2) {
    //   await migration_002_something_else(db);
    // }

    logger.info("All migrations completed successfully");
  } catch (error) {
    logger.error("Migration failed", error);
    throw error;
  }
}

/**
 * Get current schema version
 */
async function getCurrentVersion(db: SQLiteDatabase): Promise<number> {
  try {
    // Create migrations table if it doesn't exist
    await db.run(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      )
    `);

    // Get latest version
    const result = await db.get<{ version: number }>("SELECT MAX(version) as version FROM schema_migrations");

    return result?.version || 0;
  } catch (error) {
    logger.error("Failed to get current version", error);
    return 0;
  }
}

/**
 * Record migration as completed
 */
async function recordMigration(db: SQLiteDatabase, version: number): Promise<void> {
  await db.run("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)", [version, new Date().toISOString()]);
}

/**
 * Migration 001: Add user_agent and tags columns to profiles table
 */
async function migration_001_add_user_agent_and_tags(db: SQLiteDatabase): Promise<void> {
  logger.info("Running migration 001: Add user_agent and tags columns");

  try {
    // Check if user_agent column exists
    const tableInfo = await db.all<{ name: string }>("PRAGMA table_info(profiles)");
    const columns = tableInfo.map((col) => col.name);

    // Add user_agent column if it doesn't exist
    if (!columns.includes("user_agent")) {
      await db.run("ALTER TABLE profiles ADD COLUMN user_agent TEXT");
      logger.info("Added user_agent column to profiles table");
    }

    // Add tags column if it doesn't exist
    if (!columns.includes("tags")) {
      await db.run("ALTER TABLE profiles ADD COLUMN tags TEXT");
      logger.info("Added tags column to profiles table");
    }

    // Record migration
    await recordMigration(db, 1);
    logger.info("Migration 001 completed successfully");
  } catch (error) {
    logger.error("Migration 001 failed", error);
    throw error;
  }
}
