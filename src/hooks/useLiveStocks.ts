import { useCallback, useEffect, useState } from 'react';
import type { Stock } from '../types';
import type { MarketDataStatus, MarketQuote } from '../core/marketDataProvider';
import { fetchMarketData } from '../core/marketDataClient';

export function useLiveStocks() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<MarketDataStatus | null>(null);

  const fetchLiveStocks = useCallback(async (isManual = false) => {
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
      console.warn('fetchLiveStocks unavailable:', err);
      setError(err.message || 'Market stock data is unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;
    const poll = () => {
      if (stopped) return;
      if (!document.hidden) void fetchLiveStocks();
      timer = window.setTimeout(poll, 15_000);
    };
    const onVisibility = () => {
      if (!document.hidden) void fetchLiveStocks();
    };
    void fetchLiveStocks();
    timer = window.setTimeout(poll, 15_000);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchLiveStocks]);

  return { stocks, loading, error, providerStatus, retry: () => fetchLiveStocks(true) };
}
