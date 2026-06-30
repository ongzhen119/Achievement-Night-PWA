-- Run this in Supabase SQL Editor after supabase-hall-of-fame-migration.sql

-- 1. Link players to community profiles
ALTER TABLE players ADD COLUMN IF NOT EXISTS community_player_id text;

-- 2. Link hall_of_fame champions to community profiles
ALTER TABLE hall_of_fame ADD COLUMN IF NOT EXISTS community_player_id text;

-- 3. Create battle_records table
CREATE TABLE IF NOT EXISTS battle_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_player_id text NOT NULL,
  event_id uuid REFERENCES events(id),
  event_slug text,
  battle_result text NOT NULL CHECK (battle_result IN ('win', 'loss', 'draw')),
  warband text NOT NULL,
  opponent_warband text,
  format text,
  epic_moments text[],
  created_at timestamptz DEFAULT now()
);

-- 4. RLS for battle_records
ALTER TABLE battle_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read battle_records"
  ON battle_records FOR SELECT USING (true);

CREATE POLICY "anon insert battle_records"
  ON battle_records FOR INSERT WITH CHECK (true);

-- 5. Index for profile stat queries
CREATE INDEX IF NOT EXISTS idx_battle_records_community_player
  ON battle_records (community_player_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_players_community_player
  ON players (community_player_id);
