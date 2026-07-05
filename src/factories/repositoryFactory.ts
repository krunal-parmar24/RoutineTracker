import type { AuthRepository } from '../repositories/authRepository';
import { LocalStorageAuthRepository } from '../repositories/authRepository';
import type { RoutineRepository } from '../repositories/routineRepository';
import { LocalStorageRoutineRepository } from '../repositories/routineRepository';
import type { TodoRepository } from '../repositories/todoRepository';
import { LocalStorageTodoRepository } from '../repositories/todoRepository';
import { SupabaseAuthRepository } from '../repositories/supabaseAuthRepository';
import { SupabaseRoutineRepository } from '../repositories/supabaseRoutineRepository';
import { SupabaseTodoRepository } from '../repositories/supabaseTodoRepository';

export type StorageProvider = 'localStorage' | 'supabase';

export interface RepositoryContainer {
  authRepository: AuthRepository;
  routineRepository: RoutineRepository;
  todoRepository: TodoRepository;
}

export function getStorageProvider(): StorageProvider {
  return import.meta.env.VITE_STORAGE_PROVIDER === 'supabase' ? 'supabase' : 'localStorage';
}

export function createRepositoryContainer(provider: StorageProvider = getStorageProvider()): RepositoryContainer {
  if (provider === 'supabase') {
    return {
      authRepository: new SupabaseAuthRepository(),
      routineRepository: new SupabaseRoutineRepository(),
      todoRepository: new SupabaseTodoRepository(),
    };
  }

  return {
    authRepository: new LocalStorageAuthRepository(),
    routineRepository: new LocalStorageRoutineRepository(),
    todoRepository: new LocalStorageTodoRepository(),
  };
}
