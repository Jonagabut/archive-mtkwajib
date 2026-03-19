-- ================================================================
-- MTK WAJIB ARCHIVE — SCHEMA ADDITIONS
-- Run this AFTER the main schema.sql
-- ================================================================

-- ----------------------------------------------------------------
-- TABLE: songs
-- Used by the custom MusicPlayer widget on the frontend.
-- Admin uploads audio files to Supabase Storage, then inserts rows here.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS songs (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        VARCHAR(120) NOT NULL,
  artist       VARCHAR(80)  NOT NULL DEFAULT 'MTK Wajib 2026',
  storage_url  TEXT         NOT NULL,  -- Public URL from Supabase Storage
  cover_url    TEXT,                   -- Optional album art URL
  track_order  SMALLINT     DEFAULT 0, -- Controls playlist order
  is_active    BOOLEAN      DEFAULT TRUE,
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- Index for the ordered playlist query
CREATE INDEX IF NOT EXISTS idx_songs_order ON songs(track_order ASC) WHERE is_active = TRUE;

-- RLS: Anyone can read (playlist is public), only service role can write
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "songs_public_read" ON songs
  FOR SELECT USING (is_active = TRUE);

-- ----------------------------------------------------------------
-- REALTIME: Enable replication for the confessions table
-- This is what makes new notes appear live on other users' screens
-- without them having to refresh.
--
-- Run this in Supabase SQL Editor, OR enable it in the Dashboard:
--   Database → Replication → Tables → toggle ON for 'confessions'
-- ----------------------------------------------------------------
ALTER TABLE confessions REPLICA IDENTITY FULL;

-- Also add confessions to the realtime publication
-- (Supabase usually does this via the dashboard toggle, but this
--  SQL approach works too if you prefer to script it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'confessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE confessions;
  END IF;
END $$;

-- ----------------------------------------------------------------
-- EXAMPLE SEED: Add songs (replace URLs with real Supabase storage URLs)
-- ----------------------------------------------------------------
-- INSERT INTO songs (title, artist, storage_url, track_order) VALUES
--   ('Memories',         'Maroon 5',        'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/music/memories.mp3',         1),
--   ('See You Again',    'Wiz Khalifa',      'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/music/see-you-again.mp3',    2),
--   ('Young And Beautiful', 'Lana Del Rey',  'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/music/young-beautiful.mp3', 3);
