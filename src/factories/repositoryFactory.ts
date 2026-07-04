import { LocalStorageAuthRepository } from '../repositories/authRepository';
import { LocalStorageRoutineRepository } from '../repositories/routineRepository';
import { LocalStorageTodoRepository } from '../repositories/todoRepository';
import { SupabaseAuthRepository } from '../repositories/supabaseAuthRepository';
import { SupabaseRoutineRepository } from '../repositories/supabaseRoutineRepository';
import { SupabaseTodoRepository } from '../repositories/supabaseTodoRepository';
import { hasSupabaseConfig } from '../integrations/supabaseClient';

export type StorageProvider = 'localStorage' | 'supabase';

export interface RepositoryContainer {
  authRepository: LocalStorageAuthRepository | SupabaseAuthRepository;
  routineRepository: LocalStorageRoutineRepository | SupabaseRoutineRepository;
  todoRepository: LocalStorageTodoRepository | SupabaseTodoRepository;
}

export function createRepositoryContainer(provider?: StorageProvider): RepositoryContainer {
  const selectedProvider = provider ?? (hasSupabaseConfig() ? 'supabase' : 'localStorage');

  if (selectedProvider === 'supabase') {
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
