# Known Decisions

- The app will start as a frontend-only React application.
- Local storage is the initial persistence mechanism.
- Storage access will be routed through repositories and services.
- Authentication will be abstracted to ease future replacement.
- Weekly routines are treated as reusable templates for scheduling daily todos.
- Historical todos are stored as immutable snapshots.
