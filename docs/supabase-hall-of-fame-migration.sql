-- Run this in Supabase SQL Editor

-- 1. Add season_label to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS season_label text;

-- 2. Create hall_of_fame table
CREATE TABLE IF NOT EXISTS hall_of_fame (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_label text NOT NULL,
  event_id uuid REFERENCES events(id),
  event_name text NOT NULL,
  event_date date NOT NULL,
  champion_name text NOT NULL,
  warband text NOT NULL,
  score integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. Enable RLS and allow public read / anon insert
ALTER TABLE hall_of_fame ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read hall_of_fame"
  ON hall_of_fame FOR SELECT USING (true);

CREATE POLICY "anon insert hall_of_fame"
  ON hall_of_fame FOR INSERT WITH CHECK (true);
