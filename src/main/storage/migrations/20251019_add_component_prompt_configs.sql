-- Migration: Add component_prompt_configs table
-- This table stores the configuration mapping between UI components and master prompts

CREATE TABLE IF NOT EXISTS component_prompt_configs (
  id TEXT PRIMARY KEY,
  component_name TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  prompt_id INTEGER NOT NULL,
  ai_model TEXT DEFAULT 'GEMINI_2_5_PRO',
  enabled INTEGER DEFAULT 1,
  use_temp_chat INTEGER DEFAULT 0,
  keep_context INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (prompt_id) REFERENCES master_prompts(id) ON DELETE CASCADE,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(component_name, profile_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_component_prompt_configs_component_name ON component_prompt_configs(component_name);
CREATE INDEX IF NOT EXISTS idx_component_prompt_configs_profile_id ON component_prompt_configs(profile_id);
CREATE INDEX IF NOT EXISTS idx_component_prompt_configs_prompt_id ON component_prompt_configs(prompt_id);
CREATE INDEX IF NOT EXISTS idx_component_prompt_configs_enabled ON component_prompt_configs(enabled);
