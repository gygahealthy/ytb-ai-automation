import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 15;
export const description =
  "Cleanup duplicate prompt_types and ensure master_prompt_types populated";

export async function up(
  db: SQLiteDatabase,
  loggerParam?: Logger
): Promise<void> {
  const logger = loggerParam || new Logger("Migration015");
  logger.info("Running migration 015 (module)");
  const tables = await db.all<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='prompt_types'"
  );
  if (tables && tables.length > 0) {
    await db.run("DROP TABLE IF EXISTS prompt_types");
  }
  await db.run(`
    CREATE TABLE IF NOT EXISTS master_prompt_types (
      id INTEGER PRIMARY KEY,
      type_name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL
    )
  `);
  const types = [
    { name: "script", desc: "Script generation prompts" },
    { name: "topic", desc: "Topic generation prompts" },
    { name: "video_prompt", desc: "Video/VEO3 generation prompts" },
    { name: "audio_prompt", desc: "Audio generation prompts" },
  ];
  for (const t of types) {
    await db.run(
      "INSERT OR IGNORE INTO master_prompt_types (type_name, description, created_at) VALUES (?, ?, ?)",
      [t.name, t.desc, new Date().toISOString()]
    );
  }
}
