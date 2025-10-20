import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 7;
export const description = "Add digest column to master_prompt_history";

export async function up(
  db: SQLiteDatabase,
  loggerParam?: Logger
): Promise<void> {
  const logger = loggerParam || new Logger("Migration007");
  logger.info(
    "Running migration 007: Add digest column to master_prompt_history"
  );
  const tableInfo = await db.all<{ name: string }>(
    "PRAGMA table_info(master_prompt_history)"
  );
  const columns = (tableInfo || []).map((c) => c.name);
  if (!columns.includes("digest")) {
    await db.run("ALTER TABLE master_prompt_history ADD COLUMN digest TEXT");
    logger.info("Added digest column to master_prompt_history");
  }
  await db.run(
    "CREATE INDEX IF NOT EXISTS idx_prompt_history_digest ON master_prompt_history(digest)"
  );
}
