import type { RoutineEntry, WeeklyRoutine } from '../types/routine';
import type { RoutineRepository } from './routineRepository';

export class SupabaseRoutineRepository implements RoutineRepository {
  async getRoutine(_userId: string): Promise<WeeklyRoutine | null> {
    return null;
  }

  async saveRoutine(routine: WeeklyRoutine): Promise<WeeklyRoutine> {
    return routine;
  }

  async upsertEntry(userId: string, entry: RoutineEntry): Promise<WeeklyRoutine> {
    const existing = await this.getRoutine(userId);
    const routine = existing ?? { id: crypto.randomUUID(), userId, entries: [], updatedAt: new Date().toISOString() };
    const entries = [...routine.entries, entry];
    return this.saveRoutine({ ...routine, entries, updatedAt: new Date().toISOString() });
  }
}
