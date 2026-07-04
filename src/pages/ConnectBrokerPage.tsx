import React, { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Activity, AlertTriangle, CheckCircle2, KeyRound, Link2, Radio, ShieldCheck, Wifi } from 'lucide-react';
import DataSourceBadge from '../components/DataSourceBadge';
import { clearBrokerConnectionPreview, getMarketDataStatus, saveBrokerConnectionPreview, type BrokerProvider } from '../core/marketData';

const brokers: Array<{
  id: BrokerProvider;
  name: string;
  bestFor: string;
  status: string;
  features: string[];
}> = [
  {
    id: 'upstox',
    name: 'Upstox',
    bestFor: 'Best first choice for option-chain live mode',
    status: 'OAuth/WebSocket relay ready to implement',
    features: ['LTP streaming', 'Option-chain mode', 'Bid/ask', 'Greeks-ready', 'OI-ready'],
  },
  {
    id: 'zerodha',
    name: 'Zerodha Kite',
    bestFor: 'Strong second broker for stable quotes and market depth',
    status: 'OAuth/WebSocket relay planned',
    features: ['LTP streaming', 'Quote mode', 'Full mode', 'Market depth', 'Watchlist-ready'],
  },
];

export default function ConnectBrokerPage() {
  const [selectedBroker, setSelectedBroker] = useState<BrokerProvider | null>(null);
  const status = useMemo(() => getMarketDataStatus(false), [selectedBroker]);

  const selectPreview = (provider: BrokerProvider) => {
    saveBrokerConnectionPreview(provider);
    setSelectedBroker(provider);
  };

  const clearPreview = () => {
    clearBrokerConnectionPreview();
    setSelectedBroker(null);
  };

  return (
    <div className="lg:col-span-12 flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/50">
              <Radio size={13} /> Live data foundation
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white md:text-4xl">
              Connect broker for real-time market data.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Free public mode can use delayed/fallback snapshots. Real-time NSE/F&O ticks should come from a user-authorized broker connection, then flow through a backend WebSocket relay before reaching the dashboard.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <MiniStat icon={Wifi} label="Realtime mode" value="Broker login" />
              <MiniStat icon={ShieldCheck} label="Token safety" value="Backend relay" />
              <MiniStat icon={Activity} label="Fallback" value="Snapshot data" />
            </div>
          </div>

          <DataSourceBadge status={status} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {brokers.map((broker) => (
          <article key={broker.id} className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-950 dark:text-white">{broker.name}</h2>
                <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{broker.bestFor}</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900/50">
                Foundation
              </span>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-200">
                <KeyRound size={15} /> {broker.status}
              </div>
              <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                This button marks the selected broker mode locally for UI/testing. Production OAuth and token exchange must be configured on the backend before using real ticks.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {broker.features.map((feature) => (
                <span key={feature} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  {feature}
                </span>
              ))}
            </div>

            <button
              onClick={() => selectPreview(broker.id)}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-300/60 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] dark:bg-white dark:text-slate-950 dark:shadow-none"
            >
              <Link2 size={16} /> Select {broker.name} live mode
            </button>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" size={20} />
          <div>
            <h3 className="text-sm font-black text-amber-900 dark:text-amber-200">Launch-safe rule</h3>
            <p className="mt-2 text-xs font-semibold leading-6 text-amber-800 dark:text-amber-300">
              Do not label public fallback data as real-time. Show “Delayed Free Data” until a broker OAuth + backend WebSocket relay is live. This protects users and keeps StockPro honest for launch.
            </p>
          </div>
        </div>
      </section>

      {selectedBroker && (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-black">
              <CheckCircle2 size={18} /> {selectedBroker === 'upstox' ? 'Upstox' : 'Zerodha'} mode selected for UI preview.
            </div>
            <button onClick={clearPreview} className="rounded-xl border border-emerald-300 px-3 py-2 text-xs font-black uppercase tracking-widest dark:border-emerald-800">
              Clear preview
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <Icon size={13} /> {label}
      </div>
      <div className="mt-2 text-sm font-black text-slate-950 dark:text-white">{value}</div>
    </div>
  );
}
