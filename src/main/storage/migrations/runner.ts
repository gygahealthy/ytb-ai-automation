import { Logger } from "../../../shared/utils/logger";
import type { SQLiteDatabase } from "../sqlite-database";

export type Migration = {
  version: number;
  description?: string;
  up: (db: SQLiteDatabase, logger?: Logger) => Promise<void>;
};

const logger = new Logger("MigrationRunner");

async function ensureSchemaMigrationsTable(db: SQLiteDatabase): Promise<void> {
  await db.run(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);
}

export async function getCurrentVersion(db: SQLiteDatabase): Promise<number> {
  try {
    await ensureSchemaMigrationsTable(db);
    const result = await db.get<{ version: number }>(
      "SELECT MAX(version) as version FROM schema_migrations"
    );
    return result?.version || 0;
  } catch (err) {
    logger.error("Failed to get current migration version", err);
    return 0;
  }
}

export async function recordMigration(
  db: SQLiteDatabase,
  version: number
): Promise<void> {
  await db.run(
    "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
    [version, new Date().toISOString()]
  );
}

export async function runMigrationsFromModules(
  db: SQLiteDatabase,
  migrations: Migration[]
): Promise<void> {
  await ensureSchemaMigrationsTable(db);
  const current = await getCurrentVersion(db);
  logger.info(`Runner current database version: ${current}`);

  const toRun = (migrations || [])
    .slice()
    .sort((a, b) => a.version - b.version)
    .filter((m) => m.version > current);

  for (const m of toRun) {
    logger.info(`Applying migration ${m.version} ${m.description || ""}`);
    // run each migration in a transaction
    await db.run("BEGIN TRANSACTION");
    try {
      await m.up(db, logger);
      await recordMigration(db, m.version);
      await db.run("COMMIT");
      logger.info(`Migration ${m.version} applied`);
    } catch (err) {
      await db.run("ROLLBACK");
      logger.error(`Migration ${m.version} failed`, err);
      throw err;
    }
  }

  logger.info("Module migrations completed");
}
