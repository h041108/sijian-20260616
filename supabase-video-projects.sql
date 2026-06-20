-- 即影作品云端存储表
-- 在 Supabase SQL Editor 中执行:
-- https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new

CREATE TABLE IF NOT EXISTS video_projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  one_liner TEXT NOT NULL DEFAULT '',
  genre TEXT NOT NULL DEFAULT 'short_drama',
  style TEXT NOT NULL DEFAULT '',
  duration INTEGER NOT NULL DEFAULT 60,
  aspect_ratio TEXT NOT NULL DEFAULT '16:9',
  status TEXT NOT NULL DEFAULT 'draft',
  stages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_video_projects_user_id ON video_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_video_projects_created_at ON video_projects(created_at DESC);

-- RLS 策略（允许匿名读写）
ALTER TABLE video_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON video_projects FOR ALL USING (true) WITH CHECK (true);
