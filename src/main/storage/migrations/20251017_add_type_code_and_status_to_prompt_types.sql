-- Migration 016: Add type_code and status columns to master_prompt_types
-- This migration adds support for unique type codes and status tracking (active/inactive)
-- for prompt types management

-- Add type_code column if it doesn't exist
ALTER TABLE master_prompt_types ADD COLUMN type_code TEXT;

-- Add status column if it doesn't exist (0 = inactive, 1 = active)
ALTER TABLE master_prompt_types ADD COLUMN status INTEGER DEFAULT 1;

-- Migrate existing data: generate type_code from type_name
-- Convert to uppercase and replace spaces with underscores
UPDATE master_prompt_types 
SET type_code = UPPER(REPLACE(type_name, ' ', '_'))
WHERE type_code IS NULL;

-- Make type_code unique (after migration completes in migrations.ts)
-- This will be done programmatically to handle edge cases
