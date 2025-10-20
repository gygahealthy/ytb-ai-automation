import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 3;
export const description = "Create master_prompts table";

export async function up(
  db: SQLiteDatabase,
  loggerParam?: Logger
): Promise<void> {
  const logger = loggerParam || new Logger("Migration003");
  logger.info("Running migration 003: Create master_prompts table");
  const tableInfo = await db.all<{ name: string }>(
    "PRAGMA table_info(master_prompts)"
  );
  const columns = (tableInfo || []).map((c) => c.name);
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
    logger.info("Created master_prompts table and indexes");
  } else {
    logger.info("master_prompts table already exists, skipping 003");
  }
}
