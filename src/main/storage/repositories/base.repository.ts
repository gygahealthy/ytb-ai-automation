import { SQLiteDatabase } from "../sqlite-database";

/**
 * Base Repository class with common CRUD operations
 * Now using async/await for sqlite3 compatibility
 */
export abstract class BaseRepository<T extends { id: string }> {
  protected db: SQLiteDatabase;
  protected tableName: string;

  constructor(tableName: string, db: SQLiteDatabase) {
    this.tableName = tableName;
    this.db = db;
  }

  /**
   * Convert database row to entity
   */
  protected abstract rowToEntity(row: unknown): T;

  /**
   * Convert entity to database row
   */
  protected abstract entityToRow(entity: T): Record<string, unknown>;

  /**
   * Find all records
   */
  async findAll(): Promise<T[]> {
    const rows = await this.db.all(`SELECT * FROM ${this.tableName}`);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Find record by ID
   */
  async findById(id: string): Promise<T | null> {
    const row = await this.db.get(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return row ? this.rowToEntity(row) : null;
  }

  /**
   * Insert a new record
   */
  async insert(entity: T): Promise<void> {
    const row = this.entityToRow(entity);
    // Filter out undefined values to avoid SQL errors
    const filteredRow = Object.fromEntries(
      Object.entries(row).filter(([, value]) => value !== undefined)
    );
    const columns = Object.keys(filteredRow).join(", ");
    const placeholders = Object.keys(filteredRow)
      .map(() => "?")
      .join(", ");

    await this.db.run(
      `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`,
      Object.values(filteredRow)
    );
  }

  /**
   * Update an existing record
   */
  async update(id: string, updates: Partial<T>): Promise<void> {
    const row = this.entityToRow(updates as T);
    const setClause = Object.keys(row)
      .map((key) => `${key} = ?`)
      .join(", ");

    await this.db.run(
      `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`,
      [...Object.values(row), id]
    );
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<void> {
    await this.db.run(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
  }

  /**
   * Count all records
   */
  async count(): Promise<number> {
    const result = await this.db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName}`
    );
    return result?.count || 0;
  }

  /**
   * Check if record exists
   */
  async exists(id: string): Promise<boolean> {
    const result = await this.db.get(
      `SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`,
      [id]
    );
    return result !== undefined;
  }
}
