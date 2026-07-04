import type { Todo } from '../types/todo';
import type { TodoRepository } from './todoRepository';

export class SupabaseTodoRepository implements TodoRepository {
  async getByDate(_userId: string, _date: string): Promise<Todo[]> {
    return [];
  }

  async getAll(_userId: string): Promise<Todo[]> {
    return [];
  }

  async getById(_userId: string, _todoId: string): Promise<Todo | undefined> {
    return undefined;
  }

  async saveTodo(todo: Todo): Promise<Todo> {
    return todo;
  }

  async updateTodo(todo: Todo): Promise<Todo> {
    return todo;
  }
}
