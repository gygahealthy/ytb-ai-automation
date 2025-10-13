/* Migration: Copy data from old youtube_* tables to new canonical tables if they exist
   - This migration checks whether the old tables exist and whether the new tables are empty or missing rows,
     then inserts the data into the new tables.
   - It is written to be safe to run multiple times (idempotent) using EXISTS checks.
*/

PRAGMA foreign_keys=off;
BEGIN TRANSACTION;

-- Copy channels data if old table exists and new table is empty
INSERT OR IGNORE INTO channels (id, channel_id, channel_name, channel_url, subscriber_count, video_count, view_count, last_analyzed_at, created_at, updated_at)
SELECT id, channel_id, channel_name, channel_url, subscriber_count, video_count, view_count, last_analyzed_at, created_at, updated_at
FROM sqlite_master AS m JOIN (
  SELECT * FROM youtube_channels
) AS old ON ( (SELECT name FROM sqlite_master WHERE type='table' AND name='youtube_channels') IS NOT NULL )
WHERE NOT EXISTS (SELECT 1 FROM channels LIMIT 1);

-- Copy deep dive data if old deep dive exists and new deep dive table is empty
INSERT OR IGNORE INTO channel_deep_dive (id, channel_id, strategy_markdown, usp_markdown, target_audience, content_pillars, tone_and_style, goals, notes, created_at, updated_at)
SELECT id, channel_id, strategy_markdown, usp_markdown, target_audience, content_pillars, tone_and_style, goals, notes, created_at, updated_at
FROM sqlite_master AS m JOIN (
  SELECT * FROM youtube_channel_deep_dive
) AS old ON ( (SELECT name FROM sqlite_master WHERE type='table' AND name='youtube_channel_deep_dive') IS NOT NULL )
WHERE NOT EXISTS (SELECT 1 FROM channel_deep_dive LIMIT 1);

COMMIT;
PRAGMA foreign_keys=on;
