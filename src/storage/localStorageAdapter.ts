import type { WeeklyRoutine } from '../types/routine';
import type { Todo } from '../types/todo';

const STORAGE_KEY = 'routine-tracker:data';
export const STORAGE_SCHEMA_VERSION = 1;

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  name?: string;
  createdAt: string;
}

export interface StorageData {
  version: number;
  users: StoredUser[];
  auth: {
    currentUserId: string | null;
  };
  routines: WeeklyRoutine[];
  todos: Todo[];
}

export function readStorageData(): StorageData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultStorageData();
    }

    const parsed = JSON.parse(raw) as Partial<StorageData>;
    return {
      version: typeof parsed.version === 'number' ? parsed.version : STORAGE_SCHEMA_VERSION,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      auth: parsed.auth && typeof parsed.auth === 'object' ? parsed.auth : { currentUserId: null },
      routines: Array.isArray(parsed.routines) ? parsed.routines : [],
      todos: Array.isArray(parsed.todos) ? parsed.todos : [],
    };
  } catch {
    return createDefaultStorageData();
  }
}

export function writeStorageData(data: StorageData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, version: STORAGE_SCHEMA_VERSION }));
}

export function createDefaultStorageData(): StorageData {
  return {
    version: STORAGE_SCHEMA_VERSION,
    users: [],
    auth: { currentUserId: null },
    routines: [],
    todos: [],
  };
}
