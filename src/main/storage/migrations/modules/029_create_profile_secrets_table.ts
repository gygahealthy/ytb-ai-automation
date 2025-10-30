import { SQLiteDatabase } from "../../sqlite-database";
import { Logger } from "../../../../shared/utils/logger";

export const version = 34;
export const description = "Create profile_secrets table for storing extracted API secrets";

export async function up(db: SQLiteDatabase, logger?: Logger): Promise<void> {
  logger?.info(`[Migration ${version}] ${description}`);

  // Create profile_secrets table
  await db.run(`
    CREATE TABLE IF NOT EXISTS profile_secrets (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      cookie_id TEXT,
      secret_type TEXT NOT NULL,
      secret_value TEXT NOT NULL,
      extracted_at TEXT NOT NULL,
      is_valid INTEGER NOT NULL DEFAULT 1,
      last_validated_at TEXT,
      metadata TEXT,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (cookie_id) REFERENCES cookies(id) ON DELETE SET NULL
    )
  `);

  logger?.info(`[Migration ${version}] Created profile_secrets table`);

  // Create index on profile_id for fast lookups
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_profile_secrets_profile_id 
    ON profile_secrets(profile_id)
  `);

  logger?.info(`[Migration ${version}] Created index on profile_id`);

  // Create unique index on profile_id + secret_type (one secret per type per profile)
  await db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_secrets_profile_type 
    ON profile_secrets(profile_id, secret_type)
  `);

  logger?.info(`[Migration ${version}] Created unique index on profile_id + secret_type`);

  // Create index on secret_type for filtering
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_profile_secrets_secret_type 
    ON profile_secrets(secret_type)
  `);

  logger?.info(`[Migration ${version}] Created index on secret_type`);

  // Create index on is_valid for quick valid secret lookups
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_profile_secrets_is_valid 
    ON profile_secrets(is_valid)
  `);

  logger?.info(`[Migration ${version}] Created index on is_valid`);

  logger?.info(`[Migration ${version}] Migration completed successfully`);
}
