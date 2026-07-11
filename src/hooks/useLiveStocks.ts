import { useQuery } from '@tanstack/react-query';
import type { Stock } from '../types';
import type { MarketQuote } from '../core/marketDataProvider';
import { fetchMarketData } from '../core/marketDataClient';

export function useLiveStocks() {
  const query = useQuery({
    queryKey: ['market-stocks'],
    queryFn: async ({ signal }) => {
      const response = await fetchMarketData<MarketQuote[]>('/api/live/stocks', signal);
      if (response.status !== 'ok' || !Array.isArray(response.data) || response.data.length === 0) {
        throw new Error(response.message || 'Market stock data is unavailable.');
      }
      return response;
    },
    refetchInterval: () => document.hidden ? false : 30_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
    retry: 1,
  });

  return {
    stocks: (query.data?.data || []) as Stock[],
    loading: query.isPending,
    error: query.error instanceof Error ? query.error.message : null,
    providerStatus: query.data || null,
    retry: () => query.refetch(),
  };
}
