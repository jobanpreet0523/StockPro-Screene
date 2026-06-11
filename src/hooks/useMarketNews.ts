import { useState, useEffect, useCallback } from 'react';

export interface MarketNewsItem {
  title: string;
  link: string;
  time: string;
  source: string;
  pubDate: string;
}

export function useMarketNews() {
  const [articles, setArticles] = useState<MarketNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms')}&count=15`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.status === 'ok') {
        const parsed = data.items.map((item: any) => ({
          title: item.title,
          link: item.link,
          time: new Date(item.pubDate).toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit', timeZone:'Asia/Kolkata'}),
          source: 'Economic Times',
          pubDate: item.pubDate
        }));
        setArticles(parsed);
        setError(null);
      } else {
        throw new Error('Failed to load news data');
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
