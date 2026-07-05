# Changelog

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
