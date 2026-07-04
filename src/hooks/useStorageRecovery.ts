import { useEffect, useState } from 'react';
import { recoverStorageData } from '../services/storageService';

export function useStorageRecovery() {
  const [recovered, setRecovered] = useState(false);

  useEffect(() => {
    const result = recoverStorageData();
    setRecovered(result.recovered);
  }, []);

  return recovered;
}
