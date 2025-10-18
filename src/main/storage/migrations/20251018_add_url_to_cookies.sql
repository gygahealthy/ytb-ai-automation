-- Migration: Add url column to cookies table
-- This migration adds the missing 'url' column to the cookies table

-- Check if url column already exists and add it if it doesn't
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we'll use a workaround

-- First, we need to recreate the table with the new schema since SQLite doesn't support adding constraints easily
-- We'll create a backup, recreate with new schema, and restore data

-- Create a temporary backup of the old table
CREATE TABLE cookies_backup AS SELECT * FROM cookies;

-- Drop the old table
DROP TABLE cookies;

-- Create the new table with the correct schema
CREATE TABLE IF NOT EXISTS cookies (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  url TEXT NOT NULL,
  service TEXT NOT NULL,
  gemini_token TEXT,
  raw_cookie_string TEXT,
  last_rotated_at TEXT,
  spid_expiration TEXT,
  rotation_data TEXT,
  rotation_interval_minutes INTEGER DEFAULT 1440,
  status TEXT NOT NULL CHECK(status IN ('active', 'expired', 'renewal_failed')) DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(profile_id, url, service)
);

-- Restore data from backup (without url since it's required now)
-- For existing cookies, we'll use the service name as the url placeholder
INSERT INTO cookies (
  id, profile_id, url, service, gemini_token, raw_cookie_string,
  last_rotated_at, spid_expiration, rotation_data, rotation_interval_minutes,
  status, created_at, updated_at
)
SELECT 
  id, profile_id, COALESCE(service, 'unknown'), service, gemini_token,
  raw_cookie_string, last_rotated_at, spid_expiration, rotation_data,
  rotation_interval_minutes, status, created_at, updated_at
FROM cookies_backup;

-- Drop the backup table
DROP TABLE cookies_backup;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_cookies_profile_id ON cookies(profile_id);
CREATE INDEX IF NOT EXISTS idx_cookies_status ON cookies(status);
CREATE INDEX IF NOT EXISTS idx_cookies_last_rotated ON cookies(last_rotated_at);
