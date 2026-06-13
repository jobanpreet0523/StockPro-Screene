import React from 'react';
import { useMarketNews, NewsItem } from '../hooks/useMarketNews';
import { SkeletonLine } from '../components/SkeletonLoader';

export default function NewsPage() {
  const { data, isLoading, error } = useMarketNews();
  const articles: NewsItem[] = data?.data || [];

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-4">
      <h1 className="text-2xl font-black text-white mb-4">Market News</h1>
      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonLine key={i} height="2.5rem" />)}
        </div>
      )}
      {error && <div className="text-red-400">Failed to load news</div>}
      <div className="flex flex-col gap-2">
        {articles.map((a, i) => (
          <a key={i} href={a.link} target="_blank" rel="noopener noreferrer"
            className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 hover:border-emerald-500/30 transition-colors group">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug">{a.title}</h3>
                <span className="text-[10px] text-slate-500 mt-1 block">{a.source} • {new Date(a.pubDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
