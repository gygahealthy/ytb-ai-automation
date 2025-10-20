import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 11;
export const description =
  "Add video metadata fields to veo3_video_generations";

export async function up(
  db: SQLiteDatabase,
  loggerParam?: Logger
): Promise<void> {
  const logger = loggerParam || new Logger("Migration011");
  const tableInfo = await db.all<{ name: string }>(
    "PRAGMA table_info(veo3_video_generations)"
  );
  const columns = (tableInfo || []).map((c) => c.name);
  if (!columns.includes("media_generation_id")) {
    await db.run(
      "ALTER TABLE veo3_video_generations ADD COLUMN media_generation_id TEXT"
    );
    logger.info("Added media_generation_id column to veo3_video_generations");
  }
  if (!columns.includes("fife_url")) {
    await db.run("ALTER TABLE veo3_video_generations ADD COLUMN fife_url TEXT");
    logger.info("Added fife_url column to veo3_video_generations");
  }
  if (!columns.includes("serving_base_uri")) {
    await db.run(
      "ALTER TABLE veo3_video_generations ADD COLUMN serving_base_uri TEXT"
    );
    logger.info("Added serving_base_uri column to veo3_video_generations");
  }
}
