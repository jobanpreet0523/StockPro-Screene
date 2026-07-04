import React from 'react';
import { AlertTriangle } from 'lucide-react';

const risks = [
  'Equity, futures, and options trading can result in substantial loss of capital.',
  'Options can expire worthless and leveraged products may move rapidly against a trader.',
  'Market data may be delayed, estimated, incomplete, cached, or unavailable during outages.',
  'Indicators such as PCR, OI buildup, IV rank, max pain, support, and resistance are analytical tools, not buy/sell signals.',
  'Backtested, simulated, fallback, or derived data may not match live exchange execution conditions.',
  'Always verify important data through official exchange, broker, or qualified advisor sources before acting.'
];

export default function RiskDisclosurePage() {
  return (
    <div className="lg:col-span-12">
      <section className="rounded-3xl border border-amber-200 bg-white/90 p-6 shadow-sm dark:border-amber-900/50 dark:bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-500">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-600 dark:text-amber-400">Mandatory risk information</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Risk Disclosure</h1>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Read before using market analytics or derivatives tools.</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
          StockPro is not a SEBI registered investment advisor. Nothing on this website is investment advice, a trading recommendation, or a promise of returns.
        </div>

        <div className="mt-6 grid gap-3">
          {risks.map((risk) => (
            <div key={risk} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs font-semibold leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
              {risk}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
