import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as sqlite3 from "sqlite3";
import { Logger } from "../../shared/utils/logger";
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

    if (version < 6) {
      await migration_006_add_prompt_history_table(db);
    }

    if (version < 7) {
      await migration_007_add_prompt_history_digest(db);
    }

    if (version < 8) {
      await migration_008_backfill_prompt_history_digest(db);
    }

    if (version < 9) {
      await migration_009_add_prompt_history_digest_short(db);
    }

    if (version < 10) {
      await migration_010_add_veo3_video_generations(db);
    }

    if (version < 11) {
      await migration_011_add_video_metadata_fields(db);
    }

    if (version < 12) {
      await migration_012_add_channel_id_to_master_prompts(db);
    }

    if (version < 13) {
      await migration_013_add_prompt_type_and_channel_support(db);
    }

    if (version < 14) {
      await migration_014_seed_master_prompt_types(db);
    }

    if (version < 15) {
      await migration_015_cleanup_duplicate_prompt_types(db);
    }

    if (version < 16) {
      await migration_016_add_type_code_and_status_to_prompt_types(db);
    }

    if (version < 17) {
      await migration_017_add_prompt_type_id_foreign_key(db);
    }

    if (version < 18) {
      await migration_018_restructure_master_prompts_table(db);
    }

    if (version < 19) {
      await migration_019_populate_master_prompt_types(db);
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
async function migration_005_add_master_prompts_flags_and_tags(
  db: SQLiteDatabase
): Promise<void> {
  const loggerLocal = logger;
  loggerLocal.info(
    "Running migration 005: Add tags/is_active/archived to master_prompts"
  );
  try {
    const tableInfo = await db.all<{ name: string }>(
      "PRAGMA table_info(master_prompts)"
    );
    const columns = tableInfo.map((c) => c.name);
    if (!columns.includes("tags")) {
      await db.run("ALTER TABLE master_prompts ADD COLUMN tags TEXT");
      loggerLocal.info("Added tags column to master_prompts");
    }
    if (!columns.includes("is_active")) {
      await db.run(
        "ALTER TABLE master_prompts ADD COLUMN is_active INTEGER DEFAULT 1"
      );
      loggerLocal.info("Added is_active column to master_prompts");
    }
    if (!columns.includes("archived")) {
      await db.run(
        "ALTER TABLE master_prompts ADD COLUMN archived INTEGER DEFAULT 0"
      );
      loggerLocal.info("Added archived column to master_prompts");
    }

    await recordMigration(db, 5);
    loggerLocal.info("Migration 005 completed successfully");
  } catch (error) {
    loggerLocal.error("Migration 005 failed", error);
    throw error;
  }
}

/**
 * Migration 006: Add master_prompt_history table for version control
 */
async function migration_006_add_prompt_history_table(
  db: SQLiteDatabase
): Promise<void> {
  const loggerLocal = logger;
  loggerLocal.info("Running migration 006: Add master_prompt_history table");
  try {
    await db.run(`
      CREATE TABLE IF NOT EXISTS master_prompt_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt_id INTEGER NOT NULL,
        provider TEXT NOT NULL,
        prompt_kind TEXT NOT NULL,
        prompt_template TEXT NOT NULL,
        description TEXT,
        tags TEXT,
        is_active INTEGER DEFAULT 1,
        archived INTEGER DEFAULT 0,
        change_note TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (prompt_id) REFERENCES master_prompts(id) ON DELETE CASCADE
      )
    `);
    loggerLocal.info("Created master_prompt_history table");

    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_prompt_history_prompt_id ON master_prompt_history(prompt_id)"
    );
    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_prompt_history_created_at ON master_prompt_history(created_at)"
    );
    loggerLocal.info("Created indexes for master_prompt_history table");

    await recordMigration(db, 6);
    loggerLocal.info("Migration 006 completed successfully");
  } catch (error) {
    loggerLocal.error("Migration 006 failed", error);
    throw error;
  }
}

/**
 * Migration 007: Add digest column to master_prompt_history for duplicate detection
 */
async function migration_007_add_prompt_history_digest(
  db: SQLiteDatabase
): Promise<void> {
  const loggerLocal = logger;
  loggerLocal.info(
    "Running migration 007: Add digest column to master_prompt_history"
  );
  try {
    const tableInfo = await db.all<{ name: string }>(
      "PRAGMA table_info(master_prompt_history)"
    );
    const columns = tableInfo.map((c) => c.name);
    if (!columns.includes("digest")) {
      await db.run("ALTER TABLE master_prompt_history ADD COLUMN digest TEXT");
      loggerLocal.info("Added digest column to master_prompt_history");
    }

    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_prompt_history_digest ON master_prompt_history(digest)"
    );
    loggerLocal.info("Created digest index for master_prompt_history");

    await recordMigration(db, 7);
    loggerLocal.info("Migration 007 completed successfully");
  } catch (error) {
    loggerLocal.error("Migration 007 failed", error);
    throw error;
  }
}

