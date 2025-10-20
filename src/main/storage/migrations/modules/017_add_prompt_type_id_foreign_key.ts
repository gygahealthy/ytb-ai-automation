import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 17;
export const description = "Add prompt_type_id foreign key to master_prompts";

export async function up(
  db: SQLiteDatabase,
  loggerParam?: Logger
): Promise<void> {
  const logger = loggerParam || new Logger("Migration017");
  logger.info("Running migration 017 (module)");
  const tableInfo = await db.all<any>("PRAGMA table_info(master_prompts)");
  const hasPromptTypeId = tableInfo.some(
    (col: any) => col.name === "prompt_type_id"
  );
  if (!hasPromptTypeId) {
    await db.run(
      "ALTER TABLE master_prompts ADD COLUMN prompt_type_id INTEGER"
    );
  }

  const existingPrompts = await db.all<any>(
    "SELECT DISTINCT prompt_type FROM master_prompts WHERE prompt_type IS NOT NULL"
  );
  const typeMapping: Record<string, number> = {};
  for (const record of existingPrompts || []) {
    const typeCode = (record.prompt_type || "").toUpperCase();
    const typeRecord = await db.get<{ id: number }>(
      "SELECT id FROM master_prompt_types WHERE type_code = ? OR type_code LIKE ?",
      [typeCode, typeCode.replace(/_/g, " ").toUpperCase()]
    );
    if (typeRecord) {
      typeMapping[record.prompt_type] = typeRecord.id;
    }
  }

  for (const [oldValue, typeId] of Object.entries(typeMapping)) {
    await db.run(
      "UPDATE master_prompts SET prompt_type_id = ? WHERE prompt_type = ?",
      [typeId, oldValue]
    );
  }

  await db.run(`
    CREATE TABLE IF NOT EXISTS master_prompts_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      prompt_kind TEXT,
      prompt_template TEXT NOT NULL,
      description TEXT,
      prompt_type_id INTEGER REFERENCES master_prompt_types(id),
      channel_id TEXT,
      tags TEXT,
      is_active INTEGER DEFAULT 1,
      archived INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await db.run(`
    INSERT INTO master_prompts_new (id, provider, prompt_kind, prompt_template, description, prompt_type_id, channel_id, tags, is_active, archived, created_at, updated_at)
    SELECT id, provider, prompt_kind, prompt_template, description, prompt_type_id, channel_id, tags, is_active, archived, created_at, updated_at FROM master_prompts
  `);
  await db.run("DROP TABLE IF EXISTS master_prompts");
  await db.run("ALTER TABLE master_prompts_new RENAME TO master_prompts");
  await db.run(
    "CREATE INDEX IF NOT EXISTS idx_master_prompts_provider ON master_prompts(provider)"
  );
  await db.run(
    "CREATE INDEX IF NOT EXISTS idx_master_prompts_kind ON master_prompts(prompt_kind)"
  );
  await db.run(
    "CREATE INDEX IF NOT EXISTS idx_master_prompts_channel ON master_prompts(channel_id)"
  );
  await db.run(
    "CREATE INDEX IF NOT EXISTS idx_master_prompts_type ON master_prompts(prompt_type_id)"
  );
  await db.run(
    "CREATE INDEX IF NOT EXISTS idx_master_prompts_active ON master_prompts(is_active)"
  );
}
