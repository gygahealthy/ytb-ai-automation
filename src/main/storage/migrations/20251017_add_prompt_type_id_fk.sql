-- Migration: Add prompt_type_id foreign key to master_prompts table
-- Date: 2025-10-17
-- Purpose: Link master_prompts to master_prompt_types via foreign key instead of hardcoded enum

-- Step 1: Add new prompt_type_id column (temporary)
ALTER TABLE master_prompts ADD COLUMN prompt_type_id INTEGER;

-- Step 2: Migrate existing data from prompt_type to prompt_type_id
-- Map the existing prompt_type enum values to master_prompt_types records
UPDATE master_prompts mp
SET prompt_type_id = (
  SELECT id FROM master_prompt_types mpt
  WHERE (
    (mp.prompt_type = 'script' AND mpt.type_code = 'SCRIPT') OR
    (mp.prompt_type = 'topic' AND mpt.type_code = 'TOPIC') OR
    (mp.prompt_type = 'video_prompt' AND mpt.type_code = 'VIDEO_PROMPT') OR
    (mp.prompt_type = 'audio_prompt' AND mpt.type_code = 'AUDIO_PROMPT')
  )
  LIMIT 1
)
WHERE prompt_type IS NOT NULL;

-- Step 3: Add foreign key constraint
CREATE TABLE master_prompts_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  prompt_kind TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  description TEXT,
  channel_id TEXT,
  prompt_type_id INTEGER NOT NULL,
  tags TEXT,
  is_active INTEGER DEFAULT 1,
  archived INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (channel_id) REFERENCES channels(channel_id) ON DELETE CASCADE,
  FOREIGN KEY (prompt_type_id) REFERENCES master_prompt_types(id) ON DELETE RESTRICT
);

-- Step 4: Copy data from old table to new table
INSERT INTO master_prompts_new
SELECT id, provider, prompt_kind, prompt_template, description, channel_id, 
       prompt_type_id, tags, is_active, archived, created_at, updated_at
FROM master_prompts
WHERE prompt_type_id IS NOT NULL;

-- Step 5: Drop old table and rename new one
DROP TABLE master_prompts;
ALTER TABLE master_prompts_new RENAME TO master_prompts;

-- Step 6: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_master_prompts_provider ON master_prompts(provider);
CREATE INDEX IF NOT EXISTS idx_master_prompts_kind ON master_prompts(prompt_kind);
CREATE INDEX IF NOT EXISTS idx_master_prompts_channel ON master_prompts(channel_id);
CREATE INDEX IF NOT EXISTS idx_master_prompts_type_id ON master_prompts(prompt_type_id);
CREATE INDEX IF NOT EXISTS idx_master_prompts_channel_type ON master_prompts(channel_id, prompt_type_id);
CREATE INDEX IF NOT EXISTS idx_master_prompts_active_type ON master_prompts(is_active, prompt_type_id);
