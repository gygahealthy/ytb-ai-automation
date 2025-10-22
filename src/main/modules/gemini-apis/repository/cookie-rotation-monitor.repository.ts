import { BaseRepository } from "../../../storage/repositories/base.repository";
import { SQLiteDatabase } from "../../../storage/sqlite-database";

/**
 * Cookie rotation monitor entity
 */
export interface CookieRotationMonitor {
  id: string;
  profileId: string;
  cookieId: string;
  workerStatus: "running" | "stopped" | "error" | "initializing";
  lastPsidtsRotationAt?: string;
  lastSidccRefreshAt?: string;
  psidtsRotationCount: number;
  sidccRefreshCount: number;
  psidtsErrorCount: number;
  sidccErrorCount: number;
  consecutiveFailures: number;
  lastErrorMessage?: string;
  lastErrorAt?: string;
  requiresHeadlessRefresh: boolean;
  lastHeadlessRefreshAt?: string;
  headlessRefreshCount: number;
  sessionHealth: "healthy" | "degraded" | "expired" | "unknown";
  nextRotationScheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Database row representation
 */
interface CookieRotationMonitorRow {
  id: string;
  profile_id: string;
  cookie_id: string;
  worker_status: string;
  last_psidts_rotation_at?: string;
  last_sidcc_refresh_at?: string;
  psidts_rotation_count: number;
  sidcc_refresh_count: number;
  psidts_error_count: number;
  sidcc_error_count: number;
  consecutive_failures: number;
  last_error_message?: string;
  last_error_at?: string;
  requires_headless_refresh: number;
  last_headless_refresh_at?: string;
  headless_refresh_count: number;
  session_health: string;
  next_rotation_scheduled_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Repository for cookie rotation monitoring
 */
export class CookieRotationMonitorRepository extends BaseRepository<CookieRotationMonitor> {
  constructor(db: SQLiteDatabase) {
    super("cookie_rotation_monitors", db);
  }

