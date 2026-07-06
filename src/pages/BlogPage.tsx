import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CalendarDays, LineChart, Mail, Search, ShieldCheck, Target, TrendingUp } from 'lucide-react';
import BlogView from '../components/BlogView';
import LiveMarketReads from '../components/LiveMarketReads';

const clusters = [
  { title: 'Nifty screener hub', text: 'Route visitors from search content into the live screener workflow.', to: '/screener', icon: Search },
  { title: 'Option chain education', text: 'Teach option-chain reading, then link users into the option workspace.', to: '/option-chain', icon: LineChart },
  { title: 'Risk and position sizing', text: 'Build trust through educational risk tools before any upgrade pitch.', to: '/risk-calculator', icon: ShieldCheck },
  { title: 'Market habit loop', text: 'Send users toward daily briefing, signals, watchlist, and repeat usage.', to: '/signals', icon: Target },
];

export default function BlogPage() {
  return (
    <div className="lg:col-span-12 flex flex-col gap-6" id="blog-section">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
              <TrendingUp size={13} /> Stage 4 growth hub
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white md:text-4xl">
              Search-friendly education that sends users back into StockPro tools.
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
              The blog is now the organic growth layer: beginner education, internal links, product routes, newsletter capture, and trust-first explanations that make people return to the screener.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300"><Mail size={13} /> Newsletter funnel</div>
            <p className="mt-2 text-xs font-bold leading-5 text-emerald-800 dark:text-emerald-200">Use educational traffic to collect waitlist demand for Pro features.</p>
            <Link to="/contact?interest=newsletter" className="mt-3 inline-flex rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-400">Join updates</Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {clusters.map((cluster) => {
            const Icon = cluster.icon;
            return (
              <Link key={cluster.title} to={cluster.to} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900">
                <Icon size={18} className="text-emerald-600 dark:text-emerald-400" />
                <div className="mt-3 text-sm font-black text-slate-950 dark:text-white">{cluster.title}</div>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{cluster.text}</p>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/60">
            <BookOpen size={18} className="text-blue-500" />
            <h3 className="mt-3 text-sm font-black text-slate-950 dark:text-white">SEO content engine</h3>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">Publish searchable guides around screeners, option-chain basics, risk, and watchlist routines.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/60">
            <CalendarDays size={18} className="text-emerald-500" />
            <h3 className="mt-3 text-sm font-black text-slate-950 dark:text-white">Weekly publishing loop</h3>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">Add one useful guide every week and link it to a working product page.</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
            <ShieldCheck size={18} className="text-amber-600 dark:text-amber-300" />
            <h3 className="mt-3 text-sm font-black text-amber-900 dark:text-amber-200">Trust-first disclaimer</h3>
            <p className="mt-1 text-xs font-semibold leading-5 text-amber-800 dark:text-amber-300">Keep content educational and avoid promising outcomes or personalized recommendations.</p>
          </div>
        </div>
      </section>

      <LiveMarketReads />

      <BlogView />
    </div>
  );
}
