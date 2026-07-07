import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthApiResponse, StockProUser } from '../core/authTypes';

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
  user: null,
  loading: true,
  isPro: true,
  authStatus: 'loading',
  authMessage: 'Checking account status...',
  refreshSession: async () => {},
  setProStatus: () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StockProUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthContextType['authStatus']>('loading');
  const [authMessage, setAuthMessage] = useState('Checking account status...');

  const refreshSession = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/session', { headers: { Accept: 'application/json' } });
      const payload = await response.json().catch(() => ({
        status: 'error',
        user: null,
        message: 'Account session returned an unreadable response.',
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
  };

  useEffect(() => {
    void refreshSession();
  }, []);

  const setProStatus = (_status: boolean) => {
    // Backward compatibility for older components. Stage 18 does not create a paid entitlement.
    setIsPro(true);
  };

  const loginWithGoogle = async () => {
    window.location.href = '/account';
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Keep the browser state honest even if the server-side scaffold is unavailable.
    }
    setUser(null);
    setAuthStatus('unauthenticated');
    setAuthMessage('Signed out locally. No StockPro session is active.');
  };

  return (
    <AuthContext.Provider value={{ user, loading, isPro, authStatus, authMessage, refreshSession, setProStatus, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
