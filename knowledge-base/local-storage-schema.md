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
- Keep the schema versioned to support migrations later.
- Avoid storing derived values as the source of truth.
