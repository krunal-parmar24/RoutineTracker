import { createRepositoryContainer } from '../factories/repositoryFactory';

// Provider is resolved from VITE_STORAGE_PROVIDER (defaults to 'localStorage').
export const appServices = createRepositoryContainer();
