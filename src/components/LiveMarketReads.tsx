import { ArrowUpRight, CalendarDays, Clock, ImageOff, Newspaper, RefreshCw, ShieldCheck } from 'lucide-react';
import { useMarketNews } from '../hooks/useMarketNews';

function formatArticleDate(pubDate: string) {
  const date = new Date(pubDate);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

interface LiveMarketReadsProps {
  landing?: boolean;
}

export default function LiveMarketReads({ landing = false }: LiveMarketReadsProps) {
  const { articles, loading, error, retry } = useMarketNews();
  const liveReads = articles.slice(0, 6);

  return (
    <section
      className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80"
      aria-labelledby="live-market-reads-title"
    >
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 dark:border-slate-850 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
            <Newspaper size={13} /> Live source feed
          </div>
          <h2 id="live-market-reads-title" className="mt-3 text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">
            Live Market Reads
          </h2>
          <p className="mt-2 max-w-2xl text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">
            Current image-backed market coverage from original publishers for educational context, not investment advice.
          </p>
        </div>
        <button
          type="button"
          onClick={retry}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-700 transition hover:border-emerald-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing' : 'Refresh reads'}
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 pt-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading live market reads">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="h-40 animate-pulse bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-3 p-4">
                <div className="h-3 w-2/5 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900/50 dark:bg-amber-950/20">
          <ImageOff size={24} className="mx-auto text-amber-600 dark:text-amber-300" />
          <h3 className="mt-3 text-sm font-black text-amber-900 dark:text-amber-200">Live image-backed reads are unavailable right now.</h3>
          <p className="mt-2 text-xs font-semibold leading-5 text-amber-800 dark:text-amber-300">{error}</p>
          <button type="button" onClick={retry} className="mt-4 rounded-xl bg-amber-600 px-4 py-2 text-xs font-black text-white transition hover:bg-amber-500">
            Try live feed again
          </button>
        </div>
      ) : liveReads.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <ImageOff size={24} className="mx-auto text-slate-400" />
          <h3 className="mt-3 text-sm font-black text-slate-800 dark:text-slate-100">No live image-backed articles are available.</h3>
          <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">The education library below remains available while the live feed refreshes.</p>
        </div>
      ) : (
        <div className="grid gap-4 pt-5 md:grid-cols-2 xl:grid-cols-3">
          {liveReads.map((article) => (
            <a
              key={article.link}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer nofollow"
              data-analytics-event="news_article_click"
              data-analytics-label={`${article.source}: ${article.title}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-white hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900"
            >
              <img
                src={article.imageUrl}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                className={`${landing ? 'h-56' : 'h-40'} w-full bg-slate-200 object-cover dark:bg-slate-800`}
              />
              <div className="p-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300"><ShieldCheck size={11} /> {article.source}</span>
                  <span className="inline-flex items-center gap-1"><Clock size={11} /> {article.time}</span>
                  <span className="inline-flex items-center gap-1"><CalendarDays size={11} /> {formatArticleDate(article.pubDate)}</span>
                </div>
                <h3 className="mt-3 line-clamp-3 text-sm font-black leading-6 text-slate-900 transition group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">
                  {article.title}
                </h3>
                <div className="mt-4 inline-flex items-center gap-1 text-xs font-black text-slate-600 transition group-hover:text-emerald-700 dark:text-slate-300 dark:group-hover:text-emerald-300">
                  Read original source <ArrowUpRight size={13} />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
