import React from 'react';
import { motion } from 'motion/react';
import { BookmarkPlus, Crown, Search, ShieldCheck, Sparkles, Target } from 'lucide-react';
import type { DashboardTab } from './Layout';

interface ProductGrowthPanelProps {
  setActiveTab: (tab: DashboardTab) => void;
}

const steps = [
  { title: 'Explore markets', text: 'Review indices, movers, and sector context.', icon: Search, tab: 'screener' as DashboardTab },
  { title: 'Build watchlist', text: 'Save focused symbols for daily review.', icon: BookmarkPlus, tab: 'screener' as DashboardTab },
  { title: 'Run screens', text: 'Filter with volume, RSI, price action, and F&O status.', icon: Target, tab: 'chartink' as DashboardTab },
  { title: 'Upgrade path', text: 'Pro workspace will add saved screens, alerts, and exports.', icon: Crown, tab: 'pricing' as DashboardTab },
];

export default function ProductGrowthPanel({ setActiveTab }: ProductGrowthPanelProps) {
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]" id="product_growth_panel">
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"><Sparkles size={13} /> Product workflow</div>
        <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">Built for a daily market research habit.</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">StockPro should guide visitors from market overview to focused screening, watchlists, and a clear upgrade path.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <button key={step.title} onClick={() => setActiveTab(step.tab)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900">
                <Icon size={17} className="mb-3 text-emerald-600 dark:text-emerald-400" />
                <div className="text-sm font-black text-slate-950 dark:text-white">{step.title}</div>
                <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500 dark:text-slate-400">{step.text}</p>
              </button>
            );
          })}
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm dark:border-slate-800">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300"><ShieldCheck size={14} /> Trust layer</div>
        <h3 className="mt-3 text-2xl font-black tracking-[-0.03em]">Clear, honest positioning</h3>
        <div className="mt-4 grid gap-2 text-xs font-bold text-slate-200">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">Authorized provider data when configured</div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">Educational analytics and research tools</div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">Watchlists, screens, alerts, and exports roadmap</div>
        </div>
      </div>
    </motion.section>
  );
}
