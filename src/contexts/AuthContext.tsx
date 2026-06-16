import React, { createContext, useContext, useEffect, useState } from 'react';
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
  isPro: false,
  setProStatus: () => {},
  loginWithGoogle: async () => {},
  logout: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    // Check localStorage for pro status
    const savedProStatus = localStorage.getItem('isPro');
    if (savedProStatus === 'true') {
      setIsPro(true);
    }
  }, []);

  const setProStatus = (status: boolean) => {
    setIsPro(status);
    localStorage.setItem('isPro', status.toString());
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
    } catch (error) {
      console.error("Failed to sign out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isPro, setProStatus, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
