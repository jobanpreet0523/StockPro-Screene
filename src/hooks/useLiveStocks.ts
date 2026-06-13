import { useState, useEffect } from 'react';
import { Stock } from '../types';
import { INITIAL_STOCKS } from '../data';

const API_BASE = ''; // Same origin — Cloudflare Worker Functions handle /api/*

export function useLiveStocks() {
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveStocks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/stocks`, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error('API fetch failed');
      const json = await res.json();

      if (json.data && json.data.length > 0) {
        setStocks(json.data);
        setError(null);
      } else {
        throw new Error('Empty data from API');
      }
    } catch (err: any) {
      console.error('fetchLiveStocks error:', err);
      setError(err.message || 'Failed to fetch live data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStocks();
    const interval = setInterval(fetchLiveStocks, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  return { stocks, loading, error, retry: fetchLiveStocks };
}
