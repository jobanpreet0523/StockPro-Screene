import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './useNSEProxy';

export interface IndexQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sparkline: number[];
  isPositive: boolean;
}

export function useMarketIndices() {
  return useQuery({
    queryKey: ['indices'],
    queryFn: ({ signal }) => apiFetch<{ status: string; source: string; data: IndexQuote[] }>('/api/indices', { signal }),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 3,
  });
}
