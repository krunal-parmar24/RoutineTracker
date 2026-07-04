# Project Overview

## Purpose
A personal daily routine and to-do tracker that helps users manage a reusable weekly routine, schedule daily todos against routine time slots, and view historical records without changing the weekly plan retroactively.

## Product Goals
- Build a responsive React + TypeScript app.
- Start with local storage only.
- Keep the architecture storage-agnostic so Supabase can replace local storage later.
- Preserve strong separation between UI, business logic, and data access.

## Guiding Principles
- No custom backend server.
- Authentication should be replaceable.
- Weekly routines are reusable templates.
- Historical todo records are immutable snapshots.
- The UI should never talk to storage directly.
