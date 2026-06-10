import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage or default to dark theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    return 'dark'; // High-fidelity dark mode by default
  });

  // Hydrate from Firestore if user logs in
  useEffect(() => {
    if (user) {
      const fetchTheme = async () => {
        try {
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
          console.error("Failed to fetch user theme", e);
        }
      }
      fetchTheme();
    }
  }, [user]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);

    // Sync back up to Firestore
    if (user) {
      setDoc(doc(db, 'userProfile', user.uid), { theme }, { merge: true }).catch(console.error);
    }
  }, [theme, user]);

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
