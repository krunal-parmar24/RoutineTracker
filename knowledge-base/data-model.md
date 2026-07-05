# Data Model

## User
- id: string
- email: string
- name?: string
- createdAt: string

## RoutineEntry
- id: string
- dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
- startTime: string
- endTime: string
- title: string
- description?: string
- order: number
- createdAt: string
- deletedAt?: string (soft-delete marker; entries are never hard-deleted)

## WeeklyRoutine
- id: string
- userId: string
- entries: RoutineEntry[]
- updatedAt: string

## Todo
- id: string
- userId: string
- date: string
- weekday: string
- routineEntryId: string
- routineTimeLabel: string
- title: string
- description?: string
- completionPercentage: number
- createdAt: string
- updatedAt: string

## Notes
- Todos are date-specific snapshots tied to a routine slot.
- Historical todo records remain immutable after creation.
