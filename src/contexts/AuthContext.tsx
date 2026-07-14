import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthApiResponse, StockProUser } from '../core/authTypes';
import { getSupabaseClient } from '../core/supabaseClient';

interface AuthContextType {
  user: StockProUser | null;
  loading: boolean;
  isPro: boolean;
  authStatus: AuthApiResponse['status'] | 'loading';
  authMessage: string;
  refreshSession: () => Promise<void>;
  setProStatus: (status: boolean) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true, isPro: false, authStatus: 'loading',
  authMessage: 'Checking account status...', refreshSession: async () => {},
  setProStatus: () => {}, loginWithGoogle: async () => {}, logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StockProUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthContextType['authStatus']>('loading');
  const [authMessage, setAuthMessage] = useState('Checking account status...');

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = await getSupabaseClient();
      const token = supabase ? (await supabase.auth.getSession()).data.session?.access_token : '';
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch('/api/auth/session', { headers });
      const payload = await response.json().catch(() => ({
        status: 'error', user: null, message: 'Account session returned an unreadable response.',
      })) as AuthApiResponse;
      setUser(payload.status === 'authenticated' ? payload.user : null);
      setAuthStatus(payload.status);
      setAuthMessage(payload.message || 'Account status checked.');
    } catch {
      setUser(null);
      setAuthStatus('error');
      setAuthMessage('Account session could not be reached. No logged-in user was assumed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    let idleId = 0;
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const initialize = async () => {
      await refreshSession();
      const supabase = await getSupabaseClient();
      if (!active || !supabase) return;
      const { data } = supabase.auth.onAuthStateChange(() => void refreshSession());
      unsubscribe = () => data.subscription.unsubscribe();
    };
    const schedule = () => {
      idleId = idleWindow.requestIdleCallback
        ? idleWindow.requestIdleCallback(() => void initialize(), { timeout: 1_500 })
        : window.setTimeout(() => void initialize(), 250);
    };

    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });

    return () => {
      active = false;
      window.removeEventListener('load', schedule);
      if (idleWindow.cancelIdleCallback) idleWindow.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
      unsubscribe?.();
    };
  }, [refreshSession]);

  const logout = async () => {
    const supabase = await getSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* Local session is already cleared. */ }
    setUser(null);
    setAuthStatus('unauthenticated');
    setAuthMessage('Signed out. No StockPro session is active.');
  };

  return (
    <AuthContext.Provider value={{
      user, loading, isPro: false, authStatus, authMessage, refreshSession,
      setProStatus: () => {},
      loginWithGoogle: async () => { window.location.href = '/login'; },
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
