-- Create cookies table for storing Gemini API authentication cookies
CREATE TABLE IF NOT EXISTS cookies (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  gemini_token TEXT,
  raw_cookie_string TEXT,
  last_rotated_at TEXT,
  spid_expiration TEXT,
  rotation_data TEXT, -- JSON column for rotated keys
  rotation_interval_minutes INTEGER DEFAULT 1440, -- Default to 24 hours
  status TEXT NOT NULL CHECK(status IN ('active', 'expired', 'renewal_failed')) DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(profile_id, domain)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cookies_profile_id ON cookies(profile_id);
CREATE INDEX IF NOT EXISTS idx_cookies_status ON cookies(status);
CREATE INDEX IF NOT EXISTS idx_cookies_last_rotated ON cookies(last_rotated_at);

-- Drop old cookie columns from profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS cookies;
ALTER TABLE profiles DROP COLUMN IF EXISTS cookie_expires;
