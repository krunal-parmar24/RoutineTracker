# Local Storage Schema

Use a single storage namespace such as:
- routine-tracker:app

Suggested shape:
{
  "users": [ ... ],
  "auth": {
    "currentUserId": "..."
  },
  "routines": [ ... ],
  "todos": [ ... ]
}

## Storage Rules
- Store all data as JSON strings.
- Validate and recover gracefully from malformed data.
- Keep the schema versioned to support migrations later (current version: 1, stored as a `version` field on the root object).
- Avoid storing derived values as the source of truth.
- Never store raw passwords. User records store `passwordHash` and `passwordSalt` (salted PBKDF2/SHA-256) instead of `password`.

## Supabase Schema (phase 2)
When `VITE_STORAGE_PROVIDER=supabase`, data lives in Postgres instead of local storage.
See `supabase/schema.sql` for the full script. Summary:
- `auth.users` (built-in Supabase Auth) - identity, email, password; `name` is stored in
  `user_metadata` at sign-up rather than a separate profiles table.
- `public.weekly_routines` - one row per user (`user_id` unique), holds `updated_at`.
- `public.routine_entries` - day/time blocks, references `weekly_routines.id`, denormalizes
  `user_id` for simpler Row Level Security. Includes a `deleted_at` column for soft deletes;
  `todos.routine_entry_id` uses `ON DELETE RESTRICT` (not cascade) so historical todos are
  never destroyed by a routine change.
- `public.todos` - date-specific snapshots, references `routine_entries.id`; a unique
  constraint on `(user_id, date, routine_entry_id)` enforces one todo per slot per date.
- All tables have Row Level Security enabled with `auth.uid() = user_id` policies for
  select/insert/update/delete.
