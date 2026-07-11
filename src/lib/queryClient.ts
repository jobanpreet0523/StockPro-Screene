import { focusManager, QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchInterval: false,
    },
    mutations: {
      retry: false,
    },
  },
});

if (typeof document !== 'undefined') {
  focusManager.setEventListener((setFocused) => {
    const onVisibilityChange = () => setFocused(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibilityChange, false);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  });
}
