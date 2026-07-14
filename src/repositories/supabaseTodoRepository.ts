import { getSupabaseClient } from '../integrations/supabaseClient';
import { mapTodoRow, todoToRow, type TodoRow } from './supabaseMappers';
import type { TodoRepository } from './todoRepository';
import type { Todo } from '../types/todo';
import { withTimeout } from '../utils/withTimeout';

const TODO_COLUMNS = 'id, user_id, date, weekday, routine_entry_id, routine_time_label, title, description, category, reschedule_count, completion_percentage, created_at, updated_at';

export class SupabaseTodoRepository implements TodoRepository {
  async getByDate(userId: string, date: string): Promise<Todo[]> {
    const { data, error } = await withTimeout(
      // Only return active todos for the date (exclude tombstones where rescheduled_to_date IS NOT NULL)
      getSupabaseClient().from('todos').select(TODO_COLUMNS).eq('user_id', userId).eq('date', date).is('rescheduled_to_date', null),
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

    const saved = mapTodoRow(data);
    try {
      window.dispatchEvent(new CustomEvent('todo:created', { detail: { id: saved.id } }));
    } catch {
      // noop in non-browser environments
    }
    return saved;
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
      if (error.code === '23505') {
        throw new Error('This routine slot already has a todo for this date.');
      }
      throw new Error(error.message);
    }

    const saved = mapTodoRow(data);
    try {
      window.dispatchEvent(new CustomEvent('todo:updated', { detail: { id: saved.id } }));
    } catch {
      // noop in non-browser environments
    }
    return saved;
  }

  async batchUpdateTodos(todos: Todo[]): Promise<Todo[]> {
    if (todos.length === 0) return [];
    
    // To avoid unique constraint violations (e.g. A bumps B, B bumps C),
    // we must process the updates in reverse order (C moves to empty slot, B takes C's slot, A takes B's slot).
    const results: TodoRow[] = [];
    const reversed = [...todos].reverse();

    for (const todo of reversed) {
      const { data, error } = await withTimeout(
        getSupabaseClient()
          .from('todos')
          .update(todoToRow(todo))
          .eq('id', todo.id)
          .eq('user_id', todo.userId)
          .select(TODO_COLUMNS)
          .single<TodoRow>()
      );

      if (error) {
        if (error.code === '23505') {
          throw new Error('A routine slot conflict occurred during batch update.');
        }
        throw new Error(error.message);
      }
      results.push(data);
    }

    // Return them in the original order (un-reverse)
    return results.reverse().map(mapTodoRow);
  }

  async batchProcessReschedules(updates: Todo[], inserts: Todo[]): Promise<{ updated: Todo[], inserted: Todo[] }> {
    const updatedResults: TodoRow[] = [];
    for (const todo of updates) {
      const { data, error } = await withTimeout(
        getSupabaseClient()
          .from('todos')
          .update(todoToRow(todo))
          .eq('id', todo.id)
          .eq('user_id', todo.userId)
          .select(TODO_COLUMNS)
          .single<TodoRow>()
      );
      if (error) throw new Error(error.message);
      updatedResults.push(data);
    }

    let insertResults: TodoRow[] = [];
    if (inserts.length > 0) {
       const rows = inserts.map(todoToRow);
       const { data, error } = await withTimeout(
         getSupabaseClient()
           .from('todos')
           .insert(rows)
           .select(TODO_COLUMNS)
       );
       if (error) {
         if (error.code === '23505') throw new Error('A routine slot conflict occurred during batch insert.');
         throw new Error(error.message);
       }
       insertResults = data as TodoRow[] || [];
    }

      const result = {
        updated: updatedResults.map(mapTodoRow),
        inserted: insertResults.map(mapTodoRow)
      };

      try {
        window.dispatchEvent(new CustomEvent('todo:batch', { detail: { updated: result.updated.map(t => t.id), inserted: result.inserted.map(t => t.id) } }));
      } catch {
        // noop in non-browser environments
      }

      return result;
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    const { error } = await withTimeout(getSupabaseClient().from('todos').delete().eq('user_id', userId).eq('id', todoId));
    if (error) {
      throw new Error(error.message);
    }
  }
}
