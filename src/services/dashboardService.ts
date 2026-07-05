import type { RoutineEntry } from '../types/routine';
import type { Todo } from '../types/todo';

export type TimelineStatus = 'Completed' | 'In Progress' | 'Not Started' | 'Missed' | 'No Task Assigned';

export interface TimelineRow {
  routineEntryId: string;
  routineTimeLabel: string;
  startTime: string;
  endTime: string;
  routineTitle: string;
  todo?: Todo;
  status: TimelineStatus;
  completionPercentage: number;
  isActive: boolean;
  isPast: boolean;
  isFuture: boolean;
}

export interface DashboardSummary {
  selectedDate: string;
  weekday: string;
  totalRoutineSlots: number;
  totalTodos: number;
  completedTodos: number;
  inProgressTodos: number;
  notStartedTodos: number;
  missedTodos: number;
  overallCompletionPercentage: number;
  hasTasks: boolean;
}

export interface ProductivitySlot {
  slotLabel: string;
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
}

export interface ProductivityAnalysis {
  slots: ProductivitySlot[];
  averageCompletionRate: number;
  mostProductiveSlot?: string;
  leastProductiveSlot?: string;
}

export interface StreakStatistics {
  hasStreak: boolean;
  currentStreakCount: number;
  bestStreakCount: number;
  lastCompletedDay?: string;
  currentStreakStartDate?: string;
  totalPerfectDays: number;
  longestGapDays: number;
  summaryMessage?: string;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function buildDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

function addDays(dateKey: string, offset: number) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + offset);
  return buildDateKey(date);
}

