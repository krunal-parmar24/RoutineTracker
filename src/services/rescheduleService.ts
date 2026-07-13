import type { Todo } from '../types/todo';
import type { WeeklyRoutine } from '../types/routine';
import { buildRoutineTimeLabel } from './todoService';

/**
 * Calculates the cascade sequence of tasks to reschedule when an existing task is bumped,
 * creating tombstone records for the original tasks and inserting new records for the new dates.
 * @param originalTodo The original todo before edits.
 * @param updatedTodo The edited todo with the new date, slot, and any form edits.
 * @param allFutureTodos All existing active todos in the database for the user.
 * @param routine The user's weekly routine.
 * @returns Object containing updates (tombstones) and inserts (new tasks).
 */
export function calculateCascade(
  originalTodo: Todo,
  updatedTodo: Todo,
  allFutureTodos: Todo[],
  routine: WeeklyRoutine
): { updates: Todo[], inserts: Todo[] } {
  const updates: Todo[] = [];
  const inserts: Todo[] = [];
  
  // We keep track of what active slots are occupied.
  const occupiedSlots = new Map<string, Todo>();
  for (const t of allFutureTodos) {
    if (t.id !== originalTodo.id && !t.rescheduledToDate) {
      occupiedSlots.set(`${t.date}|${t.routineEntryId}`, t);
    }
  }

  // 1. Mark original task as a tombstone
  updates.push({
    ...originalTodo,
    rescheduledToDate: updatedTodo.date,
    updatedAt: new Date().toISOString(),
  });

  // 2. Insert the newly edited task
  inserts.push({
    ...updatedTodo,
    id: '', // Strip ID to force an insert
    rescheduledToDate: undefined,
  });

  // 3. Start checking for cascades
  let targetDate = updatedTodo.date;
  let targetEntryId = updatedTodo.routineEntryId;

  while (true) {
    const key = `${targetDate}|${targetEntryId}`;
    const occupant = occupiedSlots.get(key);

    if (!occupant) {
      // Slot is free, cascade ends
      break;
    }

    // We must bump the occupant!
    const occupantOriginalEntry = routine.entries.find(e => e.id === occupant.routineEntryId);
    if (!occupantOriginalEntry) {
      throw new Error(`Cannot cascade reschedule: The routine slot for task "${occupant.title}" is missing from the schedule.`);
    }

    const currentDate = new Date(`${occupant.date}T00:00:00`);
    let foundNextSlot = false;
    let nextDateStr = '';
    let nextWeekday = '';
    let nextEntryId = '';
    let nextTimeLabel = '';

    // Search forward up to 30 days
    for (let i = 1; i <= 30; i++) {
      currentDate.setDate(currentDate.getDate() + 1);
      const y = currentDate.getFullYear();
      const m = String(currentDate.getMonth() + 1).padStart(2, '0');
      const d = String(currentDate.getDate()).padStart(2, '0');
      nextDateStr = `${y}-${m}-${d}`;
      nextWeekday = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
      const nextWeekdayLower = nextWeekday.toLowerCase();

      const entriesForDay = routine.entries.filter(e => e.dayOfWeek === nextWeekdayLower && !e.deletedAt);
      const matchingEntry = entriesForDay.find(e => e.title === occupantOriginalEntry.title);

      if (matchingEntry) {
        nextEntryId = matchingEntry.id;
        nextTimeLabel = buildRoutineTimeLabel(matchingEntry);
        foundNextSlot = true;
        break;
      }
    }

    if (!foundNextSlot) {
      throw new Error(`Cannot cascade reschedule: No future routine slot found for "${occupantOriginalEntry.title}" within the next 30 days.`);
    }

    // Mark the occupant as a tombstone
    updates.push({
      ...occupant,
      rescheduledToDate: nextDateStr,
      updatedAt: new Date().toISOString(),
    });

    // Create the new bumped task
    inserts.push({
      ...occupant,
      id: '', // Strip ID
      date: nextDateStr,
      weekday: nextWeekday,
      routineEntryId: nextEntryId,
      routineTimeLabel: nextTimeLabel,
      rescheduleCount: (occupant.rescheduleCount || 0) + 1,
      rescheduledToDate: undefined,
      updatedAt: new Date().toISOString(),
    });
    
    // Prepare for next loop iteration
    targetDate = nextDateStr;
    targetEntryId = nextEntryId;
    occupiedSlots.delete(key);
  }

  return { updates, inserts };
}
