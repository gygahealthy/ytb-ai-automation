import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 20;
export const description = "Add url column to cookies table";

export async function up(
  db: SQLiteDatabase,
  loggerParam?: Logger
): Promise<void> {
  const logger = loggerParam || new Logger("Migration020");
  logger.info("Running migration 020 (module)");
  const tableInfo = await db.all<{ name: string }>(
    "PRAGMA table_info(cookies)"
  );
  const columns = (tableInfo || []).map((c) => c.name);
  if (columns.includes("url")) return;

  await db.run("CREATE TABLE cookies_backup AS SELECT * FROM cookies");
  await db.run("DROP TABLE cookies");
  await db.run(`
    CREATE TABLE IF NOT EXISTS cookies (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      url TEXT NOT NULL,
      service TEXT NOT NULL,
      gemini_token TEXT,
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
  // restore data in a best-effort fashion
  // simplified: set url to 'default_url' when missing
  await db.run(
    `INSERT INTO cookies (id, profile_id, url, service, gemini_token, raw_cookie_string, last_rotated_at, spid_expiration, rotation_data, rotation_interval_minutes, status, created_at, updated_at) SELECT id, profile_id, 'default_url', 'gemini', gemini_token, raw_cookie_string, last_rotated_at, spid_expiration, rotation_data, rotation_interval_minutes, status, created_at, updated_at FROM cookies_backup`
  );
  await db.run("DROP TABLE cookies_backup");
}
