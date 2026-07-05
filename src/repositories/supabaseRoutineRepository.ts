import { getSupabaseClient } from '../integrations/supabaseClient';
import { mapRoutineEntryRow, routineEntryToRow, type RoutineEntryRow } from './supabaseMappers';
import type { RoutineRepository } from './routineRepository';
import type { RoutineEntry, WeeklyRoutine } from '../types/routine';
import { withTimeout } from '../utils/withTimeout';

interface WeeklyRoutineRow {
  id: string;
  user_id: string;
  updated_at: string;
}

export class SupabaseRoutineRepository implements RoutineRepository {
  async getRoutine(userId: string): Promise<WeeklyRoutine | null> {
    const client = getSupabaseClient();
    const { data: routineRow, error: routineError } = await withTimeout(
      client.from('weekly_routines').select('id, user_id, updated_at').eq('user_id', userId).maybeSingle<WeeklyRoutineRow>(),
    );

    if (routineError) {
      throw new Error(routineError.message);
    }
    if (!routineRow) {
      return null;
    }

    const { data: entryRows, error: entriesError } = await withTimeout(
      client
        .from('routine_entries')
        .select('id, routine_id, user_id, day_of_week, start_time, end_time, title, description, order, created_at, deleted_at')
        .eq('routine_id', routineRow.id)
        .order('order', { ascending: true }),
    );

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

    const { error: upsertError } = await withTimeout(
      client
        .from('weekly_routines')
        .upsert({ id: routine.id, user_id: routine.userId, updated_at: routine.updatedAt }, { onConflict: 'user_id' }),
    );

    if (upsertError) {
      throw new Error(upsertError.message);
    }

    // Diff against existing rows instead of delete-all + reinsert-all: a full wipe would
    // cascade-affect every entry's todos on every save, not just the one entry being changed.
    const { data: existingRows, error: existingError } = await withTimeout(
      client.from('routine_entries').select('id').eq('routine_id', routine.id),
    );

    if (existingError) {
      throw new Error(existingError.message);
    }

    const existingIds = new Set((existingRows ?? []).map((row) => row.id as string));
    const nextIds = new Set(routine.entries.map((entry) => entry.id));
    const idsToRemove = [...existingIds].filter((id) => !nextIds.has(id));

    if (idsToRemove.length > 0) {
      const { error: deleteError } = await withTimeout(client.from('routine_entries').delete().in('id', idsToRemove));
      if (deleteError) {
        throw new Error(deleteError.message);
      }
    }

    if (routine.entries.length > 0) {
      const rows = routine.entries.map((entry) => routineEntryToRow(entry, routine.id, routine.userId));
      const { error: upsertEntriesError } = await withTimeout(client.from('routine_entries').upsert(rows, { onConflict: 'id' }));
      if (upsertEntriesError) {
        throw new Error(upsertEntriesError.message);
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
