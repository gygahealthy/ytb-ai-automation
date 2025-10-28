import { app } from "electron";
import * as path from "path";
import { SQLiteDatabase } from "./sqlite-database";

/**
 * Check if we're running in main process (not worker thread)
 */
function isMainProcess(): boolean {
  try {
    return app && typeof app.getPath === "function";
  } catch {
    return false;
  }
}

/**
 * Database Manager
 * Provides access to SQLite database and repositories
 */
export class Database {
  private sqliteDb: SQLiteDatabase;
  private dbPath: string;

  constructor(customDbPath?: string) {
    if (customDbPath) {
      // Worker thread mode or custom path: use provided path
      this.dbPath = customDbPath;
    } else if (isMainProcess()) {
      // Main process mode: calculate path from app data
      // Store SQLite database in a deterministic folder under the OS appData (use a single canonical folder)
      // This prevents multiple Roaming folders like 'VEO3 AUTO' and 'veo3-automation' from being created
      const APP_FOLDER_NAME = "veo3-automation"; // canonical folder name
      const dbDir = path.join(app.getPath("appData"), APP_FOLDER_NAME);
      this.dbPath = path.join(dbDir, "veo3-automation.db");
    } else {
      // Fallback for worker threads without custom path
      throw new Error("Database path must be provided in worker threads. Pass dbPath to constructor.");
    }
    this.sqliteDb = new SQLiteDatabase(this.dbPath);
  }

  /**
   * Initialize database (ensures schema is created)
   */
  async initialize(): Promise<void> {
    await this.sqliteDb.waitForInit();
    console.log(`SQLite database initialized at: ${this.dbPath}`);
  }

  /**
   * Get the SQLite database instance
   */
  getSQLiteDatabase(): SQLiteDatabase {
    return this.sqliteDb;
  }

  /**
   * Get database file path
   */
  getBasePath(): string {
    return this.dbPath;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.sqliteDb.close();
  }
}

// Singleton instance (lazy-initialized)
let _databaseInstance: Database | null = null;

// Export singleton with getter to delay initialization until first access
export const database = {
  get instance(): Database {
    if (!isMainProcess()) {
      throw new Error("Cannot access database singleton from worker thread. Use SQLiteDatabase directly with a provided dbPath.");
    }
    if (!_databaseInstance) {
      _databaseInstance = new Database();
    }
    return _databaseInstance;
  },
  // Proxy methods for backward compatibility
  async initialize() {
    return this.instance.initialize();
  },
  getSQLiteDatabase() {
    return this.instance.getSQLiteDatabase();
  },
  getBasePath() {
    return this.instance.getBasePath();
  },
  async close() {
    return this.instance.close();
  },
};
