import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { appServices } from '../services/appServices';
import type { LoginCredentials, SignupCredentials, User } from '../types/auth';

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

    (async () => {
      try {
        const currentUser = await authRepository.getCurrentUser();
        if (!isMounted) return;

        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      } catch (err) {
        // If session resolution fails, ensure we stop loading and allow app to continue.
        console.warn('[AuthProvider] getCurrentUser failed', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
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
    // Signup already establishes a session in the repository; reflect that here.
    setUser(createdUser);
    setIsAuthenticated(true);
    return createdUser;
  };

  const logout = async () => {
    await authRepository.logout();
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
