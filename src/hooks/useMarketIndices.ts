import { useState, useEffect } from 'react';
import { IndexData } from '../types';
import { INITIAL_INDICES } from '../data';

const API_BASE = ''; // Same origin — Cloudflare Worker Functions handle /api/*

export function useMarketIndices() {
  const [indices, setIndices] = useState<IndexData[]>(INITIAL_INDICES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIndices = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/indices`, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error('API fetch failed');
      const json = await res.json();

      if (json.data && json.data.length > 0) {
        setIndices(json.data);
        setError(null);
      } else {
        throw new Error('Empty data from API');
      }
    } catch (err: any) {
      console.error('fetchIndices error:', err);
      setError(err.message || 'Failed to fetch indices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  return { indices, loading, error, retry: fetchIndices };
}
