import { useEffect, useState } from 'react';
import type { Stock } from '../types';
import type { MarketDataStatus, MarketQuote } from '../core/marketDataProvider';
import { fetchMarketData } from '../core/marketDataClient';

export function useLiveStocks() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<MarketDataStatus | null>(null);

  const fetchLiveStocks = async (isManual = false) => {
    try {
      if (isManual) setLoading(true);
      const response = await fetchMarketData<MarketQuote[]>('/api/live/stocks', AbortSignal.timeout(15000));
      setProviderStatus(response);

      if (response.status !== 'ok' || !Array.isArray(response.data) || response.data.length === 0) {
        setStocks([]);
        throw new Error(response.message || 'Market stock data is unavailable.');
      }

      setStocks(response.data as Stock[]);
      setError(null);
    } catch (err: any) {
      console.error('fetchLiveStocks error:', err);
      setError(err.message || 'Market stock data is unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStocks();
    const interval = window.setInterval(fetchLiveStocks, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return { stocks, loading, error, providerStatus, retry: () => fetchLiveStocks(true) };
}
