import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPro: boolean;
  setProStatus: (status: boolean) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isPro: true,
  setProStatus: () => {},
  loginWithGoogle: async () => {},
  logout: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(true);

  const freeGuestUser = useMemo(() => ({
    uid: 'stockpro-free-guest',
    displayName: 'Free User',
    email: 'free@stockpro.local',
    photoURL: 'https://ui-avatars.com/api/?name=Free+User&color=10b981&background=ecfdf5',
  } as unknown as User), []);

  useEffect(() => {
    // StockPro is now fully free: unlock every former PRO feature by default.
    localStorage.setItem('isPro', 'true');
    setIsPro(true);
  }, []);

  const setProStatus = (_status: boolean) => {
    // Keep backward compatibility with old pricing code, but never lock features again.
    setIsPro(true);
    localStorage.setItem('isPro', 'true');
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Failed to sign in with Google", error);
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Failed to sign out", error);
    }
  };

  const effectiveUser = user || freeGuestUser;

  return (
    <AuthContext.Provider value={{ user: effectiveUser, loading, isPro, setProStatus, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