  protected rowToEntity(row: unknown): CookieRotationMonitor {
    const r = row as CookieRotationMonitorRow;
    return {
      id: r.id,
      profileId: r.profile_id,
      cookieId: r.cookie_id,
      workerStatus: r.worker_status as CookieRotationMonitor["workerStatus"],
      lastPsidtsRotationAt: r.last_psidts_rotation_at,
      lastSidccRefreshAt: r.last_sidcc_refresh_at,
      psidtsRotationCount: r.psidts_rotation_count,
      sidccRefreshCount: r.sidcc_refresh_count,
      psidtsErrorCount: r.psidts_error_count,
      sidccErrorCount: r.sidcc_error_count,
      consecutiveFailures: r.consecutive_failures,
      lastErrorMessage: r.last_error_message,
      lastErrorAt: r.last_error_at,
      requiresHeadlessRefresh: r.requires_headless_refresh === 1,
      lastHeadlessRefreshAt: r.last_headless_refresh_at,
      headlessRefreshCount: r.headless_refresh_count,
      sessionHealth: r.session_health as CookieRotationMonitor["sessionHealth"],
      nextRotationScheduledAt: r.next_rotation_scheduled_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  protected entityToRow(
    entity: Partial<CookieRotationMonitor>
  ): Record<string, unknown> {
    return {
      id: entity.id,
      profile_id: entity.profileId,
      cookie_id: entity.cookieId,
      worker_status: entity.workerStatus,
      last_psidts_rotation_at: entity.lastPsidtsRotationAt,
      last_sidcc_refresh_at: entity.lastSidccRefreshAt,
      psidts_rotation_count: entity.psidtsRotationCount,
      sidcc_refresh_count: entity.sidccRefreshCount,
      psidts_error_count: entity.psidtsErrorCount,
      sidcc_error_count: entity.sidccErrorCount,
      consecutive_failures: entity.consecutiveFailures,
      last_error_message: entity.lastErrorMessage,
      last_error_at: entity.lastErrorAt,
      requires_headless_refresh: entity.requiresHeadlessRefresh ? 1 : 0,
      last_headless_refresh_at: entity.lastHeadlessRefreshAt,
      headless_refresh_count: entity.headlessRefreshCount,
      session_health: entity.sessionHealth,
      next_rotation_scheduled_at: entity.nextRotationScheduledAt,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  /**
   * Find monitor by profile and cookie
   */
  async findByProfileAndCookie(
    profileId: string,
    cookieId: string
  ): Promise<CookieRotationMonitor | null> {
    const row = await this.db.get(
      `SELECT * FROM ${this.tableName} WHERE profile_id = ? AND cookie_id = ?`,
      [profileId, cookieId]
    );
    return row ? this.rowToEntity(row) : null;
  }

  /**
   * Find all monitors by profile
   */
  async findByProfileId(profileId: string): Promise<CookieRotationMonitor[]> {
    const rows = await this.db.all(
      `SELECT * FROM ${this.tableName} WHERE profile_id = ?`,
      [profileId]
    );
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Find monitors that require headless refresh
   */
  async findRequiringHeadlessRefresh(): Promise<CookieRotationMonitor[]> {
    const rows = await this.db.all(
      `SELECT * FROM ${this.tableName} WHERE requires_headless_refresh = 1`,
      []
    );
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Find monitors by health status
   */
  async findByHealth(
    health: CookieRotationMonitor["sessionHealth"]
  ): Promise<CookieRotationMonitor[]> {
    const rows = await this.db.all(
      `SELECT * FROM ${this.tableName} WHERE session_health = ?`,
      [health]
    );
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Find all running monitors
   */
  async findRunning(): Promise<CookieRotationMonitor[]> {
    const rows = await this.db.all(
      `SELECT * FROM ${this.tableName} WHERE worker_status = 'running'`,
      []
    );
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Update worker status
   */
  async updateWorkerStatus(
    id: string,
    status: CookieRotationMonitor["workerStatus"]
  ): Promise<void> {
    const now = new Date().toISOString();
    await this.db.run(
      `UPDATE ${this.tableName} SET worker_status = ?, updated_at = ? WHERE id = ?`,
      [status, now, id]
    );
  }

  /**
   * Update session health
   */
  async updateSessionHealth(
    id: string,
    health: CookieRotationMonitor["sessionHealth"]
  ): Promise<void> {
    const now = new Date().toISOString();
    await this.db.run(
      `UPDATE ${this.tableName} SET session_health = ?, updated_at = ? WHERE id = ?`,
      [health, now, id]
    );
  }

  /**
   * Record PSIDTS rotation
   */
  async recordPSIDTSRotation(id: string, success: boolean): Promise<void> {
    const now = new Date().toISOString();
    if (success) {
      await this.db.run(
        `UPDATE ${this.tableName} 
         SET last_psidts_rotation_at = ?,
             psidts_rotation_count = psidts_rotation_count + 1,
             consecutive_failures = 0,
             session_health = 'healthy',
             updated_at = ?
         WHERE id = ?`,
        [now, now, id]
      );
    } else {
      await this.db.run(
        `UPDATE ${this.tableName} 
         SET psidts_error_count = psidts_error_count + 1,
             consecutive_failures = consecutive_failures + 1,
             updated_at = ?
         WHERE id = ?`,
        [now, id]
      );
    }
  }

  /**
   * Record SIDCC refresh
   */
  async recordSIDCCRefresh(id: string, success: boolean): Promise<void> {
    const now = new Date().toISOString();
    if (success) {
      await this.db.run(
        `UPDATE ${this.tableName} 
         SET last_sidcc_refresh_at = ?,
             sidcc_refresh_count = sidcc_refresh_count + 1,
             consecutive_failures = 0,
             updated_at = ?
         WHERE id = ?`,
        [now, now, id]
      );
    } else {
      await this.db.run(
        `UPDATE ${this.tableName} 
         SET sidcc_error_count = sidcc_error_count + 1,
             consecutive_failures = consecutive_failures + 1,
             updated_at = ?
         WHERE id = ?`,
        [now, id]
      );
    }
  }

  /**
   * Record error
   */
  async recordError(id: string, errorMessage: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.run(
      `UPDATE ${this.tableName} 
       SET last_error_message = ?,
           last_error_at = ?,
           consecutive_failures = consecutive_failures + 1,
           worker_status = 'error',
           session_health = CASE 
             WHEN consecutive_failures >= 3 THEN 'expired'
             WHEN consecutive_failures >= 1 THEN 'degraded'
             ELSE session_health
           END,
           requires_headless_refresh = CASE 
             WHEN consecutive_failures >= 3 THEN 1
             ELSE requires_headless_refresh
           END,
           updated_at = ?
       WHERE id = ?`,
      [errorMessage, now, now, id]
    );
  }

  /**
   * Record headless refresh
   */
  async recordHeadlessRefresh(id: string, success: boolean): Promise<void> {
    const now = new Date().toISOString();
    if (success) {
      await this.db.run(
        `UPDATE ${this.tableName} 
         SET last_headless_refresh_at = ?,
             headless_refresh_count = headless_refresh_count + 1,
             requires_headless_refresh = 0,
             consecutive_failures = 0,
             session_health = 'healthy',
             worker_status = 'running',
             updated_at = ?
         WHERE id = ?`,
        [now, now, id]
      );
    } else {
      await this.db.run(
        `UPDATE ${this.tableName} 
         SET headless_refresh_count = headless_refresh_count + 1,
             session_health = 'expired',
             worker_status = 'error',
             updated_at = ?
         WHERE id = ?`,
        [now, id]
      );
    }
  }

  /**
   * Mark as requiring headless refresh
   */
  async markRequiresHeadlessRefresh(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.run(
      `UPDATE ${this.tableName} SET requires_headless_refresh = 1, updated_at = ? WHERE id = ?`,
      [now, id]
    );
  }

  /**
   * Get summary statistics
   */
  async getSummary(): Promise<{
    total: number;
    running: number;
    stopped: number;
    error: number;
    healthy: number;
    degraded: number;
    expired: number;
    requiresHeadless: number;
  }> {
    const result = await this.db.get(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN worker_status = 'running' THEN 1 ELSE 0 END) as running,
        SUM(CASE WHEN worker_status = 'stopped' THEN 1 ELSE 0 END) as stopped,
        SUM(CASE WHEN worker_status = 'error' THEN 1 ELSE 0 END) as error,
        SUM(CASE WHEN session_health = 'healthy' THEN 1 ELSE 0 END) as healthy,
        SUM(CASE WHEN session_health = 'degraded' THEN 1 ELSE 0 END) as degraded,
        SUM(CASE WHEN session_health = 'expired' THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN requires_headless_refresh = 1 THEN 1 ELSE 0 END) as requiresHeadless
       FROM ${this.tableName}`,
      []
    );

    return {
      total: result.total || 0,
      running: result.running || 0,
      stopped: result.stopped || 0,
      error: result.error || 0,
      healthy: result.healthy || 0,
      degraded: result.degraded || 0,
      expired: result.expired || 0,
      requiresHeadless: result.requiresHeadless || 0,
    };
  }
}
