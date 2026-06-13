import { useQuery, UseQueryOptions } from '@tanstack/react-query';

const API_BASE = '';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...init, signal: init?.signal });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  const json = await res.json();
  if (json.status === 'error') throw new Error(json.message || 'API error');
  return json;
}

// Shared query options for market-hours-aware refetching
export function marketQueryOptions<T>(queryKey: string[], path: string, options?: Partial<UseQueryOptions>) {
  return {
    queryKey,
    queryFn: ({ signal }: { signal: AbortSignal }) => apiFetch<T>(path, { signal }),
    refetchInterval: 60_000, // 60s during market hours
    staleTime: 30_000,
    retry: 3,
    retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000),
    ...options,
  } as UseQueryOptions<T>;
}
