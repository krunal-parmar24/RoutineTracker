import type { DayOfWeek, RoutineEntry } from '../types/routine';
import type { Todo } from '../types/todo';

export interface RoutineEntryRow {
  id: string;
  routine_id: string;
  user_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  title: string;
  description: string | null;
  order: number;
  created_at: string;
  deleted_at: string | null;
}

export interface TodoRow {
  id: string;
  user_id: string;
  date: string;
  weekday: string;
  routine_entry_id: string;
  routine_time_label: string;
  title: string;
  description: string | null;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

export function mapRoutineEntryRow(row: RoutineEntryRow): RoutineEntry {
  return {
    id: row.id,
    dayOfWeek: row.day_of_week as DayOfWeek,
    startTime: row.start_time,
    endTime: row.end_time,
    title: row.title,
    description: row.description ?? undefined,
    order: row.order,
    createdAt: row.created_at,
    deletedAt: row.deleted_at ?? undefined,
  };
}

export function routineEntryToRow(
  entry: RoutineEntry,
  routineId: string,
  userId: string,
): Omit<RoutineEntryRow, 'created_at'> & { created_at?: string } {
  return {
    id: entry.id,
    routine_id: routineId,
    user_id: userId,
    day_of_week: entry.dayOfWeek,
    start_time: entry.startTime,
    end_time: entry.endTime,
    title: entry.title,
    description: entry.description ?? null,
    order: entry.order,
    created_at: entry.createdAt,
    deleted_at: entry.deletedAt ?? null,
  };
}

export function mapTodoRow(row: TodoRow): Todo {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    weekday: row.weekday,
    routineEntryId: row.routine_entry_id,
    routineTimeLabel: row.routine_time_label,
    title: row.title,
    description: row.description ?? undefined,
    completionPercentage: row.completion_percentage,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function todoToRow(todo: Todo): TodoRow {
  return {
    id: todo.id,
    user_id: todo.userId,
    date: todo.date,
    weekday: todo.weekday,
    routine_entry_id: todo.routineEntryId,
    routine_time_label: todo.routineTimeLabel,
    title: todo.title,
    description: todo.description ?? null,
    completion_percentage: todo.completionPercentage,
    created_at: todo.createdAt,
    updated_at: todo.updatedAt,
  };
}
