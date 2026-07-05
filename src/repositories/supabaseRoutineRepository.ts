import { getSupabaseClient } from '../integrations/supabaseClient';
import { mapRoutineEntryRow, routineEntryToRow, type RoutineEntryRow } from './supabaseMappers';
import type { RoutineRepository } from './routineRepository';
import type { RoutineEntry, WeeklyRoutine } from '../types/routine';

interface WeeklyRoutineRow {
  id: string;
  user_id: string;
  updated_at: string;
}

export class SupabaseRoutineRepository implements RoutineRepository {
  async getRoutine(userId: string): Promise<WeeklyRoutine | null> {
    const client = getSupabaseClient();
    const { data: routineRow, error: routineError } = await client
      .from('weekly_routines')
      .select('id, user_id, updated_at')
      .eq('user_id', userId)
      .maybeSingle<WeeklyRoutineRow>();

    if (routineError) {
      throw new Error(routineError.message);
    }
    if (!routineRow) {
      return null;
    }

    const { data: entryRows, error: entriesError } = await client
      .from('routine_entries')
      .select('id, routine_id, user_id, day_of_week, start_time, end_time, title, description, order, created_at')
      .eq('routine_id', routineRow.id)
      .order('order', { ascending: true });

    if (entriesError) {
      throw new Error(entriesError.message);
    }

    return {
      id: routineRow.id,
      userId: routineRow.user_id,
      updatedAt: routineRow.updated_at,
      entries: (entryRows as RoutineEntryRow[] | null ?? []).map(mapRoutineEntryRow),
    };
  }

  async saveRoutine(routine: WeeklyRoutine): Promise<WeeklyRoutine> {
    const client = getSupabaseClient();

    const { error: upsertError } = await client
      .from('weekly_routines')
      .upsert({ id: routine.id, user_id: routine.userId, updated_at: routine.updatedAt }, { onConflict: 'user_id' });

    if (upsertError) {
      throw new Error(upsertError.message);
    }

    const { error: deleteError } = await client.from('routine_entries').delete().eq('routine_id', routine.id);
    if (deleteError) {
      throw new Error(deleteError.message);
    }

    if (routine.entries.length > 0) {
      const rows = routine.entries.map((entry) => routineEntryToRow(entry, routine.id, routine.userId));
      const { error: insertError } = await client.from('routine_entries').insert(rows);
      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    return routine;
  }

  async upsertEntry(userId: string, entry: RoutineEntry): Promise<WeeklyRoutine> {
    const existing = await this.getRoutine(userId);
    const routine: WeeklyRoutine = existing ?? { id: crypto.randomUUID(), userId, entries: [], updatedAt: new Date().toISOString() };

    const entries = [...routine.entries];
    const index = entries.findIndex((item) => item.id === entry.id);
    if (index >= 0) {
      entries[index] = entry;
    } else {
      entries.push(entry);
    }

    const nextRoutine: WeeklyRoutine = {
      ...routine,
      entries,
      updatedAt: new Date().toISOString(),
    };

    return this.saveRoutine(nextRoutine);
  }
}
