-- Run this in Supabase SQL Editor to allow anyone to post notes (no passcode)
-- The confession board is now fully open/anonymous

-- Drop the old insert policy if it exists
DROP POLICY IF EXISTS "confessions_insert" ON confessions;

-- Allow anyone (including anon) to insert
CREATE POLICY "confessions_anon_insert" ON confessions
  FOR INSERT TO anon, authenticated WITH CHECK (true);
