/* Migration: Rename youtube tables to canonical names
   - youtube_channels -> channels
   - youtube_channel_deep_dive -> channel_deep_dive

   This migration preserves existing data. It performs simple ALTER TABLE RENAME
   operations which are supported by SQLite. Any related indexes, triggers, or
   foreign keys referencing the old table names should continue to work, but
   it's recommended to review them after running migrations.
*/

PRAGMA foreign_keys=off;
BEGIN TRANSACTION;

-- Rename youtube_channels to channels
ALTER TABLE youtube_channels RENAME TO channels;

-- Rename youtube_channel_deep_dive to channel_deep_dive
ALTER TABLE youtube_channel_deep_dive RENAME TO channel_deep_dive;

COMMIT;
PRAGMA foreign_keys=on;
