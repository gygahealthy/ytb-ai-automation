import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 5;
export const description = "Add tags/is_active/archived to master_prompts";

export async function up(
  db: SQLiteDatabase,
  loggerParam?: Logger
): Promise<void> {
  const loggerLocal = loggerParam || new Logger("Migration005");
  loggerLocal.info(
    "Running migration 005: Add tags/is_active/archived to master_prompts"
  );

  const tableInfo = await db.all<{ name: string }>(
    "PRAGMA table_info(master_prompts)"
  );
  const columns = (tableInfo || []).map((c) => c.name);

  if (!columns.includes("tags")) {
    await db.run("ALTER TABLE master_prompts ADD COLUMN tags TEXT");
    loggerLocal.info("Added tags column to master_prompts");
  }

  if (!columns.includes("is_active")) {
    await db.run(
      "ALTER TABLE master_prompts ADD COLUMN is_active INTEGER DEFAULT 1"
    );
    loggerLocal.info("Added is_active column to master_prompts");
  }

  if (!columns.includes("archived")) {
    await db.run(
      "ALTER TABLE master_prompts ADD COLUMN archived INTEGER DEFAULT 0"
    );
    loggerLocal.info("Added archived column to master_prompts");
  }
}
