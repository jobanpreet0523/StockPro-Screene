import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import { ThemeProvider } from './components/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { queryClient } from './lib/queryClient';
import './index.css';

const app = (
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
const isLandingRoute = location.pathname === '/' || location.pathname === '/landing';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isLandingRoute ? app : (
      <AuthProvider>
        <ThemeProvider>{app}</ThemeProvider>
      </AuthProvider>
    )}
  </StrictMode>,
);

