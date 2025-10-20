import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 13;
export const description =
  "Add prompt_type column and seed master_prompt_types";

export async function up(
  db: SQLiteDatabase,
  loggerParam?: Logger
): Promise<void> {
  const logger = loggerParam || new Logger("Migration013");
  logger.info("Running migration 013 (module)");
  await db.run(`
    CREATE TABLE IF NOT EXISTS master_prompt_types (
      id INTEGER PRIMARY KEY,
      type_name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL
    )
  `);
  await db.run(`
    INSERT OR IGNORE INTO master_prompt_types (type_name, description, created_at)
    VALUES 
      ('script', 'Script generation prompts', datetime('now')),
      ('topic', 'Topic generation prompts', datetime('now')),
      ('video_prompt', 'Video/VEO3 generation prompts', datetime('now')),
      ('audio_prompt', 'Audio generation prompts', datetime('now'))
  `);

  const tableInfo = await db.all<{ name: string }>(
    "PRAGMA table_info(master_prompts)"
  );
  const columns = (tableInfo || []).map((c) => c.name);
  if (!columns.includes("prompt_type")) {
    await db.run(
      `ALTER TABLE master_prompts ADD COLUMN prompt_type TEXT DEFAULT 'script' CHECK(prompt_type IN ('script', 'topic', 'video_prompt', 'audio_prompt'))`
    );
    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_master_prompts_type ON master_prompts(prompt_type)"
    );
    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_master_prompts_channel_type ON master_prompts(channel_id, prompt_type)"
    );
    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_master_prompts_active_type ON master_prompts(is_active, prompt_type)"
    );
  }
}
