import type { Todo } from '../types/todo';
import { TODO_CATEGORIES } from '../types/todo';
import type { RoutineEntry } from '../types/routine';
import { getTimelineRows } from './dashboardService';

export interface DayOfWeekTrend {
  day: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface CategoryDistribution {
  category: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface ReschedulingMetrics {
  totalTasks: number;
  rescheduledTasks: number;
  totalPostponements: number;
  averagePostponements: number;
}

export interface InsightsReport {
  dayOfWeekTrends: DayOfWeekTrend[];
  categoryDistributions: CategoryDistribution[];
  reschedulingMetrics: ReschedulingMetrics;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function generateInsightsReport(todos: Todo[], routineEntries: RoutineEntry[]): InsightsReport {
  // ── Day of Week Trends ────────────────────────────────────────────────────
  const dayStats = new Map<string, { total: number; completed: number }>();
  DAYS_OF_WEEK.forEach((day) => dayStats.set(day, { total: 0, completed: 0 }));

  if (todos.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use only active (non-tombstone) todos to find the earliest date
    const activeTodos = todos.filter((t) => !t.rescheduledToDate);
    let minDateStr = activeTodos[0]?.date ?? today.toISOString().slice(0, 10);
    for (const t of activeTodos) {
      if (t.date < minDateStr) minDateStr = t.date;
    }

    const current = new Date(`${minDateStr}T00:00:00`);

    while (current <= today) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const weekdayStr = current.toLocaleDateString('en-US', { weekday: 'long' });

      // Routine-slotted todos via timeline rows
      const timelineRows = getTimelineRows(routineEntries, todos, dateStr);
      const timelineSumPercentage = timelineRows.reduce((sum, row) => sum + row.completionPercentage, 0);
      const timelineCount = timelineRows.length;

      // Free todos for this date (no routine slot, not a tombstone)
      const freeTodosForDate = todos.filter(
        (t) => t.date === dateStr && !t.routineEntryId && !t.rescheduledToDate,
      );
      const freeSumPercentage = freeTodosForDate.reduce((sum, t) => sum + (t.completionPercentage || 0), 0);
      const freeCount = freeTodosForDate.length;

      const totalCount = timelineCount + freeCount;
      const totalSumPercentage = timelineSumPercentage + freeSumPercentage;

      if (totalCount > 0) {
        const stat = dayStats.get(weekdayStr)!;
        stat.total += totalCount * 100; // max possible percentage points
        stat.completed += totalSumPercentage;
      }

      current.setDate(current.getDate() + 1);
    }
  }

  // ── Category Distribution ─────────────────────────────────────────────────
  const catStats = new Map<string, { total: number; completed: number }>();
  TODO_CATEGORIES.forEach((cat) => catStats.set(cat, { total: 0, completed: 0 }));

  // ── Rescheduling Metrics ──────────────────────────────────────────────────
  let totalRescheduledTasks = 0;
  let totalPostponements = 0;

  for (const todo of todos) {
    // Category stats — include all todos (tombstones included for full creation picture)
    const categoryName = todo.category || 'Uncategorized';
    const existingCat = catStats.get(categoryName) ?? { total: 0, completed: 0 };
    existingCat.total += 1;
    existingCat.completed += (todo.completionPercentage || 0) / 100;
    catStats.set(categoryName, existingCat);

    // Rescheduling counts
    if (todo.rescheduleCount > 0) {
      totalRescheduledTasks += 1;
      totalPostponements += todo.rescheduleCount;
    }
  }

  // ── Assemble output ───────────────────────────────────────────────────────
  const dayOfWeekTrends = DAYS_OF_WEEK.map((day) => {
    const stat = dayStats.get(day)!;
    return {
      day,
      totalTasks: Math.round(stat.total / 100),
      completedTasks: Number((stat.completed / 100).toFixed(1)),
      completionRate: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0,
    };
  });

  const categoryDistributions = Array.from(catStats.entries())
    .map(([category, stat]) => ({
      category,
      totalTasks: stat.total,
      completedTasks: Number(stat.completed.toFixed(1)),
      completionRate: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0,
    }))
    .sort((a, b) => b.totalTasks - a.totalTasks);

  // Exclude tombstone rows from the active task count
  const totalTasks = todos.filter((t) => !t.rescheduledToDate).length;
  const averagePostponements = totalTasks > 0 ? Number((totalPostponements / totalTasks).toFixed(2)) : 0;

  return {
    dayOfWeekTrends,
    categoryDistributions,
    reschedulingMetrics: {
      totalTasks,
      rescheduledTasks: totalRescheduledTasks,
      totalPostponements,
      averagePostponements,
    },
  };
}
