import { useEffect, useState } from 'react';
import { LocalStorageAuthRepository } from '../repositories/authRepository';
import type { AuthSession, LoginCredentials, SignupCredentials, User } from '../types/auth';

const authRepository = new LocalStorageAuthRepository();

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    authRepository.getSession().then((session: AuthSession) => {
      if (session.userId) {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    });
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const loggedInUser = await authRepository.login(credentials);
    if (loggedInUser) {
      setUser(loggedInUser);
      setIsAuthenticated(true);
      return loggedInUser;
    }

    return null;
  };

  const signup = async (credentials: SignupCredentials) => {
    const createdUser = await authRepository.signup(credentials);
    setUser(createdUser);
    setIsAuthenticated(true);
    return createdUser;
  };

  const logout = async () => {
    await authRepository.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return { user, isAuthenticated, isLoading, login, signup, logout };
}
