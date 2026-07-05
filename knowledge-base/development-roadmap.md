# Development Roadmap

## Phase 1 - Foundation
- Initialize React + TypeScript project.
- Set up routing and layout.
- Create the documented folder structure.

## Phase 2 - Authentication
- Build auth UI for login and sign up.
- Implement simulated local storage authentication.
- Protect routes and preserve login sessions.

## Phase 3 - Core Layout and Navigation
- Build app shell, navigation, and responsive structure.
- Create shared containers and empty states.

## Phase 4 - Weekly Routine Management
- Implement routine creation, edit, delete, reorder, and validation.
- Add overlap detection and duplicate time validation.

## Phase 5 - Daily Todo Management
- Build date picker and weekday-based routine loading.
- Implement todo creation with slot validation.
- Support ordering by routine time.

## Phase 6 - Dashboard
- Show today's todos with derived status and completion percentage.
- Support toggling completion and percentage updates.

## Phase 7 - History and Calendar
- Add historical viewing for past dates.
- Ensure history is immutable once created.

## Phase 8 - Local Storage Layer
- Implement repository adapters and storage normalization.
- Handle missing or corrupted data gracefully.

## Phase 9 - Testing
- Deferred by decision: this project does not currently maintain automated test files; verify behavior manually instead.

## Phase 10 - Supabase Migration
- Replace the storage adapter while keeping the rest of the app mostly unchanged.
- Swap auth implementation behind the abstraction layer.
