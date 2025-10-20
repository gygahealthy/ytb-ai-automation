import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 12;
export const description = "Add channel_id to master_prompts";

export async function up(
  db: SQLiteDatabase,
  loggerParam?: Logger
): Promise<void> {
  const logger = loggerParam || new Logger("Migration012");
  const tableInfo = await db.all<{ name: string }>(
    "PRAGMA table_info(master_prompts)"
  );
  const columns = (tableInfo || []).map((c) => c.name);
  if (!columns.includes("channel_id")) {
    await db.run("ALTER TABLE master_prompts ADD COLUMN channel_id TEXT");
    logger.info("Added channel_id column to master_prompts");
    await db.run(
      "CREATE INDEX IF NOT EXISTS idx_master_prompts_channel ON master_prompts(channel_id)"
    );
  }
}
