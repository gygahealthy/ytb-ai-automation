-- Migration: Add cookie rotation monitoring table
-- Date: 2025-01-22
-- Description: Creates cookie_rotation_monitors table for tracking rotation worker status

CREATE TABLE IF NOT EXISTS cookie_rotation_monitors (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  cookie_id TEXT NOT NULL,
  worker_status TEXT NOT NULL CHECK(worker_status IN ('running', 'stopped', 'error', 'initializing')) DEFAULT 'stopped',
  last_psidts_rotation_at TEXT,
  last_sidcc_refresh_at TEXT,
  psidts_rotation_count INTEGER DEFAULT 0,
  sidcc_refresh_count INTEGER DEFAULT 0,
  psidts_error_count INTEGER DEFAULT 0,
  sidcc_error_count INTEGER DEFAULT 0,
  consecutive_failures INTEGER DEFAULT 0,
  last_error_message TEXT,
  last_error_at TEXT,
  requires_headless_refresh INTEGER DEFAULT 0,
  last_headless_refresh_at TEXT,
  headless_refresh_count INTEGER DEFAULT 0,
  session_health TEXT CHECK(session_health IN ('healthy', 'degraded', 'expired', 'unknown')) DEFAULT 'unknown',
  next_rotation_scheduled_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (cookie_id) REFERENCES cookies(id) ON DELETE CASCADE,
  UNIQUE(profile_id, cookie_id)
);

-- Create indexes for rotation monitoring
CREATE INDEX IF NOT EXISTS idx_rotation_monitors_profile_id ON cookie_rotation_monitors(profile_id);
CREATE INDEX IF NOT EXISTS idx_rotation_monitors_status ON cookie_rotation_monitors(worker_status);
CREATE INDEX IF NOT EXISTS idx_rotation_monitors_health ON cookie_rotation_monitors(session_health);
CREATE INDEX IF NOT EXISTS idx_rotation_monitors_requires_headless ON cookie_rotation_monitors(requires_headless_refresh);
