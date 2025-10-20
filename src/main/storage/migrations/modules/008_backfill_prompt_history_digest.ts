import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";
import { computeDigestForMigration } from "../helpers";

export const version = 8;
export const description = "Backfill digest values for master_prompt_history";

export async function up(
  db: SQLiteDatabase,
  loggerParam?: Logger
): Promise<void> {
  const logger = loggerParam || new Logger("Migration008");
  logger.info("Running migration 008: Backfill master_prompt_history.digest");

  const tableInfo = await db.all<{ name: string }>(
    "PRAGMA table_info(master_prompt_history)"
  );
  const columns = (tableInfo || []).map((c) => c.name);
  if (!columns.includes("digest")) {
    logger.info("digest column missing, adding it now");
    await db.run("ALTER TABLE master_prompt_history ADD COLUMN digest TEXT");
    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_prompt_history_digest ON master_prompt_history(digest)"
    );
  }

  const rows = await db.all<any>(
    "SELECT id, prompt_template, description, tags FROM master_prompt_history"
  );
  for (const r of rows || []) {
    const digest = computeDigestForMigration(
      r.prompt_template,
      r.description,
      r.tags
    );
    await db.run("UPDATE master_prompt_history SET digest = ? WHERE id = ?", [
      digest,
      r.id,
    ]);
  }
}
