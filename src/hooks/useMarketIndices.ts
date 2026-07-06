import { useEffect, useState } from 'react';
import type { IndexData } from '../types';
import type { MarketDataStatus, MarketIndex } from '../core/marketDataProvider';
import { fetchMarketData } from '../core/marketDataClient';

export function useMarketIndices() {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<MarketDataStatus | null>(null);

  const fetchIndices = async (isManual = false) => {
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
      console.error('fetchIndices error:', err);
      setError(err.message || 'Market index data is unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndices();
    const interval = window.setInterval(fetchIndices, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return { indices, loading, error, providerStatus, retry: () => fetchIndices(true) };
}
