/**
 * Migration 027: Add rotation status tracking fields to cookie_rotation_monitors
 * Adds last_rotation_success and last_rotation_method columns for UI status indicators
 */

import type { SQLiteDatabase } from "../../sqlite-database";

export const version = 27;
export const description = "Add rotation status tracking (success/failure) to monitors";

export async function up(db: SQLiteDatabase): Promise<void> {
  // Check if columns already exist
  const columns = await db.all("PRAGMA table_info(cookie_rotation_monitors)");

  const hasSuccessColumn = columns.some((c: any) => c.name === "last_rotation_success");
  const hasMethodColumn = columns.some((c: any) => c.name === "last_rotation_method");

  // Add last_rotation_success column (1 = true, 0 = false, NULL = unknown/never rotated)
  if (!hasSuccessColumn) {
    await db.run(`
      ALTER TABLE cookie_rotation_monitors 
      ADD COLUMN last_rotation_success INTEGER DEFAULT NULL
    `);
  }

  // Add last_rotation_method column (which method was last used: headless, refreshCreds, rotateCookie)
  if (!hasMethodColumn) {
    await db.run(`
      ALTER TABLE cookie_rotation_monitors 
      ADD COLUMN last_rotation_method TEXT DEFAULT NULL
    `);
  }
}

export async function down(_db: SQLiteDatabase): Promise<void> {
  // SQLite doesn't support DROP COLUMN in older versions, so we skip rollback
  // The columns will simply remain unused if rolled back
  console.warn(`[Migration ${version}] Rollback not implemented (SQLite limitation)`);
}
