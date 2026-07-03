import React from 'react';
import { motion } from 'motion/react';
import { Activity, ArrowUpRight, Gauge, LineChart, Radar, Sparkles, Zap } from 'lucide-react';
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
    transition: { delay: 0.08 * index, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function MarketPulseHero({ indices, stocks, activeTab, setActiveTab, isLoadingStocks }: MarketPulseHeroProps) {
  const gainers = stocks.filter(stock => (stock.change ?? 0) >= 0).length;
  const losers = Math.max(stocks.length - gainers, 0);
  const breadth = stocks.length ? Math.round((gainers / stocks.length) * 100) : 0;
  const leadIndex = indices[0];
  const foCount = stocks.filter(stock => stock.isFoEnabled).length;
  const activeLabel = activeTab.replace(/-/g, ' ').replace('fo', 'option chain').toUpperCase();

  const metrics = [
    {
      label: 'Live Sync',
      value: isLoadingStocks ? 'Syncing' : `${stocks.length || 0}`,
      helper: 'NSE/BSE instruments',
      icon: Activity,
      accent: 'emerald',
    },
    {
      label: 'Market Breadth',
      value: `${breadth}%`,
      helper: `${gainers} advancers · ${losers} decliners`,
      icon: Gauge,
      accent: 'sky',
    },
    {
      label: 'F&O Universe',
      value: `${foCount}`,
      helper: 'option-enabled stocks',
      icon: Radar,
      accent: 'violet',
    },
    {
      label: 'Active Desk',
      value: activeLabel,
      helper: leadIndex ? `${leadIndex.name} ${leadIndex.change >= 0 ? '+' : ''}${leadIndex.changePercent}%` : 'Ready for analysis',
      icon: LineChart,
      accent: 'amber',
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="premium-surface relative overflow-hidden rounded-[1.75rem] border border-white/70 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/80 p-5 sm:p-6 shadow-2xl shadow-slate-200/70 dark:shadow-emerald-950/20 mb-6"
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
            transition={{ delay: 0.15, duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50/90 dark:bg-emerald-950/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Premium trading workspace
          </motion.div>

          <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white sm:text-4xl lg:text-5xl">
            Faster market scanning with a cinematic analytics cockpit.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            Upgraded UI layer for smarter first-glance decisions: live breadth, animated option intelligence, cleaner action hierarchy, and reduced visual clutter.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <motion.button
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('chartink')}
              className="glass-button inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-slate-950/20 dark:bg-white dark:text-slate-950"
            >
              <Zap size={16} /> Run Smart Scanner
            </motion.button>
            <motion.button
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('signals')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm font-black text-slate-800 shadow-sm backdrop-blur hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-emerald-500/40 dark:hover:text-emerald-300"
            >
              <Sparkles size={16} /> View Signals
            </motion.button>
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
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                    <Icon size={17} />
                  </div>
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
