import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/Header';
import OptionChainPage from './pages/OptionChainPage';
import ScreenerPage from './pages/ScreenerPage';
import NewsPage from './pages/NewsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 text-white">
          <Header />
          <Routes>
            <Route path="/" element={<OptionChainPage />} />
            <Route path="/option-chain" element={<OptionChainPage />} />
            <Route path="/screener" element={<ScreenerPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