// helper to normalize tags and compute digest (same rules as repository)
function normalizeTagsForDigest(tagsJson: string | null | undefined): string[] {
  if (!tagsJson) return [];
  try {
    const tags = JSON.parse(tagsJson);
    if (!Array.isArray(tags)) return [];
    return (tags as any[])
      .map((t) => (t || "").toString().trim().toLowerCase())
      .filter((t) => t.length > 0)
      .sort();
  } catch {
    return [];
  }
}

function computeDigestForMigration(
  template: string | null | undefined,
  description: string | null | undefined,
  tagsJson: string | null | undefined
) {
  const t = (template || "").toString().trim();
  const d = (description || "").toString().trim();
  const tags = normalizeTagsForDigest(tagsJson);
  const payload = JSON.stringify({ t, d, tags });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

/**
 * Migration 008: Backfill digest values for existing master_prompt_history rows
 */
async function migration_008_backfill_prompt_history_digest(
  db: SQLiteDatabase
): Promise<void> {
  const loggerLocal = logger;
  loggerLocal.info(
    "Running migration 008: Backfill master_prompt_history.digest for existing rows"
  );
  try {
    // Ensure digest column exists (some DBs may not have it yet)
    const tableInfo = await db.all<{ name: string }>(
      "PRAGMA table_info(master_prompt_history)"
    );
    const columns = tableInfo.map((c) => c.name);
    if (!columns.includes("digest")) {
      loggerLocal.info("digest column missing, adding it now");
      await db.run("ALTER TABLE master_prompt_history ADD COLUMN digest TEXT");
      await db.run(
        "CREATE INDEX IF NOT EXISTS idx_prompt_history_digest ON master_prompt_history(digest)"
      );
    }

    const rows = await db.all<any>(
      "SELECT id, prompt_template, description, tags FROM master_prompt_history"
    );
    let updated = 0;
    for (const r of rows || []) {
      // compute digest whether or not a digest value exists
      const digest = computeDigestForMigration(
        r.prompt_template,
        r.description,
        r.tags
      );
      // update only if different or null
      await db.run("UPDATE master_prompt_history SET digest = ? WHERE id = ?", [
        digest,
        r.id,
      ]);
      updated += 1;
    }
    loggerLocal.info(
      `Backfilled digest for ${updated} master_prompt_history rows`
    );

    await recordMigration(db, 8);
    loggerLocal.info("Migration 008 completed successfully");
  } catch (error) {
    loggerLocal.error("Migration 008 failed", error);
    throw error;
  }
}

/**
 * Migration 009: Add digest_short column (indexed) and backfill from digest
 */
async function migration_009_add_prompt_history_digest_short(
  db: SQLiteDatabase
): Promise<void> {
  const loggerLocal = logger;
  loggerLocal.info(
    "Running migration 009: Add digest_short column to master_prompt_history"
  );
  try {
    const tableInfo = await db.all<{ name: string }>(
      "PRAGMA table_info(master_prompt_history)"
    );
    const columns = tableInfo.map((c) => c.name);
    if (!columns.includes("digest_short")) {
      await db.run(
        "ALTER TABLE master_prompt_history ADD COLUMN digest_short TEXT"
      );
      loggerLocal.info("Added digest_short column to master_prompt_history");
    }

    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_prompt_history_digest_short ON master_prompt_history(digest_short)"
    );
    loggerLocal.info("Created digest_short index");

    // backfill digest_short from existing digest values
    const rows = await db.all<any>(
      "SELECT id, digest FROM master_prompt_history"
    );
    for (const r of rows || []) {
      if (r.digest && (!r.digest_short || r.digest_short.length === 0)) {
        const short = r.digest.substring(0, 12);
        await db.run(
          "UPDATE master_prompt_history SET digest_short = ? WHERE id = ?",
          [short, r.id]
        );
      }
    }

    await recordMigration(db, 9);
    loggerLocal.info("Migration 009 completed successfully");
  } catch (error) {
    loggerLocal.error("Migration 009 failed", error);
    throw error;
  }
}

/**
 * Migration 004: If a legacy DB exists in ./data/veo3-automation.db, import profiles into the userdata DB
 */
