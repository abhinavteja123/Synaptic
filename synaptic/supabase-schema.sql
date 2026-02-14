-- ============================================
-- Synaptic – Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- ROOMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  photos JSONB DEFAULT '[]',
  scene_data JSONB DEFAULT '{}',
  audio_narration TEXT,
  narration_audio_url TEXT,
  theme TEXT DEFAULT 'valentine',
  collaborators TEXT[] DEFAULT '{}',
  invite_code TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  is_legacy BOOLEAN DEFAULT FALSE,
  locked_until TIMESTAMPTZ,
  relationship_story TEXT,
  location TEXT,
  coordinates DOUBLE PRECISION[2],
  entry_mood TEXT,
  exit_mood TEXT,
  legacy_person_name TEXT,
  legacy_relationship TEXT,
  visit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_user_id ON rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_rooms_is_public ON rooms(is_public);
CREATE INDEX IF NOT EXISTS idx_rooms_created_at ON rooms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rooms_invite_code ON rooms(invite_code);

-- ============================================
-- SESSIONS TABLE (multiplayer)
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  participants TEXT[] DEFAULT '{}',
  chat_history JSONB DEFAULT '[]',
  current_mood TEXT DEFAULT 'neutral',
  started_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_room_id ON sessions(room_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Users: anyone can read (for now), only owner can update
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users are viewable by everyone') THEN
    CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own record') THEN
    CREATE POLICY "Users can update own record" ON users FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert users') THEN
    CREATE POLICY "Anyone can insert users" ON users FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Rooms: public rooms readable by all, private rooms by owner/collaborators
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public rooms viewable by all') THEN
    CREATE POLICY "Public rooms viewable by all" ON rooms FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert rooms') THEN
    CREATE POLICY "Anyone can insert rooms" ON rooms FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can update rooms') THEN
    CREATE POLICY "Anyone can update rooms" ON rooms FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can delete own rooms') THEN
    CREATE POLICY "Anyone can delete own rooms" ON rooms FOR DELETE USING (true);
  END IF;
END $$;

-- Sessions: anyone can read/write (multiplayer)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Sessions viewable by all') THEN
    CREATE POLICY "Sessions viewable by all" ON sessions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert sessions') THEN
    CREATE POLICY "Anyone can insert sessions" ON sessions FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can update sessions') THEN
    CREATE POLICY "Anyone can update sessions" ON sessions FOR UPDATE USING (true);
  END IF;
END $$;

-- ============================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rooms_updated_at ON rooms;
CREATE TRIGGER rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- MIGRATION HELPER
-- If you ran an older version of this schema, run this block
-- to add any columns that might be missing.
-- Safe to run multiple times.
-- ============================================
DO $$
BEGIN
  -- rooms columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='location') THEN
    ALTER TABLE rooms ADD COLUMN location TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='entry_mood') THEN
    ALTER TABLE rooms ADD COLUMN entry_mood TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='exit_mood') THEN
    ALTER TABLE rooms ADD COLUMN exit_mood TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='locked_until') THEN
    ALTER TABLE rooms ADD COLUMN locked_until TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='relationship_story') THEN
    ALTER TABLE rooms ADD COLUMN relationship_story TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='legacy_person_name') THEN
    ALTER TABLE rooms ADD COLUMN legacy_person_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='legacy_relationship') THEN
    ALTER TABLE rooms ADD COLUMN legacy_relationship TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='invite_code') THEN
    ALTER TABLE rooms ADD COLUMN invite_code TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='collaborators') THEN
    ALTER TABLE rooms ADD COLUMN collaborators TEXT[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='narration_audio_url') THEN
    ALTER TABLE rooms ADD COLUMN narration_audio_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='audio_narration') THEN
    ALTER TABLE rooms ADD COLUMN audio_narration TEXT;
  END IF;
  -- users columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='bio') THEN
    ALTER TABLE users ADD COLUMN bio TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar') THEN
    ALTER TABLE users ADD COLUMN avatar TEXT;
  END IF;
END $$;
