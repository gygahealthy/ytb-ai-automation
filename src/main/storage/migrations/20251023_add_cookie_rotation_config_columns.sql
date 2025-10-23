-- Add per-cookie rotation configuration columns to cookies table
-- Date: 2025-10-23

-- Add column to control if worker should launch on app startup for this cookie
ALTER TABLE cookies ADD COLUMN launch_worker_on_startup INTEGER DEFAULT 0;

-- Add column for enabled rotation methods (JSON array)
-- Default: ["refreshCreds", "rotateCookie"] - enables both methods
ALTER TABLE cookies ADD COLUMN enabled_rotation_methods TEXT DEFAULT '["refreshCreds","rotateCookie"]';

-- Add column for rotation method fallback order (JSON array)
-- Default: ["refreshCreds", "rotateCookie", "headless"] - try refreshCreds first, then rotate, then headless
ALTER TABLE cookies ADD COLUMN rotation_method_order TEXT DEFAULT '["refreshCreds","rotateCookie","headless"]';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cookies_launch_on_startup ON cookies(launch_worker_on_startup) WHERE launch_worker_on_startup = 1;
