import { app } from "electron";
import * as path from "path";
import { SQLiteDatabase } from "./sqlite-database";

/**
 * Database Manager
 * Provides access to SQLite database and repositories
 */
export class Database {
  private sqliteDb: SQLiteDatabase;
  private dbPath: string;

  constructor() {
    // Store SQLite database in a deterministic folder under the OS appData (use a single canonical folder)
    // This prevents multiple Roaming folders like 'VEO3 AUTO' and 'veo3-automation' from being created
    const APP_FOLDER_NAME = "veo3-automation"; // canonical folder name
    const dbDir = path.join(app.getPath("appData"), APP_FOLDER_NAME);
    this.dbPath = path.join(dbDir, "veo3-automation.db");
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

// Export singleton instance
export const database = new Database();

// Export repositories for easy access
export {
  automationRepository,
  profileRepository,
  veo3Repository,
  videoAnalysisRepository,
  youtubeChannelRepository,
} from "./repositories";
