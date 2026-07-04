import { createRepositoryContainer } from '../factories/repositoryFactory';

// Temporarily use local storage instead of Supabase.
export const appServices = createRepositoryContainer('localStorage');
