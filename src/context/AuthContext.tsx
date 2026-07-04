import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { appServices } from '../services/appServices';
import type { AuthSession, LoginCredentials, SignupCredentials, User } from '../types/auth';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User | null>;
  signup: (credentials: SignupCredentials) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const authRepository = appServices.authRepository;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    authRepository.getSession().then((session: AuthSession) => {
      if (!isMounted) {
        return;
      }

      if (session.userId) {
        const storedUser = window.localStorage.getItem('routine-tracker:user');
        if (storedUser) {
          setUser(JSON.parse(storedUser) as User);
          setIsAuthenticated(true);
        }
      }

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const loggedInUser = await authRepository.login(credentials);
    if (loggedInUser) {
      window.localStorage.setItem('routine-tracker:user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      setIsAuthenticated(true);
      return loggedInUser;
    }

    return null;
  };

  const signup = async (credentials: SignupCredentials) => {
    const createdUser = await authRepository.signup(credentials);
    // Do not auto-authenticate until the user confirms their email via Supabase.
    return createdUser;
  };

  const logout = async () => {
    await authRepository.logout();
    window.localStorage.removeItem('routine-tracker:user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = useMemo(
    () => ({ user, isAuthenticated, isLoading, login, signup, logout }),
    [user, isAuthenticated, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
