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
      const feeds = [
        'https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms',
        'https://www.moneycontrol.com/rss/latestnews.xml',
      ];

      for (const feedUrl of feeds) {
        try {
          const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=15`;
          const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
          const data = await res.json();

          if (data.status === 'ok' && data.items?.length > 0) {
            const source = new URL(feedUrl).hostname.replace('www.', '');
            const parsed = data.items.map((item: any) => ({
              title: item.title?.trim(),
              link: item.link,
              time: new Date(item.pubDate).toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit', timeZone:'Asia/Kolkata'}),
              source,
              pubDate: item.pubDate
            }));
            setArticles(parsed);
            setError(null);
            return;
          }
        } catch {
          continue;
        }
      }

      throw new Error('Failed to load news data');
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
