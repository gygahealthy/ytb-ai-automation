import * as fs from "fs";
import * as path from "path";
import * as sqlite3 from "sqlite3";
import { Logger } from "../../shared/utils/logger";
import { runMigrations } from "./migrations/index";

const logger = new Logger("SQLiteDatabase");

/**
 * SQLite Database Manager
 * Handles database initialization and connection
 * Uses sqlite3 with promise-based API for Electron compatibility
 */
export class SQLiteDatabase {
  private db: sqlite3.Database;
  private dbPath: string;
  private isInitialized: boolean = false;

  constructor(dbPath: string = "./data/veo3-automation.db") {
    this.dbPath = dbPath;

    // Ensure data directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Initialize database
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        logger.error("Failed to open database", err);
        throw err;
      }
      logger.info(`SQLite database initialized at ${this.dbPath}`);

      // Configure database
      this.configure()
        .then(async () => {
          await this.initializeSchema();
        })
        .catch((error) => {
          logger.error("Failed to configure database", error);
          throw error;
        });
    });
  }

  /**
   * Configure database settings
   */
  private async configure(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run("PRAGMA journal_mode = WAL", (err) => {
          if (err) {
            logger.error("Failed to set journal mode", err);
            reject(err);
            return;
          }
        });

        this.db.run("PRAGMA foreign_keys = ON", (err) => {
          if (err) {
            logger.error("Failed to enable foreign keys", err);
            reject(err);
            return;
          }
          resolve();
        });
      });
    });
  }

  /**
   * Initialize database schema from SQL file
   */
  private async initializeSchema(): Promise<void> {
    try {
      const schemaPath = path.join(__dirname, "schema.sql");
      const schema = fs.readFileSync(schemaPath, "utf-8");

      // Execute schema
      try {
        await new Promise<void>((resolve, reject) => {
          this.db.exec(schema, (err) => {
            if (err) {
              logger.error("Failed to initialize schema", err);
              reject(err);
            } else {
              logger.info("Database schema initialized");
              resolve();
            }
          });
        });
      } catch (err) {
        // Some schema files referencing later-added columns/indexes can cause exec to fail
        // on older DBs. Don't abort initialization — log and continue to run migrations which
        // will add missing columns/indexes in a safe, incremental way.
        logger.warn("Schema exec failed, continuing with migrations", err);
      }

      // Run migrations to update existing tables
      await runMigrations(this);

      this.isInitialized = true;
    } catch (error) {
      logger.error("Failed to initialize database", error);
      throw error;
    }
  }

  /**
   * Wait for database to be initialized
   */
  async waitForInit(): Promise<void> {
    return new Promise((resolve) => {
      const checkInit = () => {
        if (this.isInitialized) {
          resolve();
        } else {
          setTimeout(checkInit, 50);
        }
      };
      checkInit();
    });
  }

  /**
   * Get the database instance
   */
  getDatabase(): sqlite3.Database {
    return this.db;
  }

  /**
   * Run a SQL statement (INSERT, UPDATE, DELETE)
   */
  async run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  /**
   * Get a single row
   */
  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as T);
        }
      });
    });
  }

  /**
   * Get all rows
   */
  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  /**
   * Execute multiple SQL statements
   */
  async exec(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          logger.error("Failed to close database", err);
          reject(err);
        } else {
          logger.info("Database connection closed");
          resolve();
        }
      });
    });
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    await this.run("BEGIN TRANSACTION");
    try {
      const result = await fn();
      await this.run("COMMIT");
      return result;
    } catch (error) {
      await this.run("ROLLBACK");
      throw error;
    }
  }
}

// Export singleton instance
// Note: Do NOT create a global SQLiteDatabase singleton here. The application-level
// Database manager (src/main/storage/database.ts) is responsible for creating the
// canonical SQLiteDatabase instance so it can control the DB file location. Creating
// a singleton in this module had the side-effect of opening a second DB at the
// relative ./data path which produced two different DB files.

// If a singleton instance is ever needed, create it via the Database class instead.
