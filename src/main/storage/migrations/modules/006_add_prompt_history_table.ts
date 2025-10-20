import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 6;
export const description = "Add master_prompt_history table";

export async function up(
  db: SQLiteDatabase,
  loggerParam?: Logger
): Promise<void> {
  const logger = loggerParam || new Logger("Migration006");
  logger.info("Running migration 006: Add master_prompt_history table");
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
  await db.run(
    "CREATE INDEX IF NOT EXISTS idx_prompt_history_prompt_id ON master_prompt_history(prompt_id)"
  );
  await db.run(
    "CREATE INDEX IF NOT EXISTS idx_prompt_history_created_at ON master_prompt_history(created_at)"
  );
}
