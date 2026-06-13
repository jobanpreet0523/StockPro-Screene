import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './useNSEProxy';

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export function useMarketNews() {
  return useQuery({
    queryKey: ['news'],
    queryFn: ({ signal }) => apiFetch<{ status: string; source: string; data: NewsItem[] }>('/api/news', { signal }),
    refetchInterval: 5 * 60_000,
    staleTime: 2 * 60_000,
    retry: 2,
  });
}
