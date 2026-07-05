import { LocalStorageAuthRepository } from '../repositories/authRepository';
import { LocalStorageRoutineRepository } from '../repositories/routineRepository';
import { LocalStorageTodoRepository } from '../repositories/todoRepository';

export type StorageProvider = 'localStorage';

export interface RepositoryContainer {
  authRepository: LocalStorageAuthRepository;
  routineRepository: LocalStorageRoutineRepository;
  todoRepository: LocalStorageTodoRepository;
}

export function createRepositoryContainer(_provider?: StorageProvider): RepositoryContainer {
  return {
    authRepository: new LocalStorageAuthRepository(),
    routineRepository: new LocalStorageRoutineRepository(),
    todoRepository: new LocalStorageTodoRepository(),
  };
}
