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
CREATE TABLE IF NOT EXISTS youtube_channels (
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
  FOREIGN KEY (channel_id) REFERENCES youtube_channels(channel_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_automation_tasks_profile_id ON automation_tasks(profile_id);
CREATE INDEX IF NOT EXISTS idx_automation_tasks_status ON automation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_veo3_projects_profile_id ON veo3_projects(profile_id);
CREATE INDEX IF NOT EXISTS idx_veo3_projects_status ON veo3_projects(status);
CREATE INDEX IF NOT EXISTS idx_youtube_video_analyses_channel_id ON youtube_video_analyses(channel_id);

