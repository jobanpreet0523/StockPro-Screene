import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './useNSEProxy';

interface MarketStatusResponse {
  status: string;
  market: 'OPEN' | 'PRE_MARKET' | 'CLOSED';
  ist: string;
}

export function useMarketStatus() {
  return useQuery({
    queryKey: ['marketStatus'],
    queryFn: ({ signal }) => apiFetch<MarketStatusResponse>('/api/market-status', { signal }),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}
