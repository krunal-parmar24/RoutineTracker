import { readStorageData, writeStorageData } from '../storage/localStorageAdapter';
import type { RoutineEntry, WeeklyRoutine } from '../types/routine';

export interface RoutineRepository {
  getRoutine(userId: string): Promise<WeeklyRoutine | null>;
  saveRoutine(routine: WeeklyRoutine): Promise<WeeklyRoutine>;
  upsertEntry(userId: string, entry: RoutineEntry): Promise<WeeklyRoutine>;
}

export class LocalStorageRoutineRepository implements RoutineRepository {
  async getRoutine(userId: string): Promise<WeeklyRoutine | null> {
    const data = readStorageData();
    const existing = data.routines.find((entry) => entry.userId === userId);
    return existing ?? null;
  }

  async saveRoutine(routine: WeeklyRoutine): Promise<WeeklyRoutine> {
    const data = readStorageData();
    const existingIndex = data.routines.findIndex((entry) => entry.userId === routine.userId);

    if (existingIndex >= 0) {
      data.routines[existingIndex] = routine;
    } else {
      data.routines.push(routine);
    }

    writeStorageData(data);
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
