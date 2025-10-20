import * as fs from "fs";
import * as path from "path";
import * as sqlite3 from "sqlite3";
import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 4;
export const description = "Migrate profiles from legacy local DB if present";

export async function up(
  db: SQLiteDatabase,
  loggerParam?: Logger
): Promise<void> {
  const logger = loggerParam || new Logger("Migration004");
  logger.info(
    "Running migration 004: Migrate profiles from local DB if present"
  );

  const legacyPath = path.resolve(process.cwd(), "data", "veo3-automation.db");
  if (!fs.existsSync(legacyPath)) {
    logger.info("No legacy DB found, skipping migration 004");
    return;
  }

  logger.info(`Found legacy DB at ${legacyPath}, importing profiles`);
  const legacyDb = new sqlite3.Database(legacyPath);

  const allProfiles: any[] = await new Promise((resolve, reject) => {
    legacyDb.all("SELECT * FROM profiles", (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });

  for (const row of allProfiles) {
    const exists = await db.get<{ id: string }>(
      "SELECT id FROM profiles WHERE id = ?",
      [row.id]
    );
    if (exists && exists.id) {
      logger.info(`Profile ${row.id} already exists, skipping`);
      continue;
    }

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
    logger.info(`Imported profile ${row.id}`);
  }
  legacyDb.close();
}
