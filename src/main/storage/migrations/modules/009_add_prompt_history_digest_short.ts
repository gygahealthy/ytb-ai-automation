import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 9;
export const description = "Add digest_short column and backfill";

export async function up(
  db: SQLiteDatabase,
  loggerParam?: Logger
): Promise<void> {
  const logger = loggerParam || new Logger("Migration009");
  logger.info(
    "Running migration 009: Add digest_short column to master_prompt_history"
  );
  const tableInfo = await db.all<{ name: string }>(
    "PRAGMA table_info(master_prompt_history)"
  );
  const columns = (tableInfo || []).map((c) => c.name);
  if (!columns.includes("digest_short")) {
    await db.run(
      "ALTER TABLE master_prompt_history ADD COLUMN digest_short TEXT"
    );
    logger.info("Added digest_short column to master_prompt_history");
  }
  await db.run(
    "CREATE INDEX IF NOT EXISTS idx_prompt_history_digest_short ON master_prompt_history(digest_short)"
  );

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
}
