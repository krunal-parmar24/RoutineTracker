import type { RoutineEntry } from '../types/routine';
import type { Todo } from '../types/todo';
import { formatTime12 } from '../utils/date';
import { buildRoutineTimeLabel } from './todoService';

export type TimelineStatus = 'Completed' | 'In Progress' | 'Not Started' | 'Missed' | 'Rescheduled' | 'No Task Assigned';

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
  sumPercentage: number;
  percentage: number;
  level: HeatmapLevel;
}

// Streak stats and the heatmap both look back over the same rolling window, so the two
// numbers shown together on the dashboard are always consistent with each other.
const HEATMAP_WINDOW_DAYS = 371;

function buildDateKey(date: Date) {
  // Use LOCAL date parts so the key matches how dates are stored (YYYY-MM-DD in local time).
  // toISOString() is UTC-based and shifts the date for any UTC+ timezone.
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

function addDays(dateKey: string, offset: number) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + offset);
  return buildDateKey(date);
}

function isValidDateKey(dateKey: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey) && !Number.isNaN(new Date(`${dateKey}T00:00:00`).getTime());
}

/** Groups todos by date, counting how many were planned vs. completed each day. */
function buildDailyCompletionMap(todos: Todo[]): Map<string, { total: number; completed: number; sumPercentage: number }> {
  const dateStore = new Map<string, { total: number; completed: number; sumPercentage: number }>();

  for (const todo of todos) {
    // Guard against malformed/corrupted date values (e.g. bad test data) that would
    // otherwise make date-range loops elsewhere run for an unbounded number of iterations.
    if (!isValidDateKey(todo.date)) {
      continue;
    }

    // Exclude tombstone rows (rescheduled tasks) from daily performance calculations
    if (todo.rescheduledToDate) {
      continue;
    }

    const existing = dateStore.get(todo.date) ?? { total: 0, completed: 0, sumPercentage: 0 };
    existing.total += 1;
    existing.sumPercentage += (todo.completionPercentage || 0);
    if (todo.completionPercentage >= 100) {
      existing.completed += 1;
    }
    dateStore.set(todo.date, existing);
  }

  return dateStore;
}

function computeHeatmapLevel(percentage: number): HeatmapLevel {
  if (percentage === 0) {
    return 0;
  }

  if (percentage >= 100) {
    return 4;
  }
  if (percentage > 66) {
    return 3;
  }
  if (percentage > 33) {
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

function getDisplayStatus(todo: Todo, selectedDate: string, endTime: string, now: Date): TimelineStatus {
  if (todo.rescheduledToDate) {
    return 'Rescheduled';
  }

  if (todo.completionPercentage >= 100) {
    return 'Completed';
  }

  if (isSlotMissed(selectedDate, endTime, todo.completionPercentage, now)) {
    return 'Missed';
  }

  if (todo.completionPercentage > 0) {
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
      // Only consider todos that are active for the selected date.
      const todo = todos.find((item) => item.routineEntryId === entry.id && item.date === selectedDate && !item.rescheduledToDate);
      const completionPercentage = todo?.completionPercentage ?? 0;
      const slotStart = buildDateTime(selectedDate, entry.startTime);
      const slotEnd = buildDateTime(selectedDate, entry.endTime);
      const isActive = selectedDate === todayKey && now >= slotStart && now <= slotEnd;
      const isPast = selectedDate < todayKey || (selectedDate === todayKey && now > slotEnd);
      const isFuture = selectedDate > todayKey || (selectedDate === todayKey && now < slotStart);
      const status = todo ? getDisplayStatus(todo, selectedDate, entry.endTime, now) : 'No Task Assigned';

      return {
        isDeletedEntry: Boolean(entry.deletedAt),
        row: {
          routineEntryId: entry.id,
          routineTimeLabel: buildRoutineTimeLabel(entry),
          startTime: formatTime12(entry.startTime),
          endTime: formatTime12(entry.endTime),
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

/** Returns todos for `selectedDate` that are NOT tied to any routine slot. */
export function getFreeTodos(todos: Todo[], selectedDate: string): Todo[] {
  return todos.filter((todo) => todo.date === selectedDate && !todo.routineEntryId && !todo.rescheduledToDate);
}

export function getDashboardSummary(routineEntries: RoutineEntry[], todos: Todo[], selectedDate: string, weekday: string): DashboardSummary {
  const timelineRows = getTimelineRows(routineEntries, todos, selectedDate);
  const freeTodos = getFreeTodos(todos, selectedDate);
  // All active todos for the selected date (routine-linked + free)
  const allDayTodos = [...todos.filter((t) => t.date === selectedDate && !t.rescheduledToDate), ...freeTodos].filter(
    (t, idx, arr) => arr.findIndex((x) => x.id === t.id) === idx // deduplicate
  );
  const completedTodos = allDayTodos.filter((todo) => todo.completionPercentage >= 100).length;
  const inProgressTodos = allDayTodos.filter((todo) => todo.completionPercentage > 0 && todo.completionPercentage < 100).length;
  const notStartedTodos = allDayTodos.filter((todo) => todo.completionPercentage === 0).length;
  const missedTodos = timelineRows.filter((item) => item.status === 'Missed').length;
  const totalTodos = allDayTodos.length;
  // Average completion across actual todos only — matches the heatmap calculation in buildDailyCompletionMap.
  // Excluding empty routine slots (0%) from the denominator keeps the dashboard and heatmap consistent.
  const allDaySum = allDayTodos.reduce((sum, t) => sum + (t.completionPercentage || 0), 0);
  const overallCompletionPercentage = totalTodos > 0 ? Math.round(allDaySum / totalTodos) : 0;

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
    current.completed += (todo.completionPercentage || 0) / 100;
    grouped.set(slotLabel, current);
  }

  const slots: ProductivitySlot[] = Array.from(grouped.entries()).map(([slotLabel, data]) => ({
    slotLabel,
    totalTasks: data.total,
    completedTasks: Number(data.completed.toFixed(1)),
    completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
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
    const sumPercentage = record?.sumPercentage ?? 0;
    const percentage = total > 0 ? Math.round(sumPercentage / total) : 0;
    days.push({ date: dateKey, total, completed, sumPercentage, percentage, level: computeHeatmapLevel(percentage) });
  }

  const firstDayWeekday = new Date(`${days[0].date}T00:00:00`).getDay();
  const padding: HeatmapCell[] = Array.from({ length: firstDayWeekday }, () => ({
    date: null,
    total: 0,
    completed: 0,
    sumPercentage: 0,
    percentage: 0,
    level: 0,
  }));

  return [...padding, ...days];
}
