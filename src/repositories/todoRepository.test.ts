import { beforeEach, describe, expect, it } from 'vitest';
import { LocalStorageTodoRepository } from './todoRepository';

describe('LocalStorageTodoRepository', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns all todos for a user when no date is provided', async () => {
    const repository = new LocalStorageTodoRepository();
    const storage = window.localStorage.getItem('routine-tracker:data');
    expect(storage).toBeNull();

    const firstTodo = {
      id: '1',
      userId: 'user-1',
      date: '2026-07-04',
      weekday: 'Saturday',
      routineEntryId: 'entry-1',
      routineTimeLabel: '09:00–10:00',
      title: 'Study',
      completionPercentage: 50,
      createdAt: '2026-07-04T00:00:00.000Z',
      updatedAt: '2026-07-04T00:00:00.000Z',
    };

    const secondTodo = {
      ...firstTodo,
      id: '2',
      date: '2026-07-03',
      routineEntryId: 'entry-2',
      title: 'Exercise',
    };

    await repository.saveTodo(firstTodo);
    await repository.saveTodo(secondTodo);

    const todos = await repository.getAll('user-1');
    expect(todos).toHaveLength(2);
  });
});
