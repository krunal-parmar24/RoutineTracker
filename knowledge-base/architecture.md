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
