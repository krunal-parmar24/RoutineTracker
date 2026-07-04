export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export interface AuthSession {
  userId: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  name?: string;
}
