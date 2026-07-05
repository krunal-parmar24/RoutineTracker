# Architecture Notes

## Recommended Architecture
Use a layered structure with clear boundaries:
- UI layer: React components and pages.
- Application layer: hooks, context, and domain logic.
- Service layer: repositories and storage adapters.
- Data layer: local storage in phase 1, Supabase in phase 2.

## Design Principles
- The UI never talks to storage directly.
- Repositories expose domain-oriented methods.
- Storage implementations are swapped behind interfaces.
- Authentication logic is isolated behind an auth service abstraction.

## Suggested Layers
- components/: presentational UI pieces.
- pages/: route-level screens.
- layouts/: shared shell/layout components.
- routes/: route definitions and guards.
- hooks/: reusable stateful logic.
- context/: shared application state.
- services/: business logic and orchestration.
- repositories/: domain repositories for users, routines, todos.
- storage/: local storage adapter and future Supabase adapter.
- types/: shared TypeScript models.
- utils/: helpers and formatters.

## Storage Abstraction Strategy
Define repository interfaces such as:
- AuthRepository
- RoutineRepository
- TodoRepository

Implementations:
- LocalStorageAuthRepository
- LocalStorageRoutineRepository
- LocalStorageTodoRepository
- SupabaseAuthRepository
- SupabaseRoutineRepository
- SupabaseTodoRepository

This keeps domain behavior consistent while storage changes are isolated.

## Supabase Integration (implemented)
- `src/integrations/supabaseClient.ts` lazily builds a singleton Supabase client from
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
- `src/factories/repositoryFactory.ts` resolves the active provider from
  `VITE_STORAGE_PROVIDER` (`localStorage` default, or `supabase`) and returns the matching
  repository set. No page, service, or hook code changes based on provider - they only depend
  on the `AuthRepository`/`RoutineRepository`/`TodoRepository` interfaces.
- `src/repositories/supabaseAuthRepository.ts`, `supabaseRoutineRepository.ts`,
  `supabaseTodoRepository.ts` implement the same interfaces as their local storage
  counterparts, using `@supabase/supabase-js` (Postgres tables + Supabase Auth).
- `src/repositories/supabaseMappers.ts` converts between camelCase domain types and the
  snake_case Postgres row shape.
- Auth state changes (token refresh, sign-out in another tab) are pushed into `AuthContext`
  via an optional `AuthRepository.onAuthStateChange()` subscription (no-op for local storage).
- Supabase Auth manages password hashing/session storage itself; the custom local password
  hashing utility (`src/utils/password.ts`) is only used by the local storage auth repository.
- Row Level Security (Postgres policies) enforces per-user data isolation server-side, in
  addition to the `userId` filtering already done in the local storage repositories.
- See `supabase/schema.sql` for the full table/RLS/trigger definitions.
- SupabaseTodoRepository

This keeps domain behavior consistent while storage changes are isolated.
