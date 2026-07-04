const STORAGE_KEY = 'routine-tracker:data';

export interface StorageData {
  users: Array<{ id: string; email: string; password: string; name?: string; createdAt: string }>;
  auth: {
    currentUserId: string | null;
  };
  routines: Array<unknown>;
  todos: Array<unknown>;
}

export function readStorageData(): StorageData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultStorageData();
    }

    const parsed = JSON.parse(raw) as Partial<StorageData>;
    return {
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
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function createDefaultStorageData(): StorageData {
  return {
    users: [],
    auth: { currentUserId: null },
    routines: [],
    todos: [],
  };
}
