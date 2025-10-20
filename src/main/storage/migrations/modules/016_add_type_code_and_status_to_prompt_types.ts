import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 16;
export const description =
  "Add type_code and status columns to master_prompt_types";

export async function up(
  db: SQLiteDatabase,
  loggerParam?: Logger
): Promise<void> {
  const logger = loggerParam || new Logger("Migration016");
  logger.info("Running migration 016 (module)");
  const table = await db.all<any>("PRAGMA table_info(master_prompt_types)");
  const hasTypeCode = table.some((col: any) => col.name === "type_code");
  const hasStatus = table.some((col: any) => col.name === "status");
  if (!hasTypeCode) {
    await db.run("ALTER TABLE master_prompt_types ADD COLUMN type_code TEXT");
  }
  if (!hasStatus) {
    await db.run(
      "ALTER TABLE master_prompt_types ADD COLUMN status INTEGER DEFAULT 1"
    );
  }

  const typesWithoutCode = await db.all<any>(
    "SELECT id, type_name FROM master_prompt_types WHERE type_code IS NULL"
  );
  for (const type of typesWithoutCode || []) {
    const typeCode = type.type_name
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/[^A-Z0-9_]/g, "");
    try {
      await db.run(
        "UPDATE master_prompt_types SET type_code = ?, status = 1 WHERE id = ?",
        [typeCode, type.id]
      );
    } catch (err) {
      // ignore
    }
  }
}
