import { createRepositoryContainer } from '../factories/repositoryFactory';

// Use local storage repositories only.
export const appServices = createRepositoryContainer('localStorage');
