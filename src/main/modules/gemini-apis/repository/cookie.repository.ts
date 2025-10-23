import { BaseRepository } from "../../../storage/repositories/base.repository";
import { SQLiteDatabase } from "../../../storage/sqlite-database";
import { Cookie, CookieRow } from "../shared/types";

/**
 * Repository for managing cookies in the database
 */
export class CookieRepository extends BaseRepository<Cookie> {
  constructor(db: SQLiteDatabase) {
    super("cookies", db);
  }

  /**
   * Convert database row to Cookie entity
   */
  protected rowToEntity(row: unknown): Cookie {
    const cookieRow = row as CookieRow;
    return {
      id: cookieRow.id,
      profileId: cookieRow.profile_id,
      url: cookieRow.url,
      service: cookieRow.service,
      rawCookieString: cookieRow.raw_cookie_string,
      lastRotatedAt: cookieRow.last_rotated_at,
      spidExpiration: cookieRow.spid_expiration,
      rotationData: cookieRow.rotation_data,
      rotationIntervalMinutes: cookieRow.rotation_interval_minutes,
      status: cookieRow.status,
      launchWorkerOnStartup: cookieRow.launch_worker_on_startup ?? 0,
      enabledRotationMethods: cookieRow.enabled_rotation_methods ?? '["refreshCreds","rotateCookie"]',
      rotationMethodOrder: cookieRow.rotation_method_order ?? '["refreshCreds","rotateCookie","headless"]',
      createdAt: cookieRow.created_at,
      updatedAt: cookieRow.updated_at,
    };
  }

  /**
   * Convert Cookie entity to database row
   */
  protected entityToRow(entity: Partial<Cookie>): Record<string, unknown> {
    return {
      id: entity.id,
      profile_id: entity.profileId,
      url: entity.url,
      service: entity.service,
      raw_cookie_string: entity.rawCookieString,
      last_rotated_at: entity.lastRotatedAt,
      spid_expiration: entity.spidExpiration,
      rotation_data: entity.rotationData,
      rotation_interval_minutes: entity.rotationIntervalMinutes,
      status: entity.status,
      launch_worker_on_startup: entity.launchWorkerOnStartup,
      enabled_rotation_methods: entity.enabledRotationMethods,
      rotation_method_order: entity.rotationMethodOrder,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  /**
   * Find cookies by profile ID
   */
  async findByProfileId(profileId: string): Promise<Cookie[]> {
    const rows = await this.db.all(`SELECT * FROM ${this.tableName} WHERE profile_id = ?`, [profileId]);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Find a cookie by profile ID and url
   */
  async findByProfileAndUrl(profileId: string, url: string): Promise<Cookie | null> {
    const row = await this.db.get(`SELECT * FROM ${this.tableName} WHERE profile_id = ? AND url = ?`, [profileId, url]);
    return row ? this.rowToEntity(row) : null;
  }

  /**
   * Find cookies by profile ID and service
   */
  async findByProfileAndService(profileId: string, service: string): Promise<Cookie[]> {
    const rows = await this.db.all(`SELECT * FROM ${this.tableName} WHERE profile_id = ? AND service = ?`, [profileId, service]);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Find an active cookie by profile ID and service
   */
  async findActiveByProfileAndService(profileId: string, service: string): Promise<Cookie | null> {
    const row = await this.db.get(
      `SELECT * FROM ${this.tableName} WHERE profile_id = ? AND service = ? AND status = 'active' LIMIT 1`,
      [profileId, service]
    );
    return row ? this.rowToEntity(row) : null;
  }

  /**
   * Find cookies by status
   */
  async findByStatus(status: "active" | "expired" | "renewal_failed"): Promise<Cookie[]> {
    const rows = await this.db.all(`SELECT * FROM ${this.tableName} WHERE status = ?`, [status]);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Find cookies that need rotation based on last_rotated_at and rotation_interval_minutes
   */
  async findCookiesDueForRotation(): Promise<Cookie[]> {
    const rows = await this.db.all(
      `SELECT * FROM ${this.tableName} 
       WHERE status = 'active' 
       AND (last_rotated_at IS NULL 
            OR datetime(last_rotated_at) <= datetime('now', '-' || rotation_interval_minutes || ' minutes'))`,
      []
    );
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Update cookie status
   */
  async updateStatus(id: string, status: "active" | "expired" | "renewal_failed"): Promise<void> {
    const now = new Date().toISOString();
    await this.db.run(`UPDATE ${this.tableName} SET status = ?, updated_at = ? WHERE id = ?`, [status, now, id]);
  }

  /**
   * Update cookie with rotation data
   */
  async updateRotation(
    id: string,
    data: {
      lastRotatedAt: string;
      rawCookieString?: string;
      rotationData?: string;
      status?: "active" | "expired" | "renewal_failed";
    }
  ): Promise<void> {
    const now = new Date().toISOString();
    const updates = [data.lastRotatedAt, data.rawCookieString, data.rotationData, data.status || "active", now, id];

    await this.db.run(
      `UPDATE ${this.tableName} 
       SET last_rotated_at = ?, 
           raw_cookie_string = COALESCE(?, raw_cookie_string),
           rotation_data = COALESCE(?, rotation_data),
           status = ?,
           updated_at = ?
       WHERE id = ?`,
      updates
    );
  }

  /**
   * Delete cookies by profile ID
   */
  async deleteByProfileId(profileId: string): Promise<void> {
    await this.db.run(`DELETE FROM ${this.tableName} WHERE profile_id = ?`, [profileId]);
  }

  /**
   * Check if cookie exists
   */
  async existsByProfileAndUrl(profileId: string, url: string): Promise<boolean> {
    const result = await this.db.get(`SELECT 1 FROM ${this.tableName} WHERE profile_id = ? AND url = ? LIMIT 1`, [
      profileId,
      url,
    ]);
    return result !== undefined;
  }

  /**
   * Check if cookie exists by profile and service
   */
  async existsByProfileAndService(profileId: string, service: string): Promise<boolean> {
    const result = await this.db.get(`SELECT 1 FROM ${this.tableName} WHERE profile_id = ? AND service = ? LIMIT 1`, [
      profileId,
      service,
    ]);
    return result !== undefined;
  }

  /**
   * Update cookie rotation configuration
   */
  async updateRotationConfig(
    id: string,
    config: {
      launchWorkerOnStartup?: number;
      enabledRotationMethods?: string;
      rotationMethodOrder?: string;
      rotationIntervalMinutes?: number;
    }
  ): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];

    if (config.launchWorkerOnStartup !== undefined) {
      updates.push("launch_worker_on_startup = ?");
      values.push(config.launchWorkerOnStartup);
    }
    if (config.enabledRotationMethods !== undefined) {
      updates.push("enabled_rotation_methods = ?");
      values.push(config.enabledRotationMethods);
    }
    if (config.rotationMethodOrder !== undefined) {
      updates.push("rotation_method_order = ?");
      values.push(config.rotationMethodOrder);
    }
    if (config.rotationIntervalMinutes !== undefined) {
      updates.push("rotation_interval_minutes = ?");
      values.push(config.rotationIntervalMinutes);
    }

    if (updates.length === 0) {
      return;
    }

    const now = new Date().toISOString();
    updates.push("updated_at = ?");
    values.push(now, id);

    await this.db.run(`UPDATE ${this.tableName} SET ${updates.join(", ")} WHERE id = ?`, values);
  }
}
