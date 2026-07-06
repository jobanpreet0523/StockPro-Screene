import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Search, ShieldCheck, TrendingUp } from 'lucide-react';
import NewsView from '../components/NewsView';

export default function DailyBriefPage() {
  return (
    <div className="lg:col-span-12 flex flex-col gap-6" id="daily-brief-section">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
          <TrendingUp size={13} /> Stage 7 daily brief
        </div>
        <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white md:text-4xl">
          Start every market session here.
        </h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
          A daily workflow that combines live image-backed articles, screener entry points, and risk-first reminders.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/screener" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-400">
            Open Screener <Search size={14} />
          </Link>
          <Link to="/contact?interest=daily-brief" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-800 transition hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
            Get Updates <Bell size={14} />
          </Link>
        </div>
      </section>

      <NewsView />

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
          <ShieldCheck size={14} /> Risk-first reminder
        </div>
        <p className="mt-3 text-xs font-bold leading-6 text-amber-800 dark:text-amber-200">
          StockPro is an educational analytics workspace. It does not provide investment advice, guaranteed returns, or personalized recommendations.
        </p>
      </section>
    </div>
  );
}
