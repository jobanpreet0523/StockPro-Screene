import React from 'react';
import { motion } from 'motion/react';
import { Activity, ArrowUpRight, Bell, BookmarkPlus, Crown, Gauge, LineChart, Radar, Search, ShieldCheck, Sparkles, Target, Zap } from 'lucide-react';
import { IndexData, Stock } from '../types';
import type { DashboardTab } from './Layout';

interface MarketPulseHeroProps {
  indices: IndexData[];
  stocks: Stock[];
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  isLoadingStocks: boolean;
}

const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: 0.08 * index, duration: 0.45 },
  }),
};

const workflow = [
  { title: 'Explore', text: 'Indices, movers, sectors', icon: Search, tab: 'screener' as DashboardTab },
  { title: 'Watchlist', text: 'Follow focused symbols', icon: BookmarkPlus, tab: 'screener' as DashboardTab },
  { title: 'Screen', text: 'RSI, volume, F&O filters', icon: Target, tab: 'chartink' as DashboardTab },
  { title: 'Upgrade', text: 'Saved views and alerts', icon: Crown, tab: 'pricing' as DashboardTab },
];

export default function MarketPulseHero({ indices, stocks, activeTab, setActiveTab, isLoadingStocks }: MarketPulseHeroProps) {
  const gainers = stocks.filter(stock => (stock.change ?? 0) >= 0).length;
  const losers = Math.max(stocks.length - gainers, 0);
  const breadth = stocks.length ? Math.round((gainers / stocks.length) * 100) : 0;
  const leadIndex = indices[0];
  const foCount = stocks.filter(stock => stock.isFoEnabled).length;
  const activeLabel = activeTab.replace(/-/g, ' ').replace('fo', 'option chain').toUpperCase();

  const metrics = [
    { label: 'Data Universe', value: isLoadingStocks ? 'Syncing' : `${stocks.length || 0}`, helper: 'delayed/cached instruments', icon: Activity },
    { label: 'Market Breadth', value: `${breadth}%`, helper: `${gainers} advancers · ${losers} decliners`, icon: Gauge },
    { label: 'F&O Desk', value: `${foCount}`, helper: 'option-enabled stocks', icon: Radar },
    { label: 'Active Workspace', value: activeLabel, helper: leadIndex ? `${leadIndex.name} ${leadIndex.change >= 0 ? '+' : ''}${leadIndex.changePercent}%` : 'Ready for research', icon: LineChart },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="premium-surface relative overflow-hidden rounded-[1.75rem] border border-white/70 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/80 p-5 sm:p-6 shadow-2xl shadow-slate-200/70 dark:shadow-emerald-950/20 mb-6"
      id="premium_market_command_center"
    >
      <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl animate-float-slow" />
      <div className="absolute -bottom-28 -left-14 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl animate-float-slow animation-delay-1000" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] dark:opacity-[0.12] premium-grid" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px shimmer-line" />

      <div className="relative z-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50/90 dark:bg-emerald-950/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            India-first market research workspace
          </motion.div>

          <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white sm:text-4xl lg:text-5xl">
            Turn market noise into a focused daily research workflow.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            StockPro combines delayed market dashboards, smart screeners, watchlists, F&O context, calculators, and education so visitors have a reason to return every trading day.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <motion.button
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('chartink')}
              className="glass-button inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-slate-950/20 dark:bg-white dark:text-slate-950"
            >
              <Zap size={16} /> Run market screen
            </motion.button>
            <motion.button
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('pricing')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm font-black text-slate-800 shadow-sm backdrop-blur hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-emerald-500/40 dark:hover:text-emerald-300"
            >
              <Crown size={16} /> See Pro plans
            </motion.button>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-4">
            {workflow.map((step) => {
              const Icon = step.icon;
              return (
                <button key={step.title} onClick={() => setActiveTab(step.tab)} className="rounded-2xl border border-slate-200 bg-white/70 p-3 text-left transition hover:border-emerald-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-emerald-700">
                  <Icon size={15} className="text-emerald-600 dark:text-emerald-400" />
                  <div className="mt-2 text-xs font-black text-slate-950 dark:text-white">{step.title}</div>
                  <div className="mt-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">{step.text}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/40"><ShieldCheck size={12} /> Educational analytics</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-900/40"><Bell size={12} /> Alerts roadmap</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.label}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -6, scale: 1.015 }}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-xl transition-colors hover:border-emerald-300 dark:border-slate-800/80 dark:bg-slate-900/70 dark:hover:border-emerald-500/40"
              >
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 opacity-0 transition group-hover:opacity-100" />
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"><Icon size={17} /></div>
                  <ArrowUpRight size={15} className="text-slate-300 transition group-hover:text-emerald-500" />
                </div>
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{metric.label}</p>
                <p className="mt-1 truncate text-xl font-black text-slate-950 dark:text-white">{metric.value}</p>
                <p className="mt-1 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{metric.helper}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
