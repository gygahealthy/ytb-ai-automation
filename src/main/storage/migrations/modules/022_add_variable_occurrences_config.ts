import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 22;
export const description =
  "Add variable_occurrences_config column to master_prompts and master_prompt_history";

export async function up(
  db: SQLiteDatabase,
  loggerParam?: Logger
): Promise<void> {
  const logger = loggerParam || new Logger("Migration022");
  logger.info("Running migration 022 (module)");

  // Add column to master_prompts table
  await db.run(`
    ALTER TABLE master_prompts
    ADD COLUMN variable_occurrences_config TEXT
  `);
  logger.info("Added variable_occurrences_config to master_prompts");

  // Add column to master_prompt_history table
  await db.run(`
    ALTER TABLE master_prompt_history
    ADD COLUMN variable_occurrences_config TEXT
  `);
  logger.info("Added variable_occurrences_config to master_prompt_history");
}
