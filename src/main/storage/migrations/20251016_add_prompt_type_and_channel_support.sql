-- Migration 013: Add prompt_type column and create prompt types table
-- This migration adds support for categorizing master prompts by type (script, topic, video_prompt, audio_prompt)
-- and ensures all prompts are associated with a channel or marked as global

-- First, create a prompt_types enum-like table for reference
CREATE TABLE IF NOT EXISTS prompt_types (
  id INTEGER PRIMARY KEY,
  type_name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL
);

-- Insert standard prompt types
INSERT OR IGNORE INTO prompt_types (type_name, description, created_at)
VALUES 
  ('script', 'Script generation prompts', datetime('now')),
  ('topic', 'Topic generation prompts', datetime('now')),
  ('video_prompt', 'Video/VEO3 generation prompts', datetime('now')),
  ('audio_prompt', 'Audio generation prompts', datetime('now'));

-- Add prompt_type column to master_prompts table if it doesn't exist
-- Default to 'script' for existing prompts
ALTER TABLE master_prompts ADD COLUMN prompt_type TEXT DEFAULT 'script' CHECK(prompt_type IN ('script', 'topic', 'video_prompt', 'audio_prompt'));

-- Add an index for faster queries by prompt_type
CREATE INDEX IF NOT EXISTS idx_master_prompts_type ON master_prompts(prompt_type);

-- Create a composite index for channel + type queries
CREATE INDEX IF NOT EXISTS idx_master_prompts_channel_type ON master_prompts(channel_id, prompt_type);

-- Add a composite index for is_active + prompt_type for common filter queries
CREATE INDEX IF NOT EXISTS idx_master_prompts_active_type ON master_prompts(is_active, prompt_type);
