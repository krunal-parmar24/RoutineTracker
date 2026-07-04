import { createDefaultStorageData, readStorageData, writeStorageData } from '../storage/localStorageAdapter';

export interface StorageRecoveryResult {
  recovered: boolean;
  data: ReturnType<typeof createDefaultStorageData>;
}

export function recoverStorageData(): StorageRecoveryResult {
  const data = readStorageData();
  const hasValidUsers = Array.isArray(data.users);
  const hasValidRoutines = Array.isArray(data.routines);
  const hasValidTodos = Array.isArray(data.todos);

  if (hasValidUsers && hasValidRoutines && hasValidTodos) {
    return { recovered: false, data };
  }

  const recoveredData = createDefaultStorageData();
  writeStorageData(recoveredData);
  return { recovered: true, data: recoveredData };
}
