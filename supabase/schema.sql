-- RoutineTracker Supabase schema
-- Run this once in the Supabase SQL editor (or via `supabase db push`).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- weekly_routines: one reusable weekly template per user
-- ---------------------------------------------------------------------------
create table if not exists public.weekly_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- ---------------------------------------------------------------------------
-- routine_entries: individual day/time blocks belonging to a weekly routine
-- ---------------------------------------------------------------------------
create table if not exists public.routine_entries (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.weekly_routines (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  day_of_week text not null check (day_of_week in ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  start_time text not null,
  end_time text not null,
  title text not null,
  description text,
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Backfill for databases created before this column existed.
alter table public.routine_entries add column if not exists deleted_at timestamptz;

create index if not exists routine_entries_routine_id_idx on public.routine_entries (routine_id);
create index if not exists routine_entries_user_id_idx on public.routine_entries (user_id);

-- ---------------------------------------------------------------------------
-- todos: date-specific snapshots assigned to a routine slot
-- ---------------------------------------------------------------------------
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  weekday text not null,
  routine_entry_id uuid not null references public.routine_entries (id) on delete restrict,
  routine_time_label text not null,
  title text not null,
  description text,
  completion_percentage integer not null default 0 check (completion_percentage between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enforces "a routine slot can only hold one active todo for a given date" at the DB level.
-- We use a partial index so that tombstones (where rescheduled_to_date IS NOT NULL) are excluded from the constraint.
create unique index if not exists todos_active_unique_idx on public.todos (user_id, date, routine_entry_id) where rescheduled_to_date is null;

create index if not exists todos_user_date_idx on public.todos (user_id, date);

-- Backfill for databases created before these columns existed
alter table public.todos drop constraint if exists todos_user_id_date_routine_entry_id_key;
alter table public.todos add column if not exists category text;
alter table public.todos add column if not exists reschedule_count integer not null default 0;
alter table public.todos add column if not exists rescheduled_to_date date;

-- ---------------------------------------------------------------------------
-- Keep weekly_routines.updated_at and todos.updated_at current automatically
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_todos_updated_at on public.todos;
create trigger set_todos_updated_at
  before update on public.todos
  for each row execute function public.touch_updated_at();

create or replace function public.touch_routine_updated_at()
returns trigger as $$
begin
  update public.weekly_routines
    set updated_at = now()
    where id = coalesce(new.routine_id, old.routine_id);
  return coalesce(new, old);
end;
$$ language plpgsql;

drop trigger if exists touch_routine_on_entry_change on public.routine_entries;
create trigger touch_routine_on_entry_change
  after insert or update or delete on public.routine_entries
  for each row execute function public.touch_routine_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: every user can only access their own rows
-- ---------------------------------------------------------------------------
alter table public.weekly_routines enable row level security;
alter table public.routine_entries enable row level security;
alter table public.todos enable row level security;

drop policy if exists "weekly_routines_select_own" on public.weekly_routines;
create policy "weekly_routines_select_own" on public.weekly_routines
  for select using (auth.uid() = user_id);

drop policy if exists "weekly_routines_insert_own" on public.weekly_routines;
create policy "weekly_routines_insert_own" on public.weekly_routines
  for insert with check (auth.uid() = user_id);

drop policy if exists "weekly_routines_update_own" on public.weekly_routines;
create policy "weekly_routines_update_own" on public.weekly_routines
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "weekly_routines_delete_own" on public.weekly_routines;
create policy "weekly_routines_delete_own" on public.weekly_routines
  for delete using (auth.uid() = user_id);

drop policy if exists "routine_entries_select_own" on public.routine_entries;
create policy "routine_entries_select_own" on public.routine_entries
  for select using (auth.uid() = user_id);

drop policy if exists "routine_entries_insert_own" on public.routine_entries;
create policy "routine_entries_insert_own" on public.routine_entries
  for insert with check (auth.uid() = user_id);

drop policy if exists "routine_entries_update_own" on public.routine_entries;
create policy "routine_entries_update_own" on public.routine_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "routine_entries_delete_own" on public.routine_entries;
create policy "routine_entries_delete_own" on public.routine_entries
  for delete using (auth.uid() = user_id);

drop policy if exists "todos_select_own" on public.todos;
create policy "todos_select_own" on public.todos
  for select using (auth.uid() = user_id);

drop policy if exists "todos_insert_own" on public.todos;
create policy "todos_insert_own" on public.todos
  for insert with check (auth.uid() = user_id);

drop policy if exists "todos_update_own" on public.todos;
create policy "todos_update_own" on public.todos
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "todos_delete_own" on public.todos;
create policy "todos_delete_own" on public.todos
  for delete using (auth.uid() = user_id);
