import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 1;
export const description = "Add user_agent and tags columns to profiles";

export async function up(
  db: SQLiteDatabase,
  loggerParam?: Logger
): Promise<void> {
  const logger = loggerParam || new Logger("Migration001");
  logger.info("Running migration 001: Add user_agent and tags columns");
  const tableInfo = await db.all<{ name: string }>(
    "PRAGMA table_info(profiles)"
  );
  const columns = (tableInfo || []).map((c) => c.name);

  if (!columns.includes("user_agent")) {
    await db.run("ALTER TABLE profiles ADD COLUMN user_agent TEXT");
    logger.info("Added user_agent column to profiles table");
  }
  if (!columns.includes("tags")) {
    await db.run("ALTER TABLE profiles ADD COLUMN tags TEXT");
    logger.info("Added tags column to profiles table");
  }
}
