import { useQuery } from '@tanstack/react-query';
import { readApi } from '../core/apiClient';
import { authenticatedFetch } from '../core/supabaseClient';

export function useProDashboard() {
  return useQuery({
    queryKey: ['pro-dashboard'],
    queryFn: async () => {
      const [readiness, market, indices, broker, trial, billing, watchlists] = await Promise.all([
        readApi('/api/pro/readiness'),
        readApi('/api/live/health'),
        readApi('/api/live/indices'),
        readApi('/api/broker/status'),
        readApi('/api/trial/status'),
        readApi('/api/billing/readiness'),
        readApi('/api/watchlists', {}, authenticatedFetch),
      ]);
      return { readiness, market, indices, broker, trial, billing, watchlists };
    },
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
}
