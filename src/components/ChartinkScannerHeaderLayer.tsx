import React, { useState } from 'react';
import { ExternalLink, HelpCircle, MessageSquare, Search, Sparkles, WandSparkles } from 'lucide-react';

export default function ChartinkScannerHeaderLayer() {
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  };

  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950" id="chartink_scanner_header_layer">
      {toast && <div className="fixed right-6 top-24 z-[140] rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-emerald-300 shadow-2xl">{toast}</div>}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">DOJI</h1>
              <span className="text-xs font-bold text-slate-500">by StockPro</span>
              <ExternalLink size={14} className="text-blue-500" />
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Chartink-style technical scan workspace with live StockPro data.</p>
          </div>

          <div className="relative md:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chart Search..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm font-bold outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => notify('Scanner Guide opened')} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200"><HelpCircle size={14} /> Scanner Guide</button>
          <button onClick={() => notify('Scan Examples opened')} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200"><WandSparkles size={14} /> Scan Examples</button>
          <button onClick={() => notify('Feedback captured')} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200"><MessageSquare size={14} /> Feedback</button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-violet-50 px-4 py-3 text-sm font-bold text-violet-700 dark:bg-violet-950/20 dark:text-violet-200">
        <span className="inline-flex items-center gap-2"><Sparkles size={16} /> New LIVE alerts are available in StockPro Free Access.</span>
        <span className="text-xs font-black uppercase tracking-widest">Scanner Guide · Examples · Feedback</span>
      </div>
    </section>
  );
}
