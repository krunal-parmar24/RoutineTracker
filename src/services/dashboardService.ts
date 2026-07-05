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
  currentStreakStartDate?: string;
  totalPerfectDays: number;
  longestGapDays: number;
  summaryMessage?: string;
}

/** 0 = no todos or nothing completed (grey) .. 4 = 100% completed (darkest). */
export type HeatmapLevel = 0 | 1 | 2 | 3 | 4;

export interface HeatmapCell {
  /** null for leading padding cells used to align the grid to week columns. */
  date: string | null;
  total: number;
  completed: number;
  level: HeatmapLevel;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;
// Streak stats and the heatmap both look back over the same rolling window, so the two
// numbers shown together on the dashboard are always consistent with each other.
const HEATMAP_WINDOW_DAYS = 371;

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

function isValidDateKey(dateKey: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey) && !Number.isNaN(new Date(`${dateKey}T00:00:00`).getTime());
}

/** Groups todos by date, counting how many were planned vs. completed each day. */
function buildDailyCompletionMap(todos: Todo[]): Map<string, { total: number; completed: number }> {
  const dateStore = new Map<string, { total: number; completed: number }>();

  for (const todo of todos) {
    // Guard against malformed/corrupted date values (e.g. bad test data) that would
    // otherwise make date-range loops elsewhere run for an unbounded number of iterations.
    if (!isValidDateKey(todo.date)) {
      continue;
    }

    const existing = dateStore.get(todo.date) ?? { total: 0, completed: 0 };
    existing.total += 1;
    if (todo.completionPercentage >= 100) {
      existing.completed += 1;
    }
    dateStore.set(todo.date, existing);
  }

  return dateStore;
}

function computeHeatmapLevel(total: number, completed: number): HeatmapLevel {
  if (total === 0 || completed === 0) {
    return 0;
  }

  const ratio = completed / total;
  if (ratio >= 1) {
    return 4;
  }
  if (ratio > 0.66) {
    return 3;
  }
  if (ratio > 0.33) {
    return 2;
  }
  return 1;
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
  const earliestAllowedDay = addDays(todayKey, -(HEATMAP_WINDOW_DAYS - 1));
  const dateStore = buildDailyCompletionMap(todos);

  const taskDates = Array.from(dateStore.keys())
    .filter((date) => date >= earliestAllowedDay && date <= todayKey)
    .sort();
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

  let currentStreakCount = 0;
  let currentStreakStartDate: string | undefined;
  let cursor = todayKey;
  for (let steps = 0; steps < HEATMAP_WINDOW_DAYS; steps += 1) {
    const record = dateStore.get(cursor);
    if (!record || record.completed !== record.total) {
      break;
    }
    currentStreakCount += 1;
    currentStreakStartDate = cursor;
    cursor = addDays(cursor, -1);
  }

  const firstTaskDay = taskDates[0];
  let bestStreakCount = 0;
  let currentRun = 0;
  cursor = firstTaskDay;

  for (let steps = 0; steps < HEATMAP_WINDOW_DAYS && cursor <= todayKey; steps += 1) {
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
    currentStreakStartDate,
    totalPerfectDays,
    longestGapDays,
  };
}

/**
 * Builds a LeetCode/GitHub-style contribution grid for the last `totalDays` days
 * (default ~18 weeks), padded at the start so cells align into 7-row week columns.
 */
export function getCompletionHeatmap(todos: Todo[], totalDays = HEATMAP_WINDOW_DAYS): HeatmapCell[] {
  const todayKey = buildDateKey(new Date());
  const dateStore = buildDailyCompletionMap(todos);

  const days: HeatmapCell[] = [];
  for (let offset = totalDays - 1; offset >= 0; offset -= 1) {
    const dateKey = addDays(todayKey, -offset);
    const record = dateStore.get(dateKey);
    const total = record?.total ?? 0;
    const completed = record?.completed ?? 0;
    days.push({ date: dateKey, total, completed, level: computeHeatmapLevel(total, completed) });
  }

  const firstDayWeekday = new Date(`${days[0].date}T00:00:00`).getDay();
  const padding: HeatmapCell[] = Array.from({ length: firstDayWeekday }, () => ({
    date: null,
    total: 0,
    completed: 0,
    level: 0,
  }));

  return [...padding, ...days];
}
