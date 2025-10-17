-- Migration: Populate master_prompt_types with initial data
-- Date: 2025-10-17
-- Purpose: Insert standard prompt types into master_prompt_types table

-- Insert standard prompt types with type_code and status
INSERT OR IGNORE INTO master_prompt_types (type_name, type_code, description, status, created_at)
VALUES 
  ('Script', 'SCRIPT', 'Script generation prompts', 1, datetime('now')),
  ('Topic', 'TOPIC', 'Topic generation prompts', 1, datetime('now')),
  ('Video Prompt', 'VIDEO_PROMPT', 'Video/VEO3 generation prompts', 1, datetime('now')),
  ('Audio Prompt', 'AUDIO_PROMPT', 'Audio generation prompts', 1, datetime('now')),
  ('Video Creation', 'video_creation', 'Video creation prompts', 1, datetime('now')),
  ('Platform Analysis', 'platform_analysis', 'Platform analysis prompts', 1, datetime('now')),
  ('Channel Analysis', 'channel_analysis', 'Channel analysis prompts', 1, datetime('now'));
