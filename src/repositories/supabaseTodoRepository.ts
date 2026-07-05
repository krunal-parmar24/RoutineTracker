import { getSupabaseClient } from '../integrations/supabaseClient';
import { mapTodoRow, todoToRow, type TodoRow } from './supabaseMappers';
import type { TodoRepository } from './todoRepository';
import type { Todo } from '../types/todo';
import { withTimeout } from '../utils/withTimeout';

const TODO_COLUMNS = 'id, user_id, date, weekday, routine_entry_id, routine_time_label, title, description, completion_percentage, created_at, updated_at';

export class SupabaseTodoRepository implements TodoRepository {
  async getByDate(userId: string, date: string): Promise<Todo[]> {
    const { data, error } = await withTimeout(
      getSupabaseClient().from('todos').select(TODO_COLUMNS).eq('user_id', userId).eq('date', date),
    );

    if (error) {
      throw new Error(error.message);
    }
    return (data as TodoRow[] | null ?? []).map(mapTodoRow);
  }

  async getAll(userId: string): Promise<Todo[]> {
    const { data, error } = await withTimeout(getSupabaseClient().from('todos').select(TODO_COLUMNS).eq('user_id', userId));

    if (error) {
      throw new Error(error.message);
    }
    return (data as TodoRow[] | null ?? []).map(mapTodoRow);
  }

  async getById(userId: string, todoId: string): Promise<Todo | undefined> {
    const { data, error } = await withTimeout(
      getSupabaseClient().from('todos').select(TODO_COLUMNS).eq('user_id', userId).eq('id', todoId).maybeSingle<TodoRow>(),
    );

    if (error) {
      throw new Error(error.message);
    }
    return data ? mapTodoRow(data) : undefined;
  }

  async saveTodo(todo: Todo): Promise<Todo> {
    const { data, error } = await withTimeout(
      getSupabaseClient().from('todos').insert(todoToRow(todo)).select(TODO_COLUMNS).single<TodoRow>(),
    );

    if (error) {
      if (error.code === '23505') {
        throw new Error('This routine slot already has a todo for this date.');
      }
      throw new Error(error.message);
    }

    return mapTodoRow(data);
  }

  async updateTodo(todo: Todo): Promise<Todo> {
    const { data, error } = await withTimeout(
      getSupabaseClient()
        .from('todos')
        .update(todoToRow(todo))
        .eq('id', todo.id)
        .eq('user_id', todo.userId)
        .select(TODO_COLUMNS)
        .single<TodoRow>(),
    );

    if (error) {
      throw new Error(error.message);
    }

    return mapTodoRow(data);
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    const { error } = await withTimeout(getSupabaseClient().from('todos').delete().eq('user_id', userId).eq('id', todoId));
    if (error) {
      throw new Error(error.message);
    }
  }
}
