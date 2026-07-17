import type { RoutineEntry } from '../types/routine';
import type { Todo, TodoStatusResult } from '../types/todo';
import { formatTime12 } from '../utils/date';

export function getTodoStatus(percentage: number): TodoStatusResult {
  if (percentage >= 100) {
    return { status: 'Completed', completionPercentage: 100 };
  }

  if (percentage > 0) {
    return { status: 'In Progress', completionPercentage: percentage };
  }

  return { status: 'Not Started', completionPercentage: 0 };
}

export function buildRoutineTimeLabel(entry: Pick<RoutineEntry, 'startTime' | 'endTime'>) {
  return `${formatTime12(entry.startTime)}–${formatTime12(entry.endTime)}`;
}

export function canAssignTodo(todos: Todo[], routineEntryId: string | undefined) {
  // Free todos (no routine slot) are always allowed
  if (!routineEntryId) return true;
  return !todos.some((todo) => todo.routineEntryId === routineEntryId);
}

/** Historical todos (any date before today) must remain unchanged once created. */
export function isPastTodo(todo: Pick<Todo, 'date'>, referenceDate: Date = new Date()): boolean {
  const todayKey = referenceDate.toISOString().slice(0, 10);
  return todo.date < todayKey;
}
