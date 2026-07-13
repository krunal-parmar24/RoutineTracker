import { readStorageData, writeStorageData } from '../storage/localStorageAdapter';
import type { Todo } from '../types/todo';

export interface TodoRepository {
  getByDate(userId: string, date: string): Promise<Todo[]>;
  getAll(userId: string): Promise<Todo[]>;
  getById(userId: string, todoId: string): Promise<Todo | undefined>;
  saveTodo(todo: Todo): Promise<Todo>;
  updateTodo(todo: Todo): Promise<Todo>;
  batchUpdateTodos(todos: Todo[]): Promise<Todo[]>;
  batchProcessReschedules(updates: Todo[], inserts: Todo[]): Promise<{ updated: Todo[], inserted: Todo[] }>;
  deleteTodo(userId: string, todoId: string): Promise<void>;
}

export class LocalStorageTodoRepository implements TodoRepository {
  async getByDate(userId: string, date: string): Promise<Todo[]> {
    const data = readStorageData();
    return data.todos.filter((todo) => todo.userId === userId && todo.date === date);
  }

  async getAll(userId: string): Promise<Todo[]> {
    const data = readStorageData();
    return data.todos.filter((todo) => todo.userId === userId);
  }

  async saveTodo(todo: Todo): Promise<Todo> {
    const data = readStorageData();
    data.todos = [...data.todos, todo];
    writeStorageData(data);
    return todo;
  }

  async getById(userId: string, todoId: string): Promise<Todo | undefined> {
    const data = readStorageData();
    return data.todos.find((todo) => todo.userId === userId && todo.id === todoId);
  }

  async updateTodo(todo: Todo): Promise<Todo> {
    const data = readStorageData();
    const conflict = data.todos.find(
      (item) => item.userId === todo.userId && item.date === todo.date && item.routineEntryId === todo.routineEntryId && item.id !== todo.id
    );
    if (conflict) {
      throw new Error('This routine slot already has a todo for this date.');
    }
    const nextTodos = data.todos.map((item) => (item.id === todo.id ? todo : item));
    data.todos = nextTodos;
    writeStorageData(data);
    return todo;
  }

  async batchUpdateTodos(todos: Todo[]): Promise<Todo[]> {
    const data = readStorageData();
    const nextTodos = data.todos.map((item) => {
      const match = todos.find((t) => t.id === item.id);
      return match ? match : item;
    });
    // Check conflicts across the entire new set and existing set
    // A conflict occurs if there are duplicate (userId, date, routineEntryId) pairs.
    const seen = new Set<string>();
    for (const item of nextTodos) {
      const key = `${item.userId}|${item.date}|${item.routineEntryId}`;
      if (seen.has(key)) {
        throw new Error(`Conflict detected for slot on ${item.date}.`);
      }
      seen.add(key);
    }
    data.todos = nextTodos;
    writeStorageData(data);
    return todos;
  }

  async batchProcessReschedules(updates: Todo[], inserts: Todo[]): Promise<{ updated: Todo[], inserted: Todo[] }> {
    const data = readStorageData();
    let nextTodos = data.todos.map((item) => {
      const match = updates.find((t) => t.id === item.id);
      return match ? match : item;
    });

    const newInserts = inserts.map(item => ({
      ...item,
      id: item.id || crypto.randomUUID()
    }));
    
    nextTodos = [...nextTodos, ...newInserts];

    // Check conflicts
    const seen = new Set<string>();
    for (const item of nextTodos) {
      const key = `${item.userId}|${item.date}|${item.routineEntryId}`;
      if (seen.has(key)) {
        throw new Error(`Conflict detected for slot on ${item.date}.`);
      }
      seen.add(key);
    }
    data.todos = nextTodos;
    writeStorageData(data);
    
    return { updated: updates, inserted: newInserts };
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    const data = readStorageData();
    data.todos = data.todos.filter((item) => !(item.userId === userId && item.id === todoId));
    writeStorageData(data);
  }
}
