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
  // Day of Week Trends
  const dayStats = new Map<string, { total: number; completed: number }>();
  DAYS_OF_WEEK.forEach((day) => dayStats.set(day, { total: 0, completed: 0 }));

  if (todos.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find min date
    let minDateStr = todos[0].date;
    for (const t of todos) {
      if (t.date < minDateStr) minDateStr = t.date;
    }

    const current = new Date(`${minDateStr}T00:00:00`);
    
    // Iterate from minDate to today
    while (current <= today) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      
      const weekdayStr = current.toLocaleDateString('en-US', { weekday: 'long' });
      const timelineRows = getTimelineRows(routineEntries, todos, dateStr);
      
      const sumPercentage = timelineRows.reduce((sum, row) => sum + row.completionPercentage, 0);
      const slotsCount = timelineRows.length;
      
      if (slotsCount > 0) {
        const stat = dayStats.get(weekdayStr)!;
        stat.total += slotsCount * 100; // max possible percentage
        stat.completed += sumPercentage;
      }
      
      current.setDate(current.getDate() + 1);
    }
  }

  // Category Distribution
  const catStats = new Map<string, { total: number; completed: number }>();
  TODO_CATEGORIES.forEach((cat) => catStats.set(cat, { total: 0, completed: 0 }));

  // Rescheduling Metrics
  let totalRescheduledTasks = 0;
  let totalPostponements = 0;

  for (const todo of todos) {
    // Categories
    const categoryName = todo.category || 'Uncategorized';
    const existingCat = catStats.get(categoryName) ?? { total: 0, completed: 0 };
    existingCat.total += 1;
    existingCat.completed += (todo.completionPercentage || 0) / 100;
    catStats.set(categoryName, existingCat);

    // Rescheduling
    if (todo.rescheduleCount > 0) {
      totalRescheduledTasks += 1;
      totalPostponements += todo.rescheduleCount;
    }
  }

  const dayOfWeekTrends = DAYS_OF_WEEK.map((day) => {
    const stat = dayStats.get(day)!;
    return {
      day,
      totalTasks: Math.round(stat.total / 100),
      completedTasks: Number((stat.completed / 100).toFixed(1)),
      completionRate: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0,
    };
  });

  const categoryDistributions = Array.from(catStats.entries()).map(([category, stat]) => ({
    category,
    totalTasks: stat.total,
    completedTasks: Number(stat.completed.toFixed(1)),
    completionRate: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0,
  })).sort((a, b) => b.totalTasks - a.totalTasks);

  const totalTasks = todos.length;
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
