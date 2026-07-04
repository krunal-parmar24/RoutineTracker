# Supabase Setup for RoutineTracker

## Required tables

The application expects the following tables:

- `profiles`
- `weekly_routines`
- `routine_entries`
- `todos`

## Schema

Use `supabase/schema.sql` to create the required objects in your project.

### Recommended setup steps

1. Open your Supabase project.
2. Go to the SQL Editor.
3. Copy and run the contents of `supabase/schema.sql`.
4. Confirm the following tables exist:
   - `profiles`
   - `weekly_routines`
   - `routine_entries`
   - `todos`

## Environment variables

Create a `.env` file at the project root with:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Do not commit `.env` to source control.

## Notes

- `profiles` is optional but useful for storing user metadata.
- `weekly_routines` and `routine_entries` form a parent-child template relationship.
- `todos` stores immutable daily snapshots and enforces a unique slot per user/date.
