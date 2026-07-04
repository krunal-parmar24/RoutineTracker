import { readStorageData, writeStorageData } from '../storage/localStorageAdapter';
import type { AuthSession, LoginCredentials, SignupCredentials, User } from '../types/auth';

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<User | null>;
  signup(credentials: SignupCredentials): Promise<User>;
  logout(): Promise<void>;
  getSession(): Promise<AuthSession>;
  persistSession(userId: string | null): Promise<void>;
}

export class LocalStorageAuthRepository implements AuthRepository {
  async login(credentials: LoginCredentials): Promise<User | null> {
    const data = readStorageData();
    const user = data.users.find((entry) => entry.email === credentials.email && entry.password === credentials.password);

    if (!user) {
      return null;
    }

    await this.persistSession(user.id);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
  }

  async signup(credentials: SignupCredentials): Promise<User> {
    const data = readStorageData();
    const exists = data.users.some((entry) => entry.email === credentials.email);

    if (exists) {
      throw new Error('An account with that email already exists.');
    }

    const user: User = {
      id: crypto.randomUUID(),
      email: credentials.email,
      name: credentials.name,
      createdAt: new Date().toISOString(),
    };

    data.users.push({
      id: user.id,
      email: user.email,
      password: credentials.password,
      name: user.name,
      createdAt: user.createdAt,
    });
    writeStorageData(data);
    await this.persistSession(user.id);
    return user;
  }

  async logout(): Promise<void> {
    const data = readStorageData();
    data.auth.currentUserId = null;
    writeStorageData(data);
  }

  async getSession(): Promise<AuthSession> {
    const data = readStorageData();
    return { userId: data.auth.currentUserId };
  }

  async persistSession(userId: string | null): Promise<void> {
    const data = readStorageData();
    data.auth.currentUserId = userId;
    writeStorageData(data);
  }
}
