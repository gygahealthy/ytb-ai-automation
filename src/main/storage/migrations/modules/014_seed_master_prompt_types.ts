import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 14;
export const description = "Seed master_prompt_types";

export async function up(
  db: SQLiteDatabase,
  loggerParam?: Logger
): Promise<void> {
  const logger = loggerParam || new Logger("Migration014");
  logger.info("Running migration 014 (module)");
  const types = [
    { name: "script", desc: "Script generation prompts" },
    { name: "topic", desc: "Topic generation prompts" },
    { name: "video_prompt", desc: "Video/VEO3 generation prompts" },
    { name: "audio_prompt", desc: "Audio generation prompts" },
  ];
  await db.run(`
    CREATE TABLE IF NOT EXISTS master_prompt_types (
      id INTEGER PRIMARY KEY,
      type_name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL
    )
  `);
  for (const t of types) {
    await db.run(
      "INSERT OR IGNORE INTO master_prompt_types (type_name, description, created_at) VALUES (?, ?, ?)",
      [t.name, t.desc, new Date().toISOString()]
    );
  }
}
