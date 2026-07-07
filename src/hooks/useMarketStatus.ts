import { useQuery } from '@tanstack/react-query';
import { fetchMarketData } from '../core/marketDataClient';
import type { MarketStatusSnapshot } from '../core/marketDataProvider';

export function useMarketStatus() {
  return useQuery({
    queryKey: ['marketStatus'],
    queryFn: ({ signal }) => fetchMarketData<MarketStatusSnapshot>('/api/live/market-status', signal),
    refetchInterval: () => document.hidden ? false : 30_000,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
    retry: 1,
  });
}
