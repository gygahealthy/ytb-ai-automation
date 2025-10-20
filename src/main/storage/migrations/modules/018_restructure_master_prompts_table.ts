import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 18;
export const description =
  "Restructure master_prompts and master_prompt_history";

export async function up(
  db: SQLiteDatabase,
  loggerParam?: Logger
): Promise<void> {
  const logger = loggerParam || new Logger("Migration018");
  logger.info("Running migration 018 (module)");
  await db.run("DROP TABLE IF EXISTS master_prompts_backup");
  await db.run("DROP TABLE IF EXISTS master_prompt_history_backup");
  await db.run(
    "CREATE TABLE master_prompts_backup AS SELECT * FROM master_prompts"
  );
  await db.run(
    "CREATE TABLE master_prompt_history_backup AS SELECT * FROM master_prompt_history"
  );
  await db.run("DROP INDEX IF EXISTS idx_master_prompts_kind");
  await db.run("DROP INDEX IF EXISTS idx_master_prompts_type");
  await db.run("DROP INDEX IF EXISTS idx_master_prompts_channel_type");
  await db.run("DROP INDEX IF EXISTS idx_master_prompts_active_type");
  await db.run("DROP TABLE IF EXISTS master_prompt_history");
  await db.run("DROP TABLE IF EXISTS master_prompts");
  await db.run(`
    CREATE TABLE master_prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      prompt_template TEXT NOT NULL,
      description TEXT,
      prompt_type_id INTEGER NOT NULL,
      channel_id TEXT,
      tags TEXT,
      is_active INTEGER DEFAULT 1,
      archived INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (prompt_type_id) REFERENCES master_prompt_types(id) ON DELETE CASCADE,
      FOREIGN KEY (channel_id) REFERENCES channels(channel_id) ON DELETE CASCADE
    )
  `);
  // migrate data from backup (simplified)
  const backupInfo = await db.all<any>(
    "PRAGMA table_info(master_prompts_backup)"
  );
  const hasPromptTypeId = backupInfo.some(
    (col: any) => col.name === "prompt_type_id"
  );
  if (hasPromptTypeId) {
    await db.run(
      `INSERT INTO master_prompts (id, provider, prompt_template, description, prompt_type_id, channel_id, tags, is_active, archived, created_at, updated_at) SELECT id, provider, prompt_template, description, COALESCE(prompt_type_id, 1), channel_id, tags, is_active, archived, created_at, updated_at FROM master_prompts_backup`
    );
  } else {
    await db.run(
      `INSERT INTO master_prompts (id, provider, prompt_template, description, prompt_type_id, channel_id, tags, is_active, archived, created_at, updated_at) SELECT id, provider, prompt_template, description, 1 as prompt_type_id, channel_id, tags, is_active, archived, created_at, updated_at FROM master_prompts_backup`
    );
  }
  await db.run(`
    CREATE TABLE master_prompt_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prompt_id INTEGER NOT NULL,
      provider TEXT NOT NULL,
      prompt_template TEXT NOT NULL,
      description TEXT,
      prompt_type_id INTEGER NOT NULL,
      tags TEXT,
      is_active INTEGER DEFAULT 1,
      archived INTEGER DEFAULT 0,
      change_note TEXT,
      digest TEXT,
      digest_short TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (prompt_id) REFERENCES master_prompts(id) ON DELETE CASCADE,
      FOREIGN KEY (prompt_type_id) REFERENCES master_prompt_types(id) ON DELETE CASCADE
    )
  `);
  // migrate history (simplified)
  const historyBackupInfo = await db.all<any>(
    "PRAGMA table_info(master_prompt_history_backup)"
  );
  const hasPromptTypeIdInBackup = historyBackupInfo.some(
    (col: any) => col.name === "prompt_type_id"
  );
  if (hasPromptTypeIdInBackup) {
    await db.run(
      `INSERT INTO master_prompt_history (id, prompt_id, provider, prompt_template, description, prompt_type_id, tags, is_active, archived, change_note, digest, digest_short, created_at) SELECT id, prompt_id, provider, prompt_template, description, COALESCE(prompt_type_id, 1), tags, is_active, archived, change_note, digest, digest_short, created_at FROM master_prompt_history_backup`
    );
  } else {
    await db.run(
      `INSERT INTO master_prompt_history (id, prompt_id, provider, prompt_template, description, prompt_type_id, tags, is_active, archived, change_note, digest, digest_short, created_at) SELECT id, prompt_id, provider, prompt_template, description, 1 as prompt_type_id, tags, is_active, archived, change_note, digest, digest_short, created_at FROM master_prompt_history_backup`
    );
  }
  await db.run(
    "CREATE INDEX IF NOT EXISTS idx_master_prompts_provider ON master_prompts(provider)"
  );
  await db.run(
    "CREATE INDEX IF NOT EXISTS idx_master_prompts_channel ON master_prompts(channel_id)"
  );
  await db.run(
    "CREATE INDEX IF NOT EXISTS idx_master_prompts_type_id ON master_prompts(prompt_type_id)"
  );
  await db.run(
    "CREATE INDEX IF NOT EXISTS idx_master_prompts_channel_type ON master_prompts(channel_id, prompt_type_id)"
  );
  await db.run(
    "CREATE INDEX IF NOT EXISTS idx_master_prompts_active_type ON master_prompts(is_active, prompt_type_id)"
  );
  await db.run(
    "CREATE INDEX IF NOT EXISTS idx_prompt_history_prompt_id ON master_prompt_history(prompt_id)"
  );
  await db.run(
    "CREATE INDEX IF NOT EXISTS idx_prompt_history_created_at ON master_prompt_history(created_at)"
  );
  await db.run("DROP TABLE IF EXISTS master_prompts_backup");
  await db.run("DROP TABLE IF EXISTS master_prompt_history_backup");
}
