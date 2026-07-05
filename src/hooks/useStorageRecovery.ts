import { useEffect, useState } from 'react';
import { getStorageProvider } from '../factories/repositoryFactory';
import { recoverStorageData } from '../services/storageService';

export function useStorageRecovery() {
  const [recovered, setRecovered] = useState(false);

  useEffect(() => {
    // Local storage corruption recovery only applies when local storage is the active provider.
    if (getStorageProvider() !== 'localStorage') {
      return;
    }

    const result = recoverStorageData();
    setRecovered(result.recovered);
  }, []);

  return recovered;
}
