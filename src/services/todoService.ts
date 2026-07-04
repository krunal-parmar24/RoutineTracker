import type { RoutineEntry } from '../types/routine';
import type { Todo, TodoStatusResult } from '../types/todo';

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
  return `${entry.startTime}–${entry.endTime}`;
}

export function canAssignTodo(todos: Todo[], routineEntryId: string) {
  return !todos.some((todo) => todo.routineEntryId === routineEntryId);
}
