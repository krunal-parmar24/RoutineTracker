-- Supabase schema for RoutineTracker

-- 1. Users table is managed by Supabase Auth, but we include a profile table for optional metadata.
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Weekly routines table stores a user's routine template.
CREATE TABLE IF NOT EXISTS weekly_routines (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS routine_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  routine_id uuid REFERENCES weekly_routines(id) ON DELETE CASCADE,
  day_of_week text NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Todos table stores date-specific todo snapshots.
CREATE TABLE IF NOT EXISTS todos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  weekday text NOT NULL,
  routine_entry_id uuid NOT NULL,
  routine_time_label text NOT NULL,
  title text NOT NULL,
  description text,
  completion_percentage integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, date, routine_entry_id)
);

-- Helpful function: ensure uuid_generate_v4 exists.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
