import { useState, useEffect, useCallback } from 'react';

export interface MarketNewsItem {
  title: string;
  link: string;
  time: string;
  source: string;
  pubDate: string;
}

const API_BASE = ''; // Same origin — Cloudflare Worker Functions handle /api/*

export function useMarketNews() {
  const [articles, setArticles] = useState<MarketNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/news`, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error('News API failed');
      const json = await res.json();

      if (json.data && json.data.length > 0) {
        const parsed = json.data.map((item: any) => ({
          title: item.title?.trim(),
          link: item.link,
          time: new Date(item.pubDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
          source: item.source,
          pubDate: item.pubDate,
        }));
        setArticles(parsed);
        setError(null);
      } else {
        throw new Error('No news articles returned');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch news feed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  return { articles, loading, error, retry: fetchNews };
}
