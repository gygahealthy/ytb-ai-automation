import { runMigrations as runMigrationsOrchestrator } from "./migrations/index";
import type { SQLiteDatabase } from "./sqlite-database";

/**
 * Backwards-compatible entrypoint — delegates to the modular orchestrator.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  return runMigrationsOrchestrator(db);
}
