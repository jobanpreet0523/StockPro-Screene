import React from 'react';
import { AlertTriangle, Clock3, ShieldCheck } from 'lucide-react';

export default function TrustDataBanner() {
  return (
    <section className="max-w-7xl mx-auto w-full px-4 pt-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-3 text-amber-900 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-white/70 p-2 dark:bg-slate-950/50">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em]">Educational analytics only</p>
            <p className="mt-1 text-xs font-semibold leading-5">
              StockPro is not SEBI-registered investment advice. Free mode shows 15-minute delayed market data.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 dark:bg-slate-950/50">
            <Clock3 size={12} /> 15-min delayed
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 dark:bg-slate-950/50">
            <AlertTriangle size={12} /> Risk disclosure applies
          </span>
        </div>
      </div>
    </section>
  );
}
