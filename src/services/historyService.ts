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
      todos: items.sort((a, b) => a.routineTimeLabel.localeCompare(b.routineTimeLabel)),
    }));
}
