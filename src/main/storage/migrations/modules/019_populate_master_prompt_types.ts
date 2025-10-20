import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 19;
export const description = "Populate master_prompt_types with initial data";

export async function up(
  db: SQLiteDatabase,
  loggerParam?: Logger
): Promise<void> {
  const logger = loggerParam || new Logger("Migration019");
  logger.info("Running migration 019 (module)");
  const insert = `
    INSERT OR IGNORE INTO master_prompt_types (type_name, type_code, description, status, created_at)
    VALUES 
      ('Script', 'SCRIPT', 'Script generation prompts', 1, datetime('now')),
      ('Topic', 'TOPIC', 'Topic generation prompts', 1, datetime('now')),
      ('Video Prompt', 'VIDEO_PROMPT', 'Video/VEO3 generation prompts', 1, datetime('now')),
      ('Audio Prompt', 'AUDIO_PROMPT', 'Audio generation prompts', 1, datetime('now'))
  `;
  await db.run(insert);
}
