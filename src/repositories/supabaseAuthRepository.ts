import { getSupabaseClient } from '../integrations/supabaseClient';
import type { AuthSession, LoginCredentials, SignupCredentials, User } from '../types/auth';
import type { AuthRepository } from './authRepository';

export class SupabaseAuthRepository implements AuthRepository {
  async login(credentials: LoginCredentials): Promise<User | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error || !data.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email ?? credentials.email,
      name: data.user.user_metadata?.name ?? undefined,
      createdAt: data.user.created_at,
    };
  }

  async signup(credentials: SignupCredentials): Promise<User> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          name: credentials.name ?? '',
        },
      },
    });

    if (error || !data.user) {
      throw new Error(error?.message ?? 'Unable to create account.');
    }

    return {
      id: data.user.id,
      email: data.user.email ?? credentials.email,
      name: data.user.user_metadata?.name ?? credentials.name,
      createdAt: data.user.created_at,
    };
  }

  async logout(): Promise<void> {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  }

  async getSession(): Promise<AuthSession> {
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getSession();
    return { userId: data.session?.user.id ?? null };
  }

  async persistSession(userId: string | null): Promise<void> {
    const supabase = getSupabaseClient();
    if (!userId) {
      await supabase.auth.signOut();
      return;
    }

    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw new Error('Supabase session is not available.');
    }
  }
}
