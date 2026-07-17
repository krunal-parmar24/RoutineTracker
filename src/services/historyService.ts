import type { Todo } from '../types/todo';

export interface HistoryGroup {
  date: string;
  todos: Todo[];
}

export function groupTodosByDate(todos: Todo[]): HistoryGroup[] {
  const grouped = new Map<string, Todo[]>();

  for (const todo of todos) {
    const existing = grouped.get(todo.date) ?? [];
    existing.push(todo);
    grouped.set(todo.date, existing);
  }

  return Array.from(grouped.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({
      date,
      todos: items.sort((a, b) => {
        // Routine-slotted todos sort by time label; free todos (no slot) go last
        const aLabel = a.routineTimeLabel ?? '';
        const bLabel = b.routineTimeLabel ?? '';
        if (aLabel !== bLabel) return aLabel.localeCompare(bLabel);
        // Tiebreak by creation time
        return a.createdAt.localeCompare(b.createdAt);
      }),
    }));
}
