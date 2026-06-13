import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './useNSEProxy';

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  sector: string;
  open: number;
  high: number;
  low: number;
  close: number;
  exchange: string;
  isFoEnabled: boolean;
  buildup?: string;
}

export function useLiveStocks() {
  return useQuery({
    queryKey: ['stocks'],
    queryFn: ({ signal }) => apiFetch<{ status: string; source: string; count: number; data: StockQuote[] }>('/api/stocks', { signal }),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 3,
  });
}
