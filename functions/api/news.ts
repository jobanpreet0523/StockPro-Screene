// Cloudflare Worker Function: /api/news
// Fetches real Indian market news from RSS feeds

interface Env {}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const feeds = [
    {
      url: 'https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms',
      defaultSource: 'Economic Times',
    },
    {
      url: 'https://www.moneycontrol.com/rss/latestnews.xml',
      defaultSource: 'Moneycontrol',
    },
    {
      url: 'https://news.google.com/rss/search?q=NSE+NIFTY+stock+market+india&hl=en-IN&gl=IN&ceid=IN:en',
      defaultSource: 'Google News',
    },
  ];

  for (const feed of feeds) {
    try {
      const rssUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&count=15`;
      const res = await fetch(rssUrl, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) continue;
      const json: any = await res.json();

      if (json?.status === 'ok' && Array.isArray(json.items) && json.items.length > 0) {
        const articles = json.items.slice(0, 15).map((item: any) => {
          let src = feed.defaultSource;
          if (item.author) src = item.author;
          else if (item.source && typeof item.source === 'string') src = item.source;
          else if (item.source?.title) src = item.source.title;
          else if (feed.defaultSource === 'Google News' && item.title?.includes(' - ')) {
            const parts = item.title.split(' - ');
            src = parts[parts.length - 1].trim();
          }

          let cleanTitle = item.title || '';
          if (feed.defaultSource === 'Google News' && cleanTitle.includes(' - ')) {
            cleanTitle = cleanTitle.substring(0, cleanTitle.lastIndexOf(' - ')).trim();
          }
          cleanTitle = cleanTitle.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

          let dateStr = new Date().toISOString();
          try { if (item.pubDate) dateStr = new Date(item.pubDate).toISOString(); } catch (e) {}

          return { title: cleanTitle, link: item.link || '#', pubDate: dateStr, source: src };
        });

        return new Response(JSON.stringify({
          status: 'ok',
          timestamp: Date.now(),
          source: feed.defaultSource,
          data: articles,
        }), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120' },
        });
      }
    } catch (e) {
      continue;
    }
  }

  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: Date.now(),
    source: 'fallback',
    data: [],
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
