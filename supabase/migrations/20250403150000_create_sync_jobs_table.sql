-- Add schema version
BEGIN;

-- Create sync_jobs table in the public schema to ensure it's accessible
CREATE TABLE IF NOT EXISTS public.sync_jobs (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL DEFAULT 3,
  group_id INTEGER,
  name TEXT NOT NULL,
  abbreviation TEXT,
  published_on TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT, -- 'pending', 'processing', 'completed', 'failed'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  time_taken INTERVAL GENERATED ALWAYS AS (completed_at - started_at) STORED,
  error TEXT
);

COMMIT;