# Changelog

## 2026-07-05 (Supabase integration)
- Added `@supabase/supabase-js` and a lazily-initialized Supabase client
  (`src/integrations/supabaseClient.ts`).
- Implemented `SupabaseAuthRepository`, `SupabaseRoutineRepository`, `SupabaseTodoRepository`,
  matching the existing repository interfaces so the rest of the app is unchanged.
- `repositoryFactory.ts` now resolves the active storage provider from
  `VITE_STORAGE_PROVIDER` (`localStorage` default, or `supabase`).
- `AuthContext` subscribes to `onAuthStateChange` (new optional repository method) to stay in
  sync with Supabase session refresh/sign-out events.
- Added `supabase/schema.sql` with tables, indexes, triggers, and Row Level Security policies
  for `weekly_routines`, `routine_entries`, and `todos`.
- Added `.env.example` entries for `VITE_STORAGE_PROVIDER`, `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`, and typed them in `vite-env.d.ts`.
- `useStorageRecovery` now skips local storage corruption recovery when running in `supabase` mode.
- Fixed two latent TypeScript build errors surfaced while type-checking (unused
  `productivityAnalysis` variable in `DashboardPage`, a `Uint8Array`/`BufferSource` typing
  mismatch in the password hashing utility).

## 2026-07-05
- Hashed user passwords (salted PBKDF2/SHA-256) instead of storing them in plain text.
- Removed direct localStorage access from AuthContext; session/user state now flows only through authRepository.
- Fixed a bug where editing a routine entry falsely failed overlap validation against its own stale pre-edit version.
- Fixed a rendering bug showing literal `&apos;` text instead of an apostrophe on the dashboard timeline.
- Removed the fake email-verification message from sign-up; sign-up now auto-logs the user in and navigates to the dashboard.
- Todos dated before today are now read-only (cannot edit completion percentage or delete).
- Added a confirm dialog before deleting a routine entry, for consistency with todo deletion.
- Replaced raw `window.dispatchEvent`/`window.alert` toast/error patterns with a typed `useToast()` hook.
- Removed unsafe type casts by properly typing `routines`/`todos` in the local storage schema; added a `version` field.
- Deleted a dead, unused duplicate `useAuth` hook.
- Removed automated test files; this project does not maintain automated tests at this time.

## 2026-07-04
- Created initial project knowledge base.
- Documented requirements, architecture, folder structure, and roadmap.
- Identified missing requirements and edge cases.
