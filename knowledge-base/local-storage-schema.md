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
