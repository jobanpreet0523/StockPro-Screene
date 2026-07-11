import { useQuery } from '@tanstack/react-query';
import type { IndexData } from '../types';
import type { MarketIndex } from '../core/marketDataProvider';
import { fetchMarketData } from '../core/marketDataClient';

export function useMarketIndices() {
  const query = useQuery({
    queryKey: ['market-indices'],
    queryFn: async ({ signal }) => {
      const response = await fetchMarketData<MarketIndex[]>('/api/live/indices', signal);
      if (response.status !== 'ok' || !Array.isArray(response.data) || response.data.length === 0) {
        throw new Error(response.message || 'Market index data is unavailable.');
      }
      return response;
    },
    refetchInterval: () => document.hidden ? false : 30_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
    retry: 1,
  });

  return {
    indices: (query.data?.data || []) as IndexData[],
    loading: query.isPending,
    error: query.error instanceof Error ? query.error.message : null,
    providerStatus: query.data || null,
    retry: () => query.refetch(),
  };
}
