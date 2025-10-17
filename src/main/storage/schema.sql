-- VEO3 Automation Database Schema

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  browser_path TEXT,
  user_data_dir TEXT NOT NULL,
  user_agent TEXT,
  proxy_server TEXT,
  proxy_username TEXT,
  proxy_password TEXT,
  credit_remaining REAL DEFAULT 0,
  tags TEXT, -- JSON array of tags
  cookies TEXT,
  cookie_expires TEXT,
  is_logged_in INTEGER DEFAULT 0, -- 0 = false, 1 = true
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Automation tasks table
CREATE TABLE IF NOT EXISTS automation_tasks (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  actions TEXT NOT NULL, -- JSON array
  status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'completed', 'failed', 'stopped')),
  started_at TEXT,
  completed_at TEXT,
  error TEXT,
  logs TEXT NOT NULL, -- JSON array
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- VEO3 projects table
CREATE TABLE IF NOT EXISTS veo3_projects (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL UNIQUE,
  profile_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('draft', 'processing', 'completed', 'failed')),
  scenes TEXT NOT NULL, -- JSON array
  json_prompt TEXT, -- JSON object
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- NOTE: table was previously named 'youtube_channels'. New canonical name: 'channels'
CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL UNIQUE,
  channel_name TEXT NOT NULL,
  channel_url TEXT NOT NULL,
  subscriber_count INTEGER,
  video_count INTEGER,
  view_count INTEGER,
  last_analyzed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS youtube_video_analyses (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL UNIQUE,
  video_title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  views INTEGER NOT NULL,
  likes INTEGER NOT NULL,
  comments INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  published_at TEXT NOT NULL,
  analyzed_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (channel_id) REFERENCES channels(channel_id) ON DELETE CASCADE
);

