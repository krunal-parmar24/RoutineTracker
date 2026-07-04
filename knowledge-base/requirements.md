# Requirements Summary

## Functional Requirements
1. Authentication
   - Show login on first load.
   - Support sign up and login.
   - Keep users signed in until logout.
   - Protect authenticated routes.
   - Phase 1: simulate auth with local storage.
   - Phase 2: replace with Supabase Auth.

2. Weekly routine management
   - Users create a weekly routine with seven days.
   - Each day can contain multiple entries.
   - Entries include start time, end time, title, and optional description.
   - Support create, edit, delete, and reorder.
   - Detect overlaps and duplicate time entries.
   - Weekly routine repeats automatically each week.

3. Daily to-do management
   - Users select any date and the app derives the weekday.
   - The app loads the routine for that weekday.
   - Users create todos with title, optional description, and one routine time slot.
   - A slot can only hold one todo for a given date.
   - Validation should prevent duplicate slot assignment.

4. Dashboard
   - Show today's todos.
   - Display routine time, title, description, completion percentage, and status.
   - Support mark complete/incomplete and update percentage.
   - Status should be derived automatically from percentage.

5. History
   - Users can view prior dates.
   - Historical todos must remain unchanged even if the weekly routine is edited later.

6. User data isolation
   - Each user sees only their own routine and todos.

## Non-Functional Requirements
- Responsive and mobile-friendly.
- Clean, modular, and maintainable.
- Strongly typed.
- Reusable components and shared logic.

## Missing or Clarifying Requirements
- Whether sign-up should auto-login immediately.
- Whether users can edit or delete historical todos.
- Whether timezone should be local-device based or fixed.
- Whether routine entries should be stored as a weekly template only or also as day-specific snapshots.
- Whether empty states for first-time users should include onboarding guidance.

## Edge Cases to Handle
- Corrupted or missing local storage data.
- Empty routine states for a newly created user.
- Overlapping routine entries.
- Duplicate routine titles or times.
- Selecting a past date with no todos.
- Reordering entries while preserving a valid time structure.
- Refreshing the app while a user is logged in.