async function migration_004_migrate_profiles_from_local_db(
  db: SQLiteDatabase
): Promise<void> {
  const loggerLocal = logger;
  loggerLocal.info(
    "Running migration 004: Migrate profiles from ./data/veo3-automation.db if present"
  );

  try {
    const legacyPath = path.resolve(
      process.cwd(),
      "data",
      "veo3-automation.db"
    );
    if (!fs.existsSync(legacyPath)) {
      loggerLocal.info(
        "No legacy DB found at ./data/veo3-automation.db, skipping migration 004"
      );
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
      const exists = await db.get<{ id: string }>(
        "SELECT id FROM profiles WHERE id = ?",
        [row.id]
      );
      if (exists && exists.id) {
        loggerLocal.info(
          `Profile ${row.id} already exists in target DB, skipping`
        );
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
          row.user_data_dir || "",
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
    const result = await db.get<{ version: number }>(
      "SELECT MAX(version) as version FROM schema_migrations"
    );

    return result?.version || 0;
  } catch (error) {
    logger.error("Failed to get current version", error);
    return 0;
  }
}

/**
 * Record migration as completed
 */
async function recordMigration(
  db: SQLiteDatabase,
  version: number
): Promise<void> {
  await db.run(
    "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
    [version, new Date().toISOString()]
  );
}

/**
 * Migration 001: Add user_agent and tags columns to profiles table
 */
async function migration_001_add_user_agent_and_tags(
  db: SQLiteDatabase
): Promise<void> {
  logger.info("Running migration 001: Add user_agent and tags columns");

  try {
    // Check if user_agent column exists
    const tableInfo = await db.all<{ name: string }>(
      "PRAGMA table_info(profiles)"
    );
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
async function migration_002_add_is_logged_in(
  db: SQLiteDatabase
): Promise<void> {
  logger.info("Running migration 002: Add is_logged_in column");

  try {
    // Check if is_logged_in column exists
    const tableInfo = await db.all<{ name: string }>(
      "PRAGMA table_info(profiles)"
    );
    const columns = tableInfo.map((col) => col.name);

    // Add is_logged_in column if it doesn't exist
    if (!columns.includes("is_logged_in")) {
      await db.run(
        "ALTER TABLE profiles ADD COLUMN is_logged_in INTEGER DEFAULT 0"
      );
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
 * Migration 010: Create veo3_video_generations table
 */
async function migration_010_add_veo3_video_generations(
  db: SQLiteDatabase
): Promise<void> {
  const loggerLocal = logger;
  loggerLocal.info(
    "Running migration 010: Create veo3_video_generations table"
  );
  try {
    await db.run(`
      CREATE TABLE IF NOT EXISTS veo3_video_generations (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        scene_id TEXT NOT NULL UNIQUE,
        operation_name TEXT NOT NULL,
        prompt TEXT NOT NULL,
        seed INTEGER NOT NULL,
        aspect_ratio TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
        video_url TEXT,
        video_path TEXT,
        error_message TEXT,
        raw_response TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      )
    `);
    loggerLocal.info("Created veo3_video_generations table");

    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_veo3_generations_profile_id ON veo3_video_generations(profile_id)"
    );
    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_veo3_generations_project_id ON veo3_video_generations(project_id)"
    );
    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_veo3_generations_status ON veo3_video_generations(status)"
    );
    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_veo3_generations_scene_id ON veo3_video_generations(scene_id)"
    );
    loggerLocal.info("Created indexes for veo3_video_generations table");

    await recordMigration(db, 10);
    loggerLocal.info("Migration 010 completed successfully");
  } catch (error) {
    loggerLocal.error("Migration 010 failed", error);
    throw error;
  }
}

/**
 * Migration 011: Add media_generation_id, fife_url, and serving_base_uri to veo3_video_generations
 */
async function migration_011_add_video_metadata_fields(
  db: SQLiteDatabase
): Promise<void> {
  const loggerLocal = logger;
  loggerLocal.info(
    "Running migration 011: Add video metadata fields to veo3_video_generations"
  );
  try {
    const tableInfo = await db.all<{ name: string }>(
      "PRAGMA table_info(veo3_video_generations)"
    );
    const columns = tableInfo.map((c) => c.name);

    if (!columns.includes("media_generation_id")) {
      await db.run(
        "ALTER TABLE veo3_video_generations ADD COLUMN media_generation_id TEXT"
      );
      loggerLocal.info(
        "Added media_generation_id column to veo3_video_generations"
      );
    }

    if (!columns.includes("fife_url")) {
      await db.run(
        "ALTER TABLE veo3_video_generations ADD COLUMN fife_url TEXT"
      );
      loggerLocal.info("Added fife_url column to veo3_video_generations");
    }

    if (!columns.includes("serving_base_uri")) {
      await db.run(
        "ALTER TABLE veo3_video_generations ADD COLUMN serving_base_uri TEXT"
      );
      loggerLocal.info(
        "Added serving_base_uri column to veo3_video_generations"
      );
    }

    await recordMigration(db, 11);
    loggerLocal.info("Migration 011 completed successfully");
  } catch (error) {
    loggerLocal.error("Migration 011 failed", error);
    throw error;
  }
}

/**
 * Migration 003: Create master_prompts table
 */
async function migration_003_add_master_prompts(
  db: SQLiteDatabase
): Promise<void> {
  const loggerLocal = logger;
  loggerLocal.info("Running migration 003: Create master_prompts table");
  try {
    const tableInfo = await db.all<{ name: string }>(
      "PRAGMA table_info(master_prompts)"
    );
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
      await db.run(
        "CREATE INDEX IF NOT EXISTS idx_master_prompts_provider ON master_prompts(provider)"
      );
      await db.run(
        "CREATE INDEX IF NOT EXISTS idx_master_prompts_kind ON master_prompts(prompt_kind)"
      );
      await recordMigration(db, 3);
      loggerLocal.info("Migration 003 completed successfully");
    } else {
      loggerLocal.info(
        "master_prompts table already exists, skipping migration 003"
      );
      await recordMigration(db, 3);
    }
  } catch (error) {
    loggerLocal.error("Migration 003 failed", error);
    throw error;
  }
}

/**
 * Migration 012: Add channel_id column to master_prompts table
 */
async function migration_012_add_channel_id_to_master_prompts(
  db: SQLiteDatabase
): Promise<void> {
  const loggerLocal = logger;
  loggerLocal.info("Running migration 012: Add channel_id to master_prompts");
  try {
    const tableInfo = await db.all<{ name: string }>(
      "PRAGMA table_info(master_prompts)"
    );
    const columns = tableInfo.map((c) => c.name);

    if (!columns.includes("channel_id")) {
      await db.run("ALTER TABLE master_prompts ADD COLUMN channel_id TEXT");
      loggerLocal.info("Added channel_id column to master_prompts");

      // Create index for the new column
      await db.run(
        "CREATE INDEX IF NOT EXISTS idx_master_prompts_channel ON master_prompts(channel_id)"
      );
      loggerLocal.info("Created index on channel_id");
    }

    await recordMigration(db, 12);
    loggerLocal.info("Migration 012 completed successfully");
  } catch (error) {
    loggerLocal.error("Migration 012 failed", error);
    throw error;
  }
}

/**
 * Migration 013: Add prompt_type column and channel support
 * Adds prompt categorization (script, topic, video_prompt, audio_prompt)
 * and ensures proper channel association for prompts
 */
async function migration_013_add_prompt_type_and_channel_support(
  db: SQLiteDatabase
): Promise<void> {
  const loggerLocal = logger;
  loggerLocal.info(
    "Running migration 013: Add prompt_type column and channel support"
  );
  try {
    // Create master_prompt_types reference table
    await db.run(`
      CREATE TABLE IF NOT EXISTS master_prompt_types (
        id INTEGER PRIMARY KEY,
        type_name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TEXT NOT NULL
      )
    `);
    loggerLocal.info("Created master_prompt_types reference table");

    // Insert standard prompt types
    await db.run(`
      INSERT OR IGNORE INTO master_prompt_types (type_name, description, created_at)
      VALUES 
        ('script', 'Script generation prompts', datetime('now')),
        ('topic', 'Topic generation prompts', datetime('now')),
        ('video_prompt', 'Video/VEO3 generation prompts', datetime('now')),
        ('audio_prompt', 'Audio generation prompts', datetime('now'))
    `);
    loggerLocal.info("Inserted standard prompt types");

    // Check if prompt_type column exists, if not add it
    const tableInfo = await db.all<{ name: string }>(
      "PRAGMA table_info(master_prompts)"
    );
    const columns = tableInfo.map((c) => c.name);

    if (!columns.includes("prompt_type")) {
      await db.run(
        `ALTER TABLE master_prompts ADD COLUMN prompt_type TEXT DEFAULT 'script' CHECK(prompt_type IN ('script', 'topic', 'video_prompt', 'audio_prompt'))`
      );
      loggerLocal.info("Added prompt_type column to master_prompts");

      // Create indexes for optimal query performance
      await db.run(
        "CREATE INDEX IF NOT EXISTS idx_master_prompts_type ON master_prompts(prompt_type)"
      );
      await db.run(
        "CREATE INDEX IF NOT EXISTS idx_master_prompts_channel_type ON master_prompts(channel_id, prompt_type)"
      );
      await db.run(
        "CREATE INDEX IF NOT EXISTS idx_master_prompts_active_type ON master_prompts(is_active, prompt_type)"
      );
      loggerLocal.info("Created indexes for prompt_type queries");
    }

    await recordMigration(db, 13);
    loggerLocal.info("Migration 013 completed successfully");
  } catch (error) {
    loggerLocal.error("Migration 013 failed", error);
    throw error;
  }
}

/**
 * Migration 014: Seed master_prompt_types with predefined types
 * Ensures the 4 standard prompt types are always present
 */
async function migration_014_seed_master_prompt_types(
  db: SQLiteDatabase
): Promise<void> {
  const loggerLocal = logger;
  loggerLocal.info("Running migration 014: Seed master_prompt_types");
  try {
    // Ensure master_prompt_types table exists
    await db.run(`
      CREATE TABLE IF NOT EXISTS master_prompt_types (
        id INTEGER PRIMARY KEY,
        type_name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TEXT NOT NULL
      )
    `);

    // Insert the 4 predefined types
    const types = [
      { name: "script", desc: "Script generation prompts" },
      { name: "topic", desc: "Topic generation prompts" },
      { name: "video_prompt", desc: "Video/VEO3 generation prompts" },
      { name: "audio_prompt", desc: "Audio generation prompts" },
    ];

    for (const type of types) {
      try {
        const existing = await db.get<{ id: number }>(
          "SELECT id FROM master_prompt_types WHERE type_name = ?",
          [type.name]
        );

        if (!existing) {
          await db.run(
            "INSERT INTO master_prompt_types (type_name, description, created_at) VALUES (?, ?, ?)",
            [type.name, type.desc, new Date().toISOString()]
          );
          loggerLocal.info(`Inserted prompt type: ${type.name}`);
        } else {
          loggerLocal.info(`Prompt type already exists: ${type.name}`);
        }
      } catch (err) {
        loggerLocal.warn(`Failed to insert type ${type.name}:`, err);
      }
    }

    await recordMigration(db, 14);
    loggerLocal.info("Migration 014 completed successfully");
  } catch (error) {
    loggerLocal.error("Migration 014 failed", error);
    throw error;
  }
}

/**
 * Migration 015: Cleanup old prompt_types table and ensure master_prompt_types is populated
 * Drops the old prompt_types table (if it exists) and verifies master_prompt_types has data
 */
async function migration_015_cleanup_duplicate_prompt_types(
  db: SQLiteDatabase
): Promise<void> {
  const loggerLocal = logger;
  loggerLocal.info("Running migration 015: Cleanup old prompt_types table");
  try {
    // Check if the old prompt_types table exists and drop it if present
    const tables = await db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='prompt_types'"
    );

    if (tables && tables.length > 0) {
      loggerLocal.info("Found old prompt_types table, dropping it");
      await db.run("DROP TABLE IF EXISTS prompt_types");
      loggerLocal.info("Successfully dropped old prompt_types table");
    } else {
      loggerLocal.info("No old prompt_types table found");
    }

    // Ensure master_prompt_types table exists and is populated
    await db.run(`
      CREATE TABLE IF NOT EXISTS master_prompt_types (
        id INTEGER PRIMARY KEY,
        type_name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TEXT NOT NULL
      )
    `);

    // Verify all 4 standard types are present
    const types = [
      { name: "script", desc: "Script generation prompts" },
      { name: "topic", desc: "Topic generation prompts" },
      { name: "video_prompt", desc: "Video/VEO3 generation prompts" },
      { name: "audio_prompt", desc: "Audio generation prompts" },
    ];

    for (const type of types) {
      try {
        const existing = await db.get<{ id: number }>(
          "SELECT id FROM master_prompt_types WHERE type_name = ?",
          [type.name]
        );

        if (!existing) {
          await db.run(
            "INSERT INTO master_prompt_types (type_name, description, created_at) VALUES (?, ?, ?)",
            [type.name, type.desc, new Date().toISOString()]
          );
          loggerLocal.info(`Inserted prompt type: ${type.name}`);
        } else {
          loggerLocal.info(`Prompt type already exists: ${type.name}`);
        }
      } catch (err) {
        loggerLocal.warn(`Failed to insert type ${type.name}:`, err);
      }
    }

    // Verify all types were inserted
    const allTypes = await db.all<{ type_name: string }>(
      "SELECT type_name FROM master_prompt_types ORDER BY type_name"
    );
    loggerLocal.info(
      `Master prompt types now contains: ${(allTypes || [])
        .map((t) => t.type_name)
        .join(", ")}`
    );

    await recordMigration(db, 15);
    loggerLocal.info("Migration 015 completed successfully");
  } catch (error) {
    loggerLocal.error("Migration 015 failed", error);
    throw error;
  }
}

/**
 * Migration 016: Add type_code and status columns to master_prompt_types
 * Adds unique type_code field and status flag (0 = inactive, 1 = active)
 */
async function migration_016_add_type_code_and_status_to_prompt_types(
  db: SQLiteDatabase
): Promise<void> {
  const loggerLocal = logger;
  loggerLocal.info(
    "Running migration 016: Add type_code and status to master_prompt_types"
  );
  try {
    // Check if columns already exist
    const table = await db.all<any>("PRAGMA table_info(master_prompt_types)");
    const hasTypeCode = table.some((col: any) => col.name === "type_code");
    const hasStatus = table.some((col: any) => col.name === "status");

    if (!hasTypeCode) {
      await db.run("ALTER TABLE master_prompt_types ADD COLUMN type_code TEXT");
      loggerLocal.info("Added type_code column to master_prompt_types");
    }

    if (!hasStatus) {
      await db.run(
        "ALTER TABLE master_prompt_types ADD COLUMN status INTEGER DEFAULT 1"
      );
      loggerLocal.info("Added status column to master_prompt_types");
    }

    // Migrate existing data: generate type_code from type_name if not set
    const typesWithoutCode = await db.all<any>(
      "SELECT id, type_name FROM master_prompt_types WHERE type_code IS NULL"
    );

    for (const type of typesWithoutCode || []) {
      const typeCode = type.type_name
        .toUpperCase()
        .replace(/\s+/g, "_")
        .replace(/[^A-Z0-9_]/g, "");

      try {
        await db.run(
          "UPDATE master_prompt_types SET type_code = ?, status = 1 WHERE id = ?",
          [typeCode, type.id]
        );
        loggerLocal.info(
          `Generated type_code for ${type.type_name}: ${typeCode}`
        );
      } catch (err) {
        loggerLocal.warn(`Failed to set type_code for ${type.type_name}:`, err);
      }
    }

    // Log final state
    const allTypes = await db.all<any>(
      "SELECT id, type_name, type_code, status FROM master_prompt_types"
    );
    loggerLocal.info(
      `Master prompt types after migration 016: ${JSON.stringify(
        allTypes || [],
        null,
        2
      )}`
    );

    await recordMigration(db, 16);
    loggerLocal.info("Migration 016 completed successfully");
  } catch (error) {
    loggerLocal.error("Migration 016 failed", error);
    throw error;
  }
}

/**
 * Migration 017: Add prompt_type_id foreign key to master_prompts
 * Migrates from hardcoded prompt_type enum to foreign key reference to master_prompt_types
 */
async function migration_017_add_prompt_type_id_foreign_key(
  db: SQLiteDatabase
): Promise<void> {
  const loggerLocal = logger;
  loggerLocal.info(
    "Running migration 017: Add prompt_type_id foreign key to master_prompts"
  );
  try {
    // Step 1: Check if prompt_type_id column already exists
    const tableInfo = await db.all<any>("PRAGMA table_info(master_prompts)");
    const hasPromptTypeId = tableInfo.some(
      (col: any) => col.name === "prompt_type_id"
    );

    if (!hasPromptTypeId) {
      loggerLocal.info(
        "Adding prompt_type_id column to master_prompts (temporary)"
      );
      await db.run(
        "ALTER TABLE master_prompts ADD COLUMN prompt_type_id INTEGER"
      );
    }

    // Step 2: Get all existing prompt_type values and map to master_prompt_types IDs
    const existingPrompts = await db.all<any>(
      "SELECT DISTINCT prompt_type FROM master_prompts WHERE prompt_type IS NOT NULL"
    );

    const typeMapping: Record<string, number> = {};
    for (const record of existingPrompts || []) {
      const typeCode = record.prompt_type?.toUpperCase() || "";
      if (!typeCode) continue;

      try {
        // Find matching master_prompt_types by type_code
        const typeRecord = await db.get<{ id: number }>(
          "SELECT id FROM master_prompt_types WHERE type_code = ? OR type_code LIKE ?",
          [typeCode, typeCode.replace(/_/g, " ").toUpperCase()]
        );

        if (typeRecord) {
          typeMapping[record.prompt_type] = typeRecord.id;
          loggerLocal.info(
            `Mapped prompt_type '${record.prompt_type}' to master_prompt_types.id = ${typeRecord.id}`
          );
        } else {
          loggerLocal.warn(
            `Could not find master_prompt_types entry for prompt_type '${record.prompt_type}'`
          );
        }
      } catch (err) {
        loggerLocal.warn(
          `Failed to map prompt_type '${record.prompt_type}':`,
          err
        );
      }
    }

    // Step 3: Populate prompt_type_id from prompt_type using mapping
    for (const [oldValue, typeId] of Object.entries(typeMapping)) {
      try {
        await db.run(
          "UPDATE master_prompts SET prompt_type_id = ? WHERE prompt_type = ?",
          [typeId, oldValue]
        );
        loggerLocal.info(
          `Updated prompts with prompt_type='${oldValue}' to prompt_type_id=${typeId}`
        );
      } catch (err) {
        loggerLocal.warn(
          `Failed to update prompts for type '${oldValue}':`,
          err
        );
      }
    }

    // Step 4: Create new master_prompts table with FK constraint
    loggerLocal.info("Creating new master_prompts table with FK constraint...");
    await db.run(`
      CREATE TABLE master_prompts_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider TEXT NOT NULL,
        prompt_kind TEXT,
        prompt_template TEXT NOT NULL,
        description TEXT,
        prompt_type_id INTEGER REFERENCES master_prompt_types(id),
        channel_id TEXT,
        tags TEXT,
        is_active INTEGER DEFAULT 1,
        archived INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Step 5: Copy data to new table
    loggerLocal.info("Copying data from old master_prompts to new table...");
    await db.run(`
      INSERT INTO master_prompts_new (
        id, provider, prompt_kind, prompt_template, description, 
        prompt_type_id, channel_id, tags, is_active, archived, 
        created_at, updated_at
      )
      SELECT 
        id, provider, prompt_kind, prompt_template, description,
        prompt_type_id, channel_id, tags, is_active, archived,
        created_at, updated_at
      FROM master_prompts
    `);

    // Step 6: Drop old table and rename new one
    loggerLocal.info("Dropping old master_prompts table...");
    await db.run("DROP TABLE master_prompts");
    await db.run("ALTER TABLE master_prompts_new RENAME TO master_prompts");

    // Step 7: Recreate indexes
    loggerLocal.info("Recreating indexes...");
    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_master_prompts_provider ON master_prompts(provider)"
    );
    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_master_prompts_kind ON master_prompts(prompt_kind)"
    );
    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_master_prompts_channel ON master_prompts(channel_id)"
    );
    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_master_prompts_type ON master_prompts(prompt_type_id)"
    );
    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_master_prompts_active ON master_prompts(is_active)"
    );

    // Step 8: Verify migration
    const migratedCount = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM master_prompts"
    );
    loggerLocal.info(
      `Migration 017 complete: ${
        migratedCount?.count || 0
      } prompts now have prompt_type_id`
    );

    // Step 9: Verify at least some prompts have prompt_type_id set
    const withTypeId = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM master_prompts WHERE prompt_type_id IS NOT NULL"
    );
    loggerLocal.info(
      `${withTypeId?.count || 0} prompts have prompt_type_id set (non-NULL)`
    );

    await recordMigration(db, 17);
    loggerLocal.info("Migration 017 completed successfully");
  } catch (error) {
    loggerLocal.error("Migration 017 failed", error);
    throw error;
  }
}

/**
 * Migration 018: Restructure master_prompts and master_prompt_history tables
 * - Remove prompt_kind column (redundant, info available from master_prompt_types via prompt_type_id)
 * - Replace prompt_type TEXT with prompt_type_id INTEGER NOT NULL (foreign key to master_prompt_types)
 * - Enforce referential integrity with ON DELETE CASCADE
 */
async function migration_018_restructure_master_prompts_table(
  db: SQLiteDatabase
): Promise<void> {
  const loggerLocal = logger;
  loggerLocal.info(
    "Running migration 018: Restructure master_prompts and master_prompt_history tables"
  );
  try {
    // Step 1: Clean up any previous backup tables
    loggerLocal.info("Cleaning up any previous backup tables...");
    await db.run("DROP TABLE IF EXISTS master_prompts_backup");
    await db.run("DROP TABLE IF EXISTS master_prompt_history_backup");

    // Step 2: Backup existing data
    loggerLocal.info("Creating backup tables...");
    await db.run(
      "CREATE TABLE master_prompts_backup AS SELECT * FROM master_prompts"
    );
    await db.run(
      "CREATE TABLE master_prompt_history_backup AS SELECT * FROM master_prompt_history"
    );
    loggerLocal.info("Backup tables created");

    // Step 2: Drop old indexes
    loggerLocal.info("Dropping old indexes...");
    await db.run("DROP INDEX IF EXISTS idx_master_prompts_kind");
    await db.run("DROP INDEX IF EXISTS idx_master_prompts_type");
    await db.run("DROP INDEX IF EXISTS idx_master_prompts_channel_type");
    await db.run("DROP INDEX IF EXISTS idx_master_prompts_active_type");

    // Step 3: Drop old master_prompt_history table (it has FK to master_prompts)
    loggerLocal.info("Dropping old master_prompt_history table...");
    await db.run("DROP TABLE IF EXISTS master_prompt_history");

    // Step 4: Drop old master_prompts table
    loggerLocal.info("Dropping old master_prompts table...");
    await db.run("DROP TABLE IF EXISTS master_prompts");

    // Step 5: Create new master_prompts table with correct structure
    loggerLocal.info("Creating new master_prompts table...");
    await db.run(`
      CREATE TABLE master_prompts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider TEXT NOT NULL,
        prompt_template TEXT NOT NULL,
        description TEXT,
        prompt_type_id INTEGER NOT NULL,
        channel_id TEXT,
        tags TEXT,
        is_active INTEGER DEFAULT 1,
        archived INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (prompt_type_id) REFERENCES master_prompt_types(id) ON DELETE CASCADE,
        FOREIGN KEY (channel_id) REFERENCES channels(channel_id) ON DELETE CASCADE
      )
    `);
    loggerLocal.info("New master_prompts table created");

    // Step 6: Migrate data from backup to new table
    loggerLocal.info("Migrating data from backup to new master_prompts...");

    // Check if backup table has prompt_type_id column
    const backupInfo = await db.all<any>(
      "PRAGMA table_info(master_prompts_backup)"
    );
    const hasPromptTypeId = backupInfo.some(
      (col: any) => col.name === "prompt_type_id"
    );

    if (hasPromptTypeId) {
      // If backup has prompt_type_id, use it directly
      await db.run(`
        INSERT INTO master_prompts (
          id, provider, prompt_template, description, prompt_type_id,
          channel_id, tags, is_active, archived, created_at, updated_at
        )
        SELECT 
          id, provider, prompt_template, description, 
          COALESCE(prompt_type_id, 1) as prompt_type_id,
          channel_id, tags, is_active, archived, created_at, updated_at
        FROM master_prompts_backup
      `);
    } else {
      // If backup doesn't have prompt_type_id, use default value 1
      loggerLocal.warn(
        "Backup table does not have prompt_type_id column, using default value 1"
      );
      await db.run(`
        INSERT INTO master_prompts (
          id, provider, prompt_template, description, prompt_type_id,
          channel_id, tags, is_active, archived, created_at, updated_at
        )
        SELECT 
          id, provider, prompt_template, description, 1 as prompt_type_id,
          channel_id, tags, is_active, archived, created_at, updated_at
        FROM master_prompts_backup
      `);
    }
    loggerLocal.info("Data migration completed");

    // Step 7: Create new master_prompt_history table with correct structure
    loggerLocal.info("Creating new master_prompt_history table...");
    await db.run(`
      CREATE TABLE master_prompt_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt_id INTEGER NOT NULL,
        provider TEXT NOT NULL,
        prompt_template TEXT NOT NULL,
        description TEXT,
        prompt_type_id INTEGER NOT NULL,
        tags TEXT,
        is_active INTEGER DEFAULT 1,
        archived INTEGER DEFAULT 0,
        change_note TEXT,
        digest TEXT,
        digest_short TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (prompt_id) REFERENCES master_prompts(id) ON DELETE CASCADE,
        FOREIGN KEY (prompt_type_id) REFERENCES master_prompt_types(id) ON DELETE CASCADE
      )
    `);
    loggerLocal.info("New master_prompt_history table created");

    // Step 8: Migrate history data from backup to new table
    loggerLocal.info(
      "Migrating data from backup to new master_prompt_history..."
    );

    // Check if backup table has prompt_type_id column
    const historyBackupInfo = await db.all<any>(
      "PRAGMA table_info(master_prompt_history_backup)"
    );
    const hasPromptTypeIdInBackup = historyBackupInfo.some(
      (col: any) => col.name === "prompt_type_id"
    );

    if (hasPromptTypeIdInBackup) {
      // If backup has prompt_type_id, use it directly
      await db.run(`
        INSERT INTO master_prompt_history (
          id, prompt_id, provider, prompt_template, description, prompt_type_id,
          tags, is_active, archived, change_note, digest, digest_short, created_at
        )
        SELECT 
          id, prompt_id, provider, prompt_template, description,
          COALESCE(prompt_type_id, 1) as prompt_type_id,
          tags, is_active, archived, change_note, digest, digest_short, created_at
        FROM master_prompt_history_backup
      `);
    } else {
      // If backup doesn't have prompt_type_id, use default value 1
      loggerLocal.warn(
        "Backup table does not have prompt_type_id column, using default value 1"
      );
      await db.run(`
        INSERT INTO master_prompt_history (
          id, prompt_id, provider, prompt_template, description, prompt_type_id,
          tags, is_active, archived, change_note, digest, digest_short, created_at
        )
        SELECT 
          id, prompt_id, provider, prompt_template, description, 1 as prompt_type_id,
          tags, is_active, archived, change_note, digest, digest_short, created_at
        FROM master_prompt_history_backup
      `);
    }
    loggerLocal.info("History data migration completed");

    // Step 9: Recreate indexes with corrected column names
    loggerLocal.info("Recreating indexes...");
    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_master_prompts_provider ON master_prompts(provider)"
    );
    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_master_prompts_channel ON master_prompts(channel_id)"
    );
    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_master_prompts_type_id ON master_prompts(prompt_type_id)"
    );
    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_master_prompts_channel_type ON master_prompts(channel_id, prompt_type_id)"
    );
    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_master_prompts_active_type ON master_prompts(is_active, prompt_type_id)"
    );
    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_prompt_history_prompt_id ON master_prompt_history(prompt_id)"
    );
    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_prompt_history_created_at ON master_prompt_history(created_at)"
    );
    loggerLocal.info("Indexes recreated");

    // Step 10: Verify migration
    const promptCount = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM master_prompts"
    );
    const historyCount = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM master_prompt_history"
    );
    loggerLocal.info(
      `Migration 018 complete: ${promptCount?.count || 0} prompts, ${
        historyCount?.count || 0
      } history entries`
    );

    // Step 11: Clean up backup tables
    loggerLocal.info("Cleaning up backup tables...");
    await db.run("DROP TABLE IF EXISTS master_prompts_backup");
    await db.run("DROP TABLE IF EXISTS master_prompt_history_backup");

    await recordMigration(db, 18);
    loggerLocal.info("Migration 018 completed successfully");
  } catch (error) {
    loggerLocal.error("Migration 018 failed", error);
    throw error;
  }
}

/**
 * Migration 019: Populate master_prompt_types with initial data
 * Inserts standard prompt types for use in the application
 */
async function migration_019_populate_master_prompt_types(
  db: SQLiteDatabase
): Promise<void> {
  const loggerLocal = new Logger("Migration019");

  try {
    loggerLocal.info("Starting migration 019: Populate master_prompt_types");

    // Insert standard prompt types if they don't exist
    const insertPromptTypes = `
      INSERT OR IGNORE INTO master_prompt_types (type_name, type_code, description, status, created_at)
      VALUES 
        ('Script', 'SCRIPT', 'Script generation prompts', 1, datetime('now')),
        ('Topic', 'TOPIC', 'Topic generation prompts', 1, datetime('now')),
        ('Video Prompt', 'VIDEO_PROMPT', 'Video/VEO3 generation prompts', 1, datetime('now')),
        ('Audio Prompt', 'AUDIO_PROMPT', 'Audio generation prompts', 1, datetime('now')),
        ('Video Creation', 'video_creation', 'Video creation prompts', 1, datetime('now')),
        ('Platform Analysis', 'platform_analysis', 'Platform analysis prompts', 1, datetime('now')),
        ('Channel Analysis', 'channel_analysis', 'Channel analysis prompts', 1, datetime('now'))
    `;

    await db.run(insertPromptTypes);

    const typeCount = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM master_prompt_types"
    );
    loggerLocal.info(
      `Master prompt types populated: ${typeCount?.count || 0} types available`
    );

    await recordMigration(db, 19);
    loggerLocal.info("Migration 019 completed successfully");
  } catch (error) {
    loggerLocal.error("Migration 019 failed", error);
    throw error;
  }
}
