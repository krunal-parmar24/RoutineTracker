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
