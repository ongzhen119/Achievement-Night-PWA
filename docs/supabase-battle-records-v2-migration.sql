-- Run this after supabase-community-migration.sql
-- Adds glory_score, notes, display_name to battle_records

ALTER TABLE battle_records ADD COLUMN IF NOT EXISTS glory_score integer;
ALTER TABLE battle_records ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE battle_records ADD COLUMN IF NOT EXISTS display_name text;

-- Index for community leaderboard queries
CREATE INDEX IF NOT EXISTS idx_battle_records_glory
  ON battle_records (display_name, glory_score)
  WHERE glory_score IS NOT NULL;
