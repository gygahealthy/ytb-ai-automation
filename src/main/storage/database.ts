import { app } from "electron";
import * as path from "path";
import { SQLiteDatabase } from "./sqlite-database";

/**
 * Database Manager
 * Provides access to SQLite database and repositories
 */
export class Database {
  private sqliteDb: SQLiteDatabase;

  constructor() {
    // Store SQLite database in user's app data folder
    const dbPath = path.join(app.getPath("userData"), "veo3-automation.db");
    this.sqliteDb = new SQLiteDatabase(dbPath);
  }

  /**
   * Initialize database (ensures schema is created)
   */
  async initialize(): Promise<void> {
    await this.sqliteDb.waitForInit();
    console.log(`SQLite database initialized at: ${this.getBasePath()}`);
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
    return path.join(app.getPath("userData"), "veo3-automation.db");
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
