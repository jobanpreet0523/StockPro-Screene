import { useCallback, useEffect, useState } from 'react';
import type { IndexData } from '../types';
import type { MarketDataStatus, MarketIndex } from '../core/marketDataProvider';
import { fetchMarketData } from '../core/marketDataClient';

export function useMarketIndices() {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<MarketDataStatus | null>(null);

  const fetchIndices = useCallback(async (isManual = false) => {
    try {
      if (isManual) setLoading(true);
      const response = await fetchMarketData<MarketIndex[]>('/api/live/indices', AbortSignal.timeout(15000));
      setProviderStatus(response);

      if (response.status !== 'ok' || !Array.isArray(response.data) || response.data.length === 0) {
        setIndices([]);
        throw new Error(response.message || 'Market index data is unavailable.');
      }

      setIndices(response.data as IndexData[]);
      setError(null);
    } catch (err: any) {
      console.warn('fetchIndices unavailable:', err);
      setError(err.message || 'Market index data is unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;
    const poll = () => {
      if (stopped) return;
      if (!document.hidden) void fetchIndices();
      timer = window.setTimeout(poll, 15_000);
    };
    const onVisibility = () => {
      if (!document.hidden) void fetchIndices();
    };
    void fetchIndices();
    timer = window.setTimeout(poll, 15_000);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchIndices]);

  return { indices, loading, error, providerStatus, retry: () => fetchIndices(true) };
}