-- NOTE: table was previously named 'youtube_channel_deep_dive'. New canonical name: 'channel_deep_dive'
CREATE TABLE IF NOT EXISTS channel_deep_dive (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL UNIQUE,
  strategy_markdown TEXT, -- Markdown formatted strategy
  usp_markdown TEXT, -- Unique Selling Proposition in markdown
  target_audience TEXT, -- JSON object describing target audience
  content_pillars TEXT, -- JSON array of content pillars
  tone_and_style TEXT, -- Brand tone and style description
  goals TEXT, -- JSON array of short-term and long-term goals
  notes TEXT, -- Additional notes
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (channel_id) REFERENCES channels(channel_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS channel_playlists (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  playlist_id TEXT, -- YouTube playlist ID (nullable for internal-only playlists)
  name TEXT NOT NULL,
  description TEXT,
  video_count INTEGER DEFAULT 0,
  is_public INTEGER DEFAULT 1, -- 0 = private, 1 = public
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (channel_id) REFERENCES channels(channel_id) ON DELETE CASCADE
);

-- Playlist video mapping
CREATE TABLE IF NOT EXISTS playlist_videos (
  id TEXT PRIMARY KEY,
  playlist_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  position INTEGER, -- Order in playlist
  added_at TEXT NOT NULL,
  FOREIGN KEY (playlist_id) REFERENCES channel_playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES youtube_video_analyses(video_id) ON DELETE CASCADE,
  UNIQUE(playlist_id, video_id)
);

-- Competitor channels tracking
CREATE TABLE IF NOT EXISTS channel_competitors (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL, -- Our channel
  competitor_channel_id TEXT NOT NULL, -- Competitor's YouTube channel ID
  competitor_name TEXT NOT NULL,
  competitor_url TEXT NOT NULL,
  subscriber_count INTEGER,
  avg_views INTEGER,
  upload_frequency TEXT, -- 'daily', 'weekly', etc.
  notes TEXT,
  last_analyzed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (channel_id) REFERENCES channels(channel_id) ON DELETE CASCADE
);

-- Channel performance metrics (daily snapshots)
CREATE TABLE IF NOT EXISTS channel_performance_metrics (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  metric_date TEXT NOT NULL, -- Date of the snapshot (YYYY-MM-DD)
  subscriber_count INTEGER NOT NULL,
  total_views INTEGER NOT NULL,
  video_count INTEGER NOT NULL,
  avg_views_per_video INTEGER,
  engagement_rate REAL, -- Calculated engagement percentage
  daily_views INTEGER, -- Views gained in this day
  daily_subscribers INTEGER, -- Subscribers gained in this day
  created_at TEXT NOT NULL,
  FOREIGN KEY (channel_id) REFERENCES channels(channel_id) ON DELETE CASCADE,
  UNIQUE(channel_id, metric_date)
);

-- Upcoming topics for content planning
CREATE TABLE IF NOT EXISTS channel_topics (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  topic_title TEXT NOT NULL,
  topic_description TEXT,
  priority TEXT CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status TEXT CHECK(status IN ('idea', 'planned', 'in_progress', 'completed', 'archived')) DEFAULT 'idea',
  target_date TEXT, -- Target publication date
  tags TEXT, -- JSON array of tags
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (channel_id) REFERENCES channels(channel_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_automation_tasks_profile_id ON automation_tasks(profile_id);
CREATE INDEX IF NOT EXISTS idx_automation_tasks_status ON automation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_veo3_projects_profile_id ON veo3_projects(profile_id);
CREATE INDEX IF NOT EXISTS idx_veo3_projects_status ON veo3_projects(status);
CREATE INDEX IF NOT EXISTS idx_youtube_video_analyses_channel_id ON youtube_video_analyses(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_playlists_channel_id ON channel_playlists(channel_id);
CREATE INDEX IF NOT EXISTS idx_playlist_videos_playlist_id ON playlist_videos(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_videos_video_id ON playlist_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_channel_competitors_channel_id ON channel_competitors(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_performance_channel_id ON channel_performance_metrics(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_performance_date ON channel_performance_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_channel_topics_channel_id ON channel_topics(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_topics_status ON channel_topics(status);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  browser_path TEXT,
  user_data_dir TEXT NOT NULL,
  user_agent TEXT,
  proxy_server TEXT,
  proxy_username TEXT,
  proxy_password TEXT,
  credit_remaining REAL DEFAULT 0,
  tags TEXT, -- JSON array of tags
  cookies TEXT,
  cookie_expires TEXT,
  is_logged_in INTEGER DEFAULT 0, -- 0 = false, 1 = true
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Automation tasks table
CREATE TABLE IF NOT EXISTS automation_tasks (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  actions TEXT NOT NULL, -- JSON array
  status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'completed', 'failed', 'stopped')),
  started_at TEXT,
  completed_at TEXT,
  error TEXT,
  logs TEXT NOT NULL, -- JSON array
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- VEO3 projects table
CREATE TABLE IF NOT EXISTS veo3_projects (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL UNIQUE,
  profile_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('draft', 'processing', 'completed', 'failed')),
  scenes TEXT NOT NULL, -- JSON array
  json_prompt TEXT, -- JSON object
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- YouTube channels table
-- NOTE: table was previously named 'youtube_channels'. New canonical name: 'channels'
CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL UNIQUE,
  channel_name TEXT NOT NULL,
  channel_url TEXT NOT NULL,
  subscriber_count INTEGER,
  video_count INTEGER,
  view_count INTEGER,
  last_analyzed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- YouTube video analyses table
CREATE TABLE IF NOT EXISTS youtube_video_analyses (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL UNIQUE,
  video_title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  views INTEGER NOT NULL,
  likes INTEGER NOT NULL,
  comments INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  published_at TEXT NOT NULL,
  analyzed_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (channel_id) REFERENCES channels(channel_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_automation_tasks_profile_id ON automation_tasks(profile_id);
CREATE INDEX IF NOT EXISTS idx_automation_tasks_status ON automation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_veo3_projects_profile_id ON veo3_projects(profile_id);
CREATE INDEX IF NOT EXISTS idx_veo3_projects_status ON veo3_projects(status);
CREATE INDEX IF NOT EXISTS idx_youtube_video_analyses_channel_id ON youtube_video_analyses(channel_id);

-- Master prompts table for AI configurations
CREATE TABLE IF NOT EXISTS master_prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL, -- 'youtube', 'tiktok', 'veo3', 'openai', etc.
  prompt_template TEXT NOT NULL, -- The actual prompt with [VARIABLE] placeholders
  description TEXT,
  prompt_type_id INTEGER NOT NULL, -- Foreign key to master_prompt_types
  channel_id TEXT, -- Link prompt to specific channel (NULL = global)
  tags TEXT, -- JSON array of tags
  is_active INTEGER DEFAULT 1,
  archived INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (prompt_type_id) REFERENCES master_prompt_types(id) ON DELETE CASCADE,
  FOREIGN KEY (channel_id) REFERENCES channels(channel_id) ON DELETE CASCADE
);

-- Master prompt types reference table
CREATE TABLE IF NOT EXISTS master_prompt_types (
  id INTEGER PRIMARY KEY,
  type_name TEXT NOT NULL UNIQUE,
  type_code TEXT NOT NULL UNIQUE,
  description TEXT,
  status INTEGER DEFAULT 1, -- 0 = inactive, 1 = active
  created_at TEXT NOT NULL
);

-- Create index for master prompts
CREATE INDEX IF NOT EXISTS idx_master_prompts_provider ON master_prompts(provider);
CREATE INDEX IF NOT EXISTS idx_master_prompts_channel ON master_prompts(channel_id);
CREATE INDEX IF NOT EXISTS idx_master_prompts_type_id ON master_prompts(prompt_type_id);
CREATE INDEX IF NOT EXISTS idx_master_prompts_channel_type ON master_prompts(channel_id, prompt_type_id);
CREATE INDEX IF NOT EXISTS idx_master_prompts_active_type ON master_prompts(is_active, prompt_type_id);

-- Prompt history table for version control and rollback
CREATE TABLE IF NOT EXISTS master_prompt_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prompt_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  description TEXT,
  prompt_type_id INTEGER NOT NULL,
  tags TEXT, -- JSON array of tags
  is_active INTEGER DEFAULT 1,
  archived INTEGER DEFAULT 0,
  change_note TEXT, -- Optional note about what changed
  digest TEXT, -- SHA-256 digest of normalized content for duplicate detection
  digest_short TEXT, -- short prefix of digest to speed indexed lookups
  created_at TEXT NOT NULL,
  FOREIGN KEY (prompt_id) REFERENCES master_prompts(id) ON DELETE CASCADE,
  FOREIGN KEY (prompt_type_id) REFERENCES master_prompt_types(id) ON DELETE CASCADE
);

-- Create index for prompt history
CREATE INDEX IF NOT EXISTS idx_prompt_history_prompt_id ON master_prompt_history(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_history_created_at ON master_prompt_history(created_at);

