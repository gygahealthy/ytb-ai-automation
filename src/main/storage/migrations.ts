import { Logger } from "../../shared/utils/logger";
import { SQLiteDatabase } from "./sqlite-database";
import * as fs from "fs";
import * as path from "path";
import * as sqlite3 from "sqlite3";

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

    if (version < 2) {
      await migration_002_add_is_logged_in(db);
    }

    // Add more migrations here as needed
    // if (version < 3) {
    //   await migration_003_something_else(db);
    // }

    if (version < 3) {
      await migration_003_add_master_prompts(db);
    }

    if (version < 4) {
      await migration_004_migrate_profiles_from_local_db(db);
    }

    if (version < 5) {
      await migration_005_add_master_prompts_flags_and_tags(db);
    }

    logger.info("All migrations completed successfully");
  } catch (error) {
    logger.error("Migration failed", error);
    throw error;
  }
}

/**
 * Migration 005: Add tags, is_active, and archived columns to master_prompts
 */
async function migration_005_add_master_prompts_flags_and_tags(db: SQLiteDatabase): Promise<void> {
  const loggerLocal = logger;
  loggerLocal.info('Running migration 005: Add tags/is_active/archived to master_prompts');
  try {
    const tableInfo = await db.all<{ name: string }>('PRAGMA table_info(master_prompts)');
    const columns = tableInfo.map((c) => c.name);
    if (!columns.includes('tags')) {
      await db.run('ALTER TABLE master_prompts ADD COLUMN tags TEXT');
      loggerLocal.info('Added tags column to master_prompts');
    }
    if (!columns.includes('is_active')) {
      await db.run('ALTER TABLE master_prompts ADD COLUMN is_active INTEGER DEFAULT 1');
      loggerLocal.info('Added is_active column to master_prompts');
    }
    if (!columns.includes('archived')) {
      await db.run('ALTER TABLE master_prompts ADD COLUMN archived INTEGER DEFAULT 0');
      loggerLocal.info('Added archived column to master_prompts');
    }

    await recordMigration(db, 5);
    loggerLocal.info('Migration 005 completed successfully');
  } catch (error) {
    loggerLocal.error('Migration 005 failed', error);
    throw error;
  }
}

/**
 * Migration 004: If a legacy DB exists in ./data/veo3-automation.db, import profiles into the userdata DB
 */
async function migration_004_migrate_profiles_from_local_db(db: SQLiteDatabase): Promise<void> {
  const loggerLocal = logger;
  loggerLocal.info("Running migration 004: Migrate profiles from ./data/veo3-automation.db if present");

  try {
    const legacyPath = path.resolve(process.cwd(), "data", "veo3-automation.db");
    if (!fs.existsSync(legacyPath)) {
      loggerLocal.info("No legacy DB found at ./data/veo3-automation.db, skipping migration 004");
      await recordMigration(db, 4);
      return;
    }

    loggerLocal.info(`Found legacy DB at ${legacyPath}, importing profiles`);

    // Open legacy database directly using sqlite3 to read profiles
    const legacyDb = new sqlite3.Database(legacyPath);

    const allProfiles: any[] = await new Promise((resolve, reject) => {
      legacyDb.all("SELECT * FROM profiles", (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });

    loggerLocal.info(`Found ${allProfiles.length} profiles in legacy DB`);

    for (const row of allProfiles) {
      // Check if profile already exists in target DB
      const exists = await db.get<{ id: string }>("SELECT id FROM profiles WHERE id = ?", [row.id]);
      if (exists && exists.id) {
        loggerLocal.info(`Profile ${row.id} already exists in target DB, skipping`);
        continue;
      }

      // Insert profile into the centralized DB
      await db.run(
        `INSERT OR IGNORE INTO profiles (
          id, name, browser_path, user_data_dir, user_agent, proxy_server, proxy_username, proxy_password,
          credit_remaining, tags, cookies, cookie_expires, is_logged_in, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row.id,
          row.name,
          row.browser_path || null,
          row.user_data_dir || '',
          row.user_agent || null,
          row.proxy_server || null,
          row.proxy_username || null,
          row.proxy_password || null,
          row.credit_remaining != null ? row.credit_remaining : 0,
          row.tags || null,
          row.cookies || null,
          row.cookie_expires || null,
          row.is_logged_in != null ? row.is_logged_in : 0,
          row.created_at || new Date().toISOString(),
          row.updated_at || new Date().toISOString(),
        ]
      );
      loggerLocal.info(`Imported profile ${row.id}`);
    }

    // Close legacy DB
    legacyDb.close();

    // Record migration success
    await recordMigration(db, 4);
    loggerLocal.info("Migration 004 completed successfully");
  } catch (error) {
    loggerLocal.error("Migration 004 failed", error);
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

/**
 * Migration 002: Add is_logged_in column to profiles table
 */
async function migration_002_add_is_logged_in(db: SQLiteDatabase): Promise<void> {
  logger.info("Running migration 002: Add is_logged_in column");

  try {
    // Check if is_logged_in column exists
    const tableInfo = await db.all<{ name: string }>("PRAGMA table_info(profiles)");
    const columns = tableInfo.map((col) => col.name);

    // Add is_logged_in column if it doesn't exist
    if (!columns.includes("is_logged_in")) {
      await db.run("ALTER TABLE profiles ADD COLUMN is_logged_in INTEGER DEFAULT 0");
      logger.info("Added is_logged_in column to profiles table");
    }

    // Record migration
    await recordMigration(db, 2);
    logger.info("Migration 002 completed successfully");
  } catch (error) {
    logger.error("Migration 002 failed", error);
    throw error;
  }
}

/**
 * Migration 003: Create master_prompts table
 */
async function migration_003_add_master_prompts(db: SQLiteDatabase): Promise<void> {
  const loggerLocal = logger;
  loggerLocal.info("Running migration 003: Create master_prompts table");
  try {
    const tableInfo = await db.all<{ name: string }>("PRAGMA table_info(master_prompts)");
    const columns = tableInfo.map((c) => c.name);
    if (columns.length === 0) {
      await db.run(`
        CREATE TABLE IF NOT EXISTS master_prompts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          provider TEXT NOT NULL,
          prompt_kind TEXT NOT NULL,
          prompt_template TEXT NOT NULL,
          description TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE(provider, prompt_kind)
        )
      `);
      await db.run("CREATE INDEX IF NOT EXISTS idx_master_prompts_provider ON master_prompts(provider)");
      await db.run("CREATE INDEX IF NOT EXISTS idx_master_prompts_kind ON master_prompts(prompt_kind)");
      await recordMigration(db, 3);
      loggerLocal.info("Migration 003 completed successfully");
    } else {
      loggerLocal.info("master_prompts table already exists, skipping migration 003");
      await recordMigration(db, 3);
    }
  } catch (error) {
    loggerLocal.error("Migration 003 failed", error);
    throw error;
  }
}
