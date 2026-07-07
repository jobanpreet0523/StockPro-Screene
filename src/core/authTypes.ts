export type AuthStatus = 'unauthenticated' | 'authenticated' | 'setup_required';

export interface StockProUser {
  id: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'user' | 'admin';
}

export interface AuthSession {
  status: AuthStatus;
  user: StockProUser | null;
  expiresAt: string | null;
  provider: 'supabase' | 'none';
  message: string;
}

export interface AuthApiResponse {
  status: AuthStatus | 'ok' | 'error';
  session: AuthSession | null;
  user: StockProUser | null;
  message: string;
}
