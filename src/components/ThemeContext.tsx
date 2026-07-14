import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const GUEST_USER_ID = 'stockpro-free-guest';

const isRealFirebaseUser = (user: ReturnType<typeof useAuth>['user']) => {
  return Boolean(user && user.uid && user.uid !== GUEST_USER_ID && !user.email?.endsWith('@stockpro.local'));
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const canSyncTheme = isRealFirebaseUser(user);
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    return 'dark';
  });

  useEffect(() => {
    if (!canSyncTheme || !user) return;

    const fetchTheme = async () => {
      try {
        const [{ db }, { doc, getDoc }] = await Promise.all([
          import('../lib/firebase'),
          import('firebase/firestore'),
        ]);
        const docRef = doc(db, 'userProfile', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().theme) {
          const remoteTheme = docSnap.data().theme;
          if (remoteTheme === 'light' || remoteTheme === 'dark') {
            setTheme(remoteTheme);
            localStorage.setItem('theme', remoteTheme);
          }
        }
      } catch(e) {
        if (import.meta.env.DEV) console.warn('Theme sync skipped', e);
      }
    };

    fetchTheme();
  }, [canSyncTheme, user]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);

    if (canSyncTheme && user) {
      void Promise.all([import('../lib/firebase'), import('firebase/firestore')])
        .then(([{ db }, { doc, setDoc }]) => setDoc(doc(db, 'userProfile', user.uid), { theme }, { merge: true }))
        .catch((e) => {
          if (import.meta.env.DEV) console.warn('Theme save skipped', e);
        });
    }
  }, [theme, user, canSyncTheme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
