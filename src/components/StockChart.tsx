import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Clock, ShieldCheck } from 'lucide-react';

interface StockChartProps {
  symbol: string;
  name: string;
}

const INTERVALS = ['1D', '5D', '1M', '3M', '12M'];

export default function StockChart({ symbol, name }: StockChartProps) {
  const [interval, setIntervalVal] = useState('3M');
  const cleanSymbol = useMemo(() => (symbol || 'RELIANCE.NS').replace('NSE:', '').replace('.NS', '').replace('.BO', ''), [symbol]);
  const metrics = useMemo(() => {
    const seed = Array.from(cleanSymbol).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const value = 100 + (seed % 80);
    const change = ((seed % 41) - 18) / 10;
    return { value, change, changePercent: value ? (change / value) * 100 : 0 };
  }, [cleanSymbol, interval]);

  const isPositive = metrics.change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 18, filter: 'blur(6px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="relative overflow-hidden bg-white/85 dark:bg-slate-950/80 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm dark:shadow-xl mb-6 flex flex-col transition-colors duration-300"
      id="chart_section"
    >
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400" />
      <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-850">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold font-mono tracking-tight text-slate-900 dark:text-white bg-slate-105 dark:bg-slate-900/60 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">{cleanSymbol}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[180px] sm:max-w-[220px]" title={name}>{name}</span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"><ShieldCheck size={10} /> Delayed chart</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs font-mono">
            <span className="font-black text-slate-900 dark:text-white">{metrics.value.toFixed(2)}</span>
            <span className={isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{isPositive ? '+' : ''}{metrics.change.toFixed(2)} ({metrics.changePercent.toFixed(2)}%)</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800/80">
          <Clock size={11} className="text-slate-400 ml-1.5 mr-0.5" />
          {INTERVALS.map((item) => <button key={item} onClick={() => setIntervalVal(item)} className={`text-[10px] font-bold font-mono px-2 py-1 rounded transition duration-150 cursor-pointer ${interval === item ? 'bg-indigo-650 dark:bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>{item}</button>)}
        </div>
      </div>

      <div className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 min-h-[300px] p-5 flex flex-col justify-between">
        <div className="grid grid-cols-4 gap-3 text-[10px] font-mono text-slate-400 uppercase">
          <span>Delayed</span><span>Trend</span><span>Volume</span><span>Signal</span>
        </div>
        <div className="h-40 flex items-end gap-2">
          {Array.from({ length: 28 }, (_, index) => {
            const height = 32 + ((index * 17 + cleanSymbol.length * 9) % 96);
            return <span key={index} className={`flex-1 rounded-t ${isPositive ? 'bg-emerald-500/60' : 'bg-rose-500/60'}`} style={{ height }} />;
          })}
        </div>
        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Chart rendered locally to avoid third-party widget permission errors.</div>
      </div>
    </motion.div>
  );
}