function daysDifference(fromKey: string, toKey: string) {
  const from = new Date(`${fromKey}T00:00:00`);
  const to = new Date(`${toKey}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

function isSlotMissed(selectedDate: string, endTime: string, completionPercentage: number, now: Date) {
  if (completionPercentage >= 100) {
    return false;
  }

  const todayKey = buildDateKey(now);
  const slotEnd = buildDateTime(selectedDate, endTime);
  if (selectedDate < todayKey) {
    return true;
  }

  return selectedDate === todayKey && now > slotEnd;
}

function getDisplayStatus(completionPercentage: number, selectedDate: string, endTime: string, now: Date): TimelineStatus {
  if (completionPercentage >= 100) {
    return 'Completed';
  }

  if (isSlotMissed(selectedDate, endTime, completionPercentage, now)) {
    return 'Missed';
  }

  if (completionPercentage > 0) {
    return 'In Progress';
  }

  return 'Not Started';
}

export function getTimelineRows(routineEntries: RoutineEntry[], todos: Todo[], selectedDate: string): TimelineRow[] {
  const now = new Date();
  const todayKey = buildDateKey(now);

  return [...routineEntries]
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((entry) => {
      const todo = todos.find((item) => item.routineEntryId === entry.id);
      const completionPercentage = todo?.completionPercentage ?? 0;
      const slotStart = buildDateTime(selectedDate, entry.startTime);
      const slotEnd = buildDateTime(selectedDate, entry.endTime);
      const isActive = selectedDate === todayKey && now >= slotStart && now <= slotEnd;
      const isPast = selectedDate < todayKey || (selectedDate === todayKey && now > slotEnd);
      const isFuture = selectedDate > todayKey || (selectedDate === todayKey && now < slotStart);
      const status = todo ? getDisplayStatus(completionPercentage, selectedDate, entry.endTime, now) : 'No Task Assigned';

      return {
        isDeletedEntry: Boolean(entry.deletedAt),
        row: {
          routineEntryId: entry.id,
          routineTimeLabel: `${entry.startTime}–${entry.endTime}`,
          startTime: entry.startTime,
          endTime: entry.endTime,
          routineTitle: entry.title,
          todo,
          status,
          completionPercentage,
          isActive,
          isPast,
          isFuture,
        },
      };
    })
    // Slots removed from the active routine still show if they have a historical todo,
    // but are hidden once they have neither an assignment nor any tracked history.
    .filter((item) => !item.isDeletedEntry || Boolean(item.row.todo))
    .map((item) => item.row);
}

export function getDashboardSummary(routineEntries: RoutineEntry[], todos: Todo[], selectedDate: string, weekday: string): DashboardSummary {
  const timelineRows = getTimelineRows(routineEntries, todos, selectedDate);
  const completedTodos = todos.filter((todo) => todo.completionPercentage >= 100).length;
  const inProgressTodos = todos.filter((todo) => todo.completionPercentage > 0 && todo.completionPercentage < 100).length;
  const notStartedTodos = todos.filter((todo) => todo.completionPercentage === 0).length;
  const missedTodos = timelineRows.filter((item) => item.status === 'Missed').length;
  const totalTodos = todos.length;
  const overallCompletionPercentage = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  return {
    selectedDate,
    weekday,
    totalRoutineSlots: routineEntries.length,
    totalTodos,
    completedTodos,
    inProgressTodos,
    notStartedTodos,
    missedTodos,
    overallCompletionPercentage,
    hasTasks: totalTodos > 0,
  };
}

export function getProductivityAnalysis(todos: Todo[]): ProductivityAnalysis {
  const grouped = new Map<string, { total: number; completed: number }>();

  for (const todo of todos) {
    const slotLabel = todo.routineTimeLabel || 'Unscheduled';
    const current = grouped.get(slotLabel) ?? { total: 0, completed: 0 };
    current.total += 1;
    if (todo.completionPercentage >= 100) {
      current.completed += 1;
    }
    grouped.set(slotLabel, current);
  }

  const slots: ProductivitySlot[] = Array.from(grouped.entries()).map(([slotLabel, data]) => ({
    slotLabel,
    totalTasks: data.total,
    completedTasks: data.completed,
    completionRate: Math.round((data.completed / data.total) * 100),
  }));

  const sortedSlots = slots.sort((a, b) => b.completionRate - a.completionRate || a.slotLabel.localeCompare(b.slotLabel));
  const totalTasks = slots.reduce((sum, slot) => sum + slot.totalTasks, 0);
  const totalCompleted = slots.reduce((sum, slot) => sum + slot.completedTasks, 0);
  const averageCompletionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  return {
    slots: sortedSlots,
    averageCompletionRate,
    mostProductiveSlot: sortedSlots[0]?.slotLabel,
    leastProductiveSlot: sortedSlots[sortedSlots.length - 1]?.slotLabel,
  };
}

export function getStreakStatistics(todos: Todo[]): StreakStatistics {
  const todayKey = buildDateKey(new Date());
  const dateStore = new Map<string, { total: number; completed: number }>();

  for (const todo of todos) {
    // Guard against malformed/corrupted date values (e.g. bad test data) that would
    // otherwise make the loops below run for an unbounded number of iterations.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(todo.date) || Number.isNaN(new Date(`${todo.date}T00:00:00`).getTime())) {
      continue;
    }

    const existing = dateStore.get(todo.date) ?? { total: 0, completed: 0 };
    existing.total += 1;
    if (todo.completionPercentage >= 100) {
      existing.completed += 1;
    }
    dateStore.set(todo.date, existing);
  }

  const taskDates = Array.from(dateStore.keys()).filter((date) => date <= todayKey).sort();
  const perfectDates = taskDates.filter((date) => {
    const entry = dateStore.get(date);
    return entry?.completed === entry?.total;
  });

  const totalPerfectDays = perfectDates.length;
  if (totalPerfectDays === 0) {
    return {
      hasStreak: false,
      currentStreakCount: 0,
      bestStreakCount: 0,
      totalPerfectDays: 0,
      longestGapDays: 0,
      summaryMessage: 'Complete all tasks for a day to start your streak.',
    };
  }

  // Safety cap: bounds worst-case loop iterations even if data spans an implausible date range.
  const MAX_LOOKBACK_DAYS = 3650;

  let currentStreakCount = 0;
  let currentStreakStartDate: string | undefined;
  let cursor = todayKey;
  for (let steps = 0; steps < MAX_LOOKBACK_DAYS; steps += 1) {
    const record = dateStore.get(cursor);
    if (!record || record.completed !== record.total) {
      break;
    }
    currentStreakCount += 1;
    currentStreakStartDate = cursor;
    cursor = addDays(cursor, -1);
  }

  const earliestAllowedDay = addDays(todayKey, -MAX_LOOKBACK_DAYS);
  const firstTaskDay = taskDates[0] < earliestAllowedDay ? earliestAllowedDay : taskDates[0];
  let bestStreakCount = 0;
  let currentRun = 0;
  cursor = firstTaskDay;

  for (let steps = 0; steps < MAX_LOOKBACK_DAYS && cursor <= todayKey; steps += 1) {
    const record = dateStore.get(cursor);
    if (record && record.completed === record.total) {
      currentRun += 1;
      if (currentRun > bestStreakCount) {
        bestStreakCount = currentRun;
      }
    } else {
      currentRun = 0;
    }
    cursor = addDays(cursor, 1);
  }

  let longestGapDays = 0;
  for (let index = 1; index < perfectDates.length; index += 1) {
    longestGapDays = Math.max(longestGapDays, daysDifference(perfectDates[index - 1], perfectDates[index]) - 1);
  }

  const lastCompletedDay = perfectDates[perfectDates.length - 1];
  if (lastCompletedDay < todayKey) {
    longestGapDays = Math.max(longestGapDays, daysDifference(lastCompletedDay, todayKey) - 1);
  }

  return {
    hasStreak: true,
    currentStreakCount,
    bestStreakCount,
    lastCompletedDay,
    currentStreakStartDate,
    totalPerfectDays,
    longestGapDays,
  };
}
