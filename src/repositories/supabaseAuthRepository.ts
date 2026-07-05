import { getSupabaseClient } from '../integrations/supabaseClient';
import type { AuthRepository } from './authRepository';
import type { AuthSession, LoginCredentials, SignupCredentials, User } from '../types/auth';
import { withTimeout } from '../utils/withTimeout';

function toUser(supabaseUser: { id: string; email?: string | null; created_at: string; user_metadata?: Record<string, unknown> }): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    name: typeof supabaseUser.user_metadata?.name === 'string' ? (supabaseUser.user_metadata.name as string) : undefined,
    createdAt: supabaseUser.created_at,
  };
}

export class SupabaseAuthRepository implements AuthRepository {
  async login(credentials: LoginCredentials): Promise<User | null> {
    const { data, error } = await withTimeout(
      getSupabaseClient().auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      }),
    );

    if (error || !data.user) {
      return null;
    }

    return toUser(data.user);
  }

  async signup(credentials: SignupCredentials): Promise<User> {
    const { data, error } = await withTimeout(
      getSupabaseClient().auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: credentials.name ? { data: { name: credentials.name } } : undefined,
      }),
    );

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Sign up did not return a user. Check your Supabase Auth settings.');
    }

    return toUser(data.user);
  }

  async logout(): Promise<void> {
    await withTimeout(getSupabaseClient().auth.signOut());
  }

  async getSession(): Promise<AuthSession> {
    const { data } = await withTimeout(getSupabaseClient().auth.getSession());
    return { userId: data.session?.user.id ?? null };
  }

  async getCurrentUser(): Promise<User | null> {
    const { data } = await withTimeout(getSupabaseClient().auth.getUser());
    return data.user ? toUser(data.user) : null;
  }

  // Session persistence is handled internally by the Supabase client.
  async persistSession(): Promise<void> {
    return Promise.resolve();
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    const {
      data: { subscription },
    } = getSupabaseClient().auth.onAuthStateChange((_event, session) => {
      callback(session?.user ? toUser(session.user) : null);
    });

    return () => subscription.unsubscribe();
  }
}
