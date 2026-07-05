import { readStorageData, writeStorageData } from '../storage/localStorageAdapter';
import type { Todo } from '../types/todo';

export interface TodoRepository {
  getByDate(userId: string, date: string): Promise<Todo[]>;
  getAll(userId: string): Promise<Todo[]>;
  getById(userId: string, todoId: string): Promise<Todo | undefined>;
  saveTodo(todo: Todo): Promise<Todo>;
  updateTodo(todo: Todo): Promise<Todo>;
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
    const nextTodos = data.todos.map((item) => (item.id === todo.id ? todo : item));
    data.todos = nextTodos;
    writeStorageData(data);
    return todo;
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    const data = readStorageData();
    data.todos = data.todos.filter((item) => !(item.userId === userId && item.id === todoId));
    writeStorageData(data);
  }
}
