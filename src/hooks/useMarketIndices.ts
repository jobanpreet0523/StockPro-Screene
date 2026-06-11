import { useState, useEffect } from 'react';
import { IndexData } from '../types';
import { INITIAL_INDICES } from '../data';

export function useMarketIndices() {
  const [indices, setIndices] = useState<IndexData[]>(INITIAL_INDICES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIndices = async () => {
    try {
      const url = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=^NSEI,^NSEBANK,^CNXIT,USDINR=X,^VIX';
      const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxy);
      if (!res.ok) throw new Error('Failed to fetch from proxy');
      
      const raw = await res.json();
      if (!raw.contents) throw new Error('No contents in response');
      
      const parsed = JSON.parse(raw.contents);
      const quotes = parsed?.quoteResponse?.result || [];
      
      if (quotes.length === 0) throw new Error('Empty quotes array');

      const liveData: IndexData[] = quotes.map((q: any) => {
        let name = q.shortName || q.symbol;
        if (q.symbol === '^NSEI') name = 'NIFTY 50';
        if (q.symbol === '^NSEBANK') name = 'BANK NIFTY';
        if (q.symbol === '^CNXIT') name = 'NIFTY IT';
        if (q.symbol === 'USDINR=X') name = 'USD/INR';
        if (q.symbol === '^VIX') name = 'INDIA VIX';

        return {
          symbol: q.symbol,
          name,
          price: q.regularMarketPrice || 0,
          change: q.regularMarketChange || 0,
          changePercent: q.regularMarketChangePercent || 0,
          sparkline: [
            q.regularMarketPrice * 0.99,
            q.regularMarketPrice * 1.01,
            q.regularMarketPrice * 0.995,
            q.regularMarketPrice
          ],
          isPositive: (q.regularMarketChangePercent || 0) >= 0
        };
      });

      setIndices(liveData);
      setError(null);
    } catch (err: any) {
      console.error('fetchIndices error:', err);
      setError(err.message || 'Failed to fetch indices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, 60000);
    return () => clearInterval(interval);
  }, []);

  return { indices, loading, error, retry: fetchIndices };
}
