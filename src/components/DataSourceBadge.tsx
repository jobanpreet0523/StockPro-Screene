import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import type { MarketDataStatus } from '../core/marketData';
import { DATA_SOURCE_HELP } from '../core/marketData';

interface Props {
  status: MarketDataStatus;
  compact?: boolean;
}

const sourceClass = {
  broker_live: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-300',
  delayed: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/35 dark:text-blue-300',
  fallback: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-300',
  demo: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
  market_closed: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/35 dark:text-violet-300',
};

export default function DataSourceBadge({ status, compact = false }: Props) {
  const Icon = status.isRealtime ? Wifi : status.source === 'fallback' ? WifiOff : Radio;

  if (compact) {
    return (
      <Link
        to="/connect-broker"
        title={DATA_SOURCE_HELP[status.source]}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest transition hover:-translate-y-0.5 ${sourceClass[status.source]}`}
      >
        <Icon size={12} className={status.isRealtime ? 'animate-pulse' : ''} />
        {status.label}
      </Link>
    );
  }

  return (
    <div className={`flex flex-col gap-2 rounded-2xl border p-3 shadow-sm ${sourceClass[status.source]}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon size={16} className={status.isRealtime ? 'animate-pulse' : ''} />
          <span className="text-xs font-black uppercase tracking-widest">{status.label}</span>
        </div>
        {status.isRealtime && (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[9px] font-black uppercase dark:bg-slate-950/60">
            <ShieldCheck size={11} /> Realtime
          </span>
        )}
      </div>
      <p className="text-[11px] font-semibold leading-5 opacity-80">{status.message}</p>
      {status.canUpgradeToBrokerLive && (
        <Link to="/connect-broker" className="text-[10px] font-black uppercase tracking-widest underline underline-offset-4">
          Connect broker for live data
        </Link>
      )}
    </div>
  );
}
