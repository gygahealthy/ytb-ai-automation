import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 2;
export const description = "Add is_logged_in to profiles";

export async function up(
  db: SQLiteDatabase,
  loggerParam?: Logger
): Promise<void> {
  const logger = loggerParam || new Logger("Migration002");
  logger.info("Running migration 002: Add is_logged_in column");
  const tableInfo = await db.all<{ name: string }>(
    "PRAGMA table_info(profiles)"
  );
  const columns = (tableInfo || []).map((c) => c.name);
  if (!columns.includes("is_logged_in")) {
    await db.run(
      "ALTER TABLE profiles ADD COLUMN is_logged_in INTEGER DEFAULT 0"
    );
    logger.info("Added is_logged_in column to profiles table");
  }
}
