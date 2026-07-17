import type { DayOfWeek, RoutineEntry } from '../types/routine';
import type { Todo, TodoCategory } from '../types/todo';

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
  routine_entry_id: string | null;
  routine_time_label: string | null;
  title: string;
  description: string | null;
  category: string | null;
  reschedule_count: number;
  rescheduled_to_date: string | null;
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
    routineEntryId: row.routine_entry_id ?? undefined,
    routineTimeLabel: row.routine_time_label ?? undefined,
    title: row.title,
    description: row.description || undefined,
    category: row.category as TodoCategory || undefined,
    rescheduleCount: row.reschedule_count,
    rescheduledToDate: row.rescheduled_to_date || undefined,
    completionPercentage: row.completion_percentage,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function todoToRow(todo: Todo): Partial<TodoRow> {
  const row: Partial<TodoRow> = {};

  if (todo.id) row.id = todo.id;
  if (typeof todo.userId !== 'undefined') row.user_id = todo.userId;
  if (typeof todo.date !== 'undefined') row.date = todo.date;
  if (typeof todo.weekday !== 'undefined') row.weekday = todo.weekday;
  // Only include routine fields when present (free todos omit them)
  if (typeof todo.routineEntryId !== 'undefined') row.routine_entry_id = todo.routineEntryId;
  if (typeof todo.routineTimeLabel !== 'undefined') row.routine_time_label = todo.routineTimeLabel;
  if (typeof todo.title !== 'undefined') row.title = todo.title;
  if (typeof todo.description !== 'undefined') row.description = todo.description ?? null;
  if (typeof todo.category !== 'undefined') row.category = todo.category ?? null;
  if (typeof todo.rescheduleCount !== 'undefined') row.reschedule_count = todo.rescheduleCount;
  if (typeof todo.rescheduledToDate !== 'undefined') row.rescheduled_to_date = todo.rescheduledToDate ?? null;
  if (typeof todo.completionPercentage !== 'undefined') row.completion_percentage = todo.completionPercentage;
  if (typeof todo.updatedAt !== 'undefined') row.updated_at = todo.updatedAt;

  return row;
}
