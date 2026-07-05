# Known Decisions

- The app will start as a frontend-only React application.
- Local storage is the initial persistence mechanism.
- Storage access will be routed through repositories and services.
- Authentication will be abstracted to ease future replacement.
- Weekly routines are treated as reusable templates for scheduling daily todos.
- Historical todos are stored as immutable snapshots.
- Passwords are never stored in plain text; they are hashed (salted PBKDF2/SHA-256) before being persisted to local storage.
- Sign-up auto-authenticates the user immediately; there is no email verification step in phase 1.
- Todos dated before today are locked (read-only): completion percentage cannot be changed and the todo cannot be deleted.
- UI feedback (toasts) is delivered through a typed `useToast()` hook/context, not raw DOM events.
- Automated tests are not maintained in this project at this time; correctness is verified manually.
- Supabase integration is selected at runtime via `VITE_STORAGE_PROVIDER` (`localStorage` or
  `supabase`); both implementations satisfy the same repository interfaces so the rest of the
  app is unchanged when switching providers.
- Supabase Auth (not the custom local password hasher) is the source of truth for
  authentication when `VITE_STORAGE_PROVIDER=supabase`. The Supabase project's "Confirm email"
  setting must be disabled so sign-up auto-logs users in, consistent with the local storage behavior.
- Per-user data isolation is enforced in Postgres via Row Level Security policies
  (`auth.uid() = user_id`) in addition to the existing application-level filtering.
- The unique slot-per-date rule ("a routine slot can only hold one todo for a given date") is
  enforced both in the UI (`canAssignTodo`) and at the database level with a unique constraint
  on `(user_id, date, routine_entry_id)`.
