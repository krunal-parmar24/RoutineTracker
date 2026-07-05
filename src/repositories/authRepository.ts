import { readStorageData, writeStorageData } from '../storage/localStorageAdapter';
import { hashPassword, verifyPassword } from '../utils/password';
import type { AuthSession, LoginCredentials, SignupCredentials, User } from '../types/auth';

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<User | null>;
  signup(credentials: SignupCredentials): Promise<User>;
  logout(): Promise<void>;
  getSession(): Promise<AuthSession>;
  getCurrentUser(): Promise<User | null>;
  persistSession(userId: string | null): Promise<void>;
}

function toPublicUser(user: { id: string; email: string; name?: string; createdAt: string }): User {
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}

export class LocalStorageAuthRepository implements AuthRepository {
  async login(credentials: LoginCredentials): Promise<User | null> {
    const data = readStorageData();
    const user = data.users.find((entry) => entry.email === credentials.email);

    if (!user) {
      return null;
    }

    const passwordMatches = await verifyPassword(credentials.password, { salt: user.passwordSalt, hash: user.passwordHash });
    if (!passwordMatches) {
      return null;
    }

    await this.persistSession(user.id);
    return toPublicUser(user);
  }

  async signup(credentials: SignupCredentials): Promise<User> {
    const data = readStorageData();
    const exists = data.users.some((entry) => entry.email === credentials.email);

    if (exists) {
      throw new Error('An account with that email already exists.');
    }

    const { salt, hash } = await hashPassword(credentials.password);
    const user: User = {
      id: crypto.randomUUID(),
      email: credentials.email,
      name: credentials.name,
      createdAt: new Date().toISOString(),
    };

    data.users.push({
      id: user.id,
      email: user.email,
      passwordHash: hash,
      passwordSalt: salt,
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

  async getCurrentUser(): Promise<User | null> {
    const data = readStorageData();
    const userId = data.auth.currentUserId;
    if (!userId) {
      return null;
    }

    const user = data.users.find((entry) => entry.id === userId);
    return user ? toPublicUser(user) : null;
  }

  async persistSession(userId: string | null): Promise<void> {
    const data = readStorageData();
    data.auth.currentUserId = userId;
    writeStorageData(data);
  }
}
