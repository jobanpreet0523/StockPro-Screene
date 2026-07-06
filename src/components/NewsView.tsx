import React, { useState } from 'react';
import { Newspaper, RefreshCw, Search, ArrowUpRight, Clock, Globe } from 'lucide-react';
import { useMarketNews } from '../hooks/useMarketNews';
import AdSlot from './AdSlot';

export default function NewsView() {
  const { articles, loading, error, retry: fetchNews } = useMarketNews();
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredArticles = articles.filter(art =>
    art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    art.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatRelativeTime = (isoString: string) => {
    try {
      const parsedDate = new Date(isoString);
      const diffMs = Date.now() - parsedDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return parsedDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return 'Today';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm dark:shadow-2xl flex flex-col p-6 w-full" id="news-matrix">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-5 mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-lg shrink-0 border border-emerald-500/20">
            <Newspaper size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider font-sans">
              Stock Market Daily News
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Current market articles with source links and images when available
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-60">
            <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search active news..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8.5 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/50 text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          <button
            onClick={fetchNews}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-750 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-800 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Updating...' : 'Reload Feed'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="text-emerald-500 animate-spin" size={32} />
          <p className="text-xs text-slate-500 font-mono tracking-wider animate-pulse">
            Loading current market articles...
          </p>
        </div>
      ) : error ? (
        <div className="bg-rose-500/5 border border-rose-500/10 p-5 rounded-xl text-center py-8">
          <p className="text-xs text-rose-500 dark:text-rose-450 font-semibold">{error}</p>
          <button
            onClick={fetchNews}
            className="mt-3 px-4 py-1.5 bg-rose-500 text-white rounded text-xs font-bold hover:bg-rose-600 transition"
          >
            Retry Connection Now
          </button>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-16 text-slate-500 dark:text-slate-450 font-mono text-xs">
          No articles matching "{searchTerm}" found. Try another query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredArticles.map((art, idx) => (
            <React.Fragment key={art.link || `${art.title}-${idx}`}>
            <a
              href={art.link}
              target="_blank"
              rel="noopener noreferrer nofollow"
              data-analytics-event="news_article_click"
              data-analytics-label={`${art.source}: ${art.title}`}
              className="group bg-slate-50 hover:bg-white dark:bg-slate-900/40 dark:hover:bg-slate-900/90 border border-slate-100 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-750 p-4 rounded-xl shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-4 cursor-pointer text-inherit decoration-none"
            >
              <div className="flex flex-col gap-2">
                {art.imageUrl && (
                  <img 
                    src={art.imageUrl} 
                    alt={art.title} 
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-32 object-cover rounded-lg bg-slate-200 dark:bg-slate-900"
                  />
                )}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-450">
                  <span className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800 border border-slate-200/25 dark:border-slate-750 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-slate-650 dark:text-slate-300">
                    <Globe size={10} className="text-emerald-500" />
                    {art.source}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {formatRelativeTime(art.pubDate)}
                  </span>
                </div>
                <h3 className="text-xs md:text-sm font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-3 leading-relaxed">
                  {art.title}
                </h3>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-505 dark:text-slate-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition duration-300 mt-auto border-t border-slate-100/50 dark:border-slate-850/60 pt-2.5">
                <span>Open Article</span>
                <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition duration-300" />
              </div>
            </a>
            {idx === 2 && <AdSlot size="in_feed" label="Sponsored" className="md:col-span-2" />}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
