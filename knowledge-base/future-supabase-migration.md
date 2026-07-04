# Future Supabase Migration

## Migration Strategy
- Keep repositories behind interfaces.
- Replace storage implementations rather than rewriting UI logic.
- Map local data models to Supabase tables or JSON documents.
- Add auth abstraction so Supabase Auth can replace the local auth layer.

## Likely Supabase Considerations
- Authentication with email/password.
- Row-level security for user-owned data.
- Realtime or polling for live updates if needed later.
- Separate tables for users, routines, and todos.
