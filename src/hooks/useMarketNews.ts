import { useState, useEffect, useCallback } from 'react';

export interface MarketNewsItem {
  title: string;
  link: string;
  time: string;
  source: string;
  pubDate: string;
  imageUrl?: string;
  description?: string;
}

function parseArticleDate(value: string) {
  if (/^\d{14}$/.test(value)) {
    return new Date(`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(8, 10)}:${value.slice(10, 12)}:${value.slice(12, 14)}Z`).toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function liveArticleUrl() {
  const params = new URLSearchParams({
    query: 'India business finance market',
    mode: 'ArtList',
    format: 'json',
    maxrecords: '18',
    sort: 'DateDesc',
    timespan: '48h',
  });
  return `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`;
}

export function useMarketNews() {
  const [articles, setArticles] = useState<MarketNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(liveArticleUrl(), { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error('Live article feed failed');
      const json = await res.json();
      const raw = Array.isArray(json?.articles) ? json.articles : [];
      const seen = new Set<string>();

      const parsed = raw
        .map((item: any) => {
          const pubDate = parseArticleDate(String(item.seendate || ''));
          const title = String(item.title || '').replace(/\s+/g, ' ').trim();
          return {
            title,
            link: String(item.url || ''),
            time: new Date(pubDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
            source: String(item.domain || 'Live source'),
            pubDate,
            imageUrl: String(item.socialimage || ''),
            description: title,
          };
        })
        .filter((item: MarketNewsItem) => item.title && item.link && item.imageUrl)
        .filter((item: MarketNewsItem) => {
          if (seen.has(item.link)) return false;
          seen.add(item.link);
          return true;
        })
        .slice(0, 12);

      if (parsed.length === 0) throw new Error('No image-backed live articles returned right now');
      setArticles(parsed);
      setError(null);
    } catch (err: any) {
      setArticles([]);
      setError(err.message || 'Failed to fetch live article feed');
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
