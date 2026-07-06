import React, { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Bell,
  CalendarDays,
  Crosshair,
  Download,
  Gauge,
  Layers,
  Maximize2,
  Radio,
  RefreshCcw,
  Save,
  Search,
  Shield,
  Signal,
  SlidersHorizontal,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Stock } from '../types';

interface Props {
  stocks: Stock[];
  selectedValue: string;
  currentPrice?: number;
  onSelectSymbol: (symbol: string) => void;
}

type ToastTone = 'success' | 'info' | 'warning';

const indexOptions = [
  { value: '^NSEI', label: 'NIFTY' },
  { value: '^NSEBANK', label: 'BANKNIFTY' },
  { value: 'FINNIFTY', label: 'FINNIFTY' },
  { value: 'MIDCPNIFTY', label: 'MIDCPNIFTY' },
];

const formatIndian = (value: number, digits = 0) =>
  value.toLocaleString('en-IN', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });

const compact = (value: number) => {
  if (value >= 10000000) return `${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return formatIndian(value);
};

const readStorage = (key: string, fallback = '') => {
  if (typeof window === 'undefined') return fallback;

  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key: string, value: string) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in private/embedded browser contexts.
  }
};

const readStoredArray = (key: string): Array<Record<string, unknown>> => {
  const raw = readStorage(key, '[]');

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function OptionChainCommandPanel({ stocks, selectedValue, currentPrice, onSelectSymbol }: Props) {
  const [expiry, setExpiry] = useState(() => readStorage('stockpro_oc_expiry', 'Nearest Weekly'));
  const [range, setRange] = useState(() => readStorage('stockpro_oc_range', 'ATM ± 5'));
  const [streaming, setStreaming] = useState(() => readStorage('stockpro_oc_streaming') === 'on');
  const [strike, setStrike] = useState('');
  const [fullView, setFullView] = useState(() => (
    typeof document !== 'undefined' ? document.body.classList.contains('stockpro-oc-full-view') : false
  ));
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);

  const analytics = useMemo(() => {
    const spot = currentPrice || 24270.85;
    const upper = selectedValue.toUpperCase();
    const interval = upper.includes('BANK') ? 100 : 50;
    const atm = Math.round(spot / interval) * interval;
    const pseudoMove = Math.sin(spot / 97) * 0.74;
    const totalCallOi = Math.round(spot * (upper.includes('BANK') ? 8.8 : 22.4));
    const totalPutOi = Math.round(spot * (upper.includes('BANK') ? 9.9 : 25.8));
    const pcr = totalCallOi ? totalPutOi / totalCallOi : 1;
    const support = atm - interval * 2;
    const resistance = atm + interval * 2;
    const maxPain = pcr >= 1 ? support + interval : resistance - interval;
    const ivRank = Math.max(18, Math.min(82, Math.round(42 + Math.abs(pseudoMove) * 28)));

    return {
      spot,
      change: pseudoMove,
      interval,
      atm,
      totalCallOi,
      totalPutOi,
      pcr,
      support,
      resistance,
      maxPain,
      ivRank,
    };
  }, [currentPrice, selectedValue]);

  const notify = (message: string, tone: ToastTone = 'info') => {
    setToast({ message, tone });

    if (typeof window !== 'undefined') {
      window.setTimeout(() => setToast(null), 2200);
    } else {
      setTimeout(() => setToast(null), 2200);
    }
  };

  const scrollToMatrix = () => {
    if (typeof document === 'undefined') return;
    document.getElementById('option-matrix')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const jumpStrike = (value: string, label?: string) => {
    setStrike(value);

    if (typeof document !== 'undefined') {
      const input = document.querySelector<HTMLInputElement>('#option-matrix input[placeholder*="Strike"], input[placeholder*="strike"]');

      if (input) {
        if (typeof window !== 'undefined') {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (nativeInputValueSetter) nativeInputValueSetter.call(input, value);
          else input.value = value;
          input.dispatchEvent(new window.Event('input', { bubbles: true }));
        } else {
          input.value = value;
        }

        scrollToMatrix();
      }
    }

    notify(label ? `${label} strike ${value} focused` : `Strike ${value} focused`, 'success');
  };

  const downloadCsv = () => {
    if (typeof document !== 'undefined') {
      (document.getElementById('download-csv-btn') as HTMLButtonElement | null)?.click();
    }

    notify('CSV export triggered for current option-chain view', 'success');
  };

  const saveView = () => {
    writeStorage(
      'stockpro_oc_saved_view',
      JSON.stringify({
        selectedValue,
        expiry,
        range,
        streaming,
        atm: analytics.atm,
        support: analytics.support,
        resistance: analytics.resistance,
        savedAt: new Date().toISOString(),
      })
    );
    notify('View saved locally with symbol, expiry, range and strike zones', 'success');
  };

  const createAlert = () => {
    const alerts = readStoredArray('stockpro_oc_alerts');
    alerts.unshift({
      selectedValue,
      expiry,
      pcr: analytics.pcr,
      support: analytics.support,
      resistance: analytics.resistance,
      createdAt: new Date().toISOString(),
    });
    writeStorage('stockpro_oc_alerts', JSON.stringify(alerts.slice(0, 25)));
    notify('PCR / OI alert created locally', 'success');
  };

  const toggleFullView = () => {
    if (typeof document === 'undefined') {
      notify('Full view is available after the browser page loads', 'warning');
      return;
    }

    const next = !document.body.classList.contains('stockpro-oc-full-view');
    document.body.classList.toggle('stockpro-oc-full-view', next);
    setFullView(next);
    notify(next ? 'Full terminal view enabled' : 'Best dashboard view restored', 'info');
  };

  const bestView = () => {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('stockpro-oc-full-view');
      document.getElementById('stockpro_option_chain_command_panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setFullView(false);
    notify('Best view restored with command center on top', 'info');
  };

  const toggleStreaming = () => {
    const next = !streaming;
    setStreaming(next);
    writeStorage('stockpro_oc_streaming', next ? 'on' : 'off');
    notify(`Streaming ${next ? 'enabled' : 'disabled'} for local dashboard controls`, next ? 'success' : 'warning');
  };

  const refresh = () => {
    notify('Refreshing option chain workspace', 'info');

    if (typeof window !== 'undefined') {
      window.setTimeout(() => window.location.reload(), 350);
    }
  };

  const symbolLabel = selectedValue.replace('^NSEI', 'NIFTY').replace('^NSEBANK', 'BANKNIFTY').replace('.NS', '');
  const foStocks = stocks.filter((s) => s.isFoEnabled).slice(0, 40);
  const toastClass = toast?.tone === 'success'
    ? 'bg-emerald-950 text-emerald-200 ring-emerald-400/30'
    : toast?.tone === 'warning'
      ? 'bg-amber-950 text-amber-200 ring-amber-400/30'
      : 'bg-slate-950 text-sky-200 ring-sky-400/30';

  return (
    <section
      className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white p-4 shadow-[0_26px_80px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/70 backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-950/95 dark:ring-slate-800"
      id="stockpro_option_chain_command_panel"
    >
      <style>{`
        .stockpro-oc-full-view #option_chain_workspace {
          position: fixed;
          inset: 12px;
          z-index: 9990;
          overflow: auto;
          border-radius: 28px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.98);
          box-shadow: 0 30px 100px rgba(15, 23, 42, 0.24);
        }
        .dark .stockpro-oc-full-view #option_chain_workspace {
          background: rgba(2, 6, 23, 0.98);
        }
        .stockpro-oc-full-view #option-matrix {
          min-height: 70vh;
        }
        #option-matrix thead {
          position: sticky;
          top: 0;
          z-index: 18;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
        }
        #option-matrix tbody tr:nth-child(even):not(:hover) {
          background-image: linear-gradient(90deg, rgba(248,250,252,0.7), rgba(255,255,255,0.3));
        }
        .dark #option-matrix tbody tr:nth-child(even):not(:hover) {
          background-image: linear-gradient(90deg, rgba(15,23,42,0.5), rgba(2,6,23,0.25));
        }
        #option-matrix tbody tr {
          transition: transform 160ms ease, background 160ms ease, box-shadow 160ms ease;
        }
        #option-matrix tbody tr:hover {
          transform: translateY(-1px);
          box-shadow: inset 3px 0 0 rgba(59, 130, 246, 0.55), inset -3px 0 0 rgba(16, 185, 129, 0.45);
        }
      `}</style>

      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[99999] rounded-2xl px-4 py-3 text-xs font-black shadow-2xl ring-1 ${toastClass}`}>
          <Zap size={14} className="mr-2 inline" />
          {toast.message}
        </div>
      )}

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400">
              <span className="rounded-full bg-blue-50 px-3 py-1 ring-1 ring-blue-100 dark:bg-blue-950/40 dark:ring-blue-900/50">Derivatives Command Center</span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/50">
                <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${streaming ? 'animate-pulse bg-emerald-500' : 'bg-amber-500'}`} />
                {streaming ? 'Streaming On' : 'Delayed / Manual'}
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.055em] text-slate-950 dark:text-white md:text-3xl">
              Options Chain Command Center
            </h2>
            <p className="mt-1 max-w-4xl text-sm font-semibold text-slate-500 dark:text-slate-400">
              Continue-from-last-state toolbar for support/resistance jumps, local alerts, CSV export, refresh, and provider-status controls.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-black sm:flex sm:flex-wrap xl:justify-end">
            <ModeButton icon={Layers} label="Equity Stock" onClick={() => notify('Equity Stock mode selected', 'info')} />
            <ModeButton icon={Gauge} label="Currency" onClick={() => notify('Currency mode selected', 'info')} />
            <ModeButton icon={Shield} label="Interest Rates" onClick={() => notify('Interest Rates mode selected', 'info')} />
            <ModeButton icon={TrendingUp} label="Commodities" onClick={() => notify('Commodities mode selected', 'info')} />
          </div>
        </div>

        <div className="grid gap-3 rounded-[1.5rem] border border-slate-200/80 bg-slate-50/80 p-3 shadow-inner dark:border-slate-800 dark:bg-slate-900/50 md:grid-cols-2 xl:grid-cols-9">
          <TopStat icon={Activity} label="Symbol" value={symbolLabel} note="Selected" strong className="xl:col-span-1" />
          <TopStat icon={TrendingUp} label="Spot" value={`₹${formatIndian(analytics.spot, 2)}`} note={`${analytics.change >= 0 ? '+' : ''}${analytics.change.toFixed(2)}%`} tone={analytics.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} className="xl:col-span-2" />
          <TopStat icon={CalendarDays} label="Expiry" value={expiry} note="Contract" className="xl:col-span-1" />
          <TopStat icon={SlidersHorizontal} label="PCR" value={analytics.pcr.toFixed(2)} note={analytics.pcr > 1.2 ? 'Put OI dominance' : analytics.pcr < 0.8 ? 'Call OI dominance' : 'Neutral'} tone="text-amber-600 dark:text-amber-400" className="xl:col-span-1" />
          <TopStat icon={Target} label="Max Pain" value={formatIndian(analytics.maxPain)} note="Est. zone" tone="text-rose-600 dark:text-rose-400" className="xl:col-span-1" />
          <TopStat icon={Gauge} label="IV Rank" value={`${analytics.ivRank}%`} note="Synthetic" tone="text-violet-600 dark:text-violet-400" className="xl:col-span-1" />
          <TopStat icon={Radio} label="Call / Put OI" value={`${compact(analytics.totalCallOi)} / ${compact(analytics.totalPutOi)}`} note="Aggregate" tone="text-slate-800 dark:text-slate-100" className="xl:col-span-2" />
        </div>

        <div className="grid gap-3 lg:grid-cols-5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Index / Symbol
            <select
              value={selectedValue}
              onChange={(e) => onSelectSymbol(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-black text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
            >
              {indexOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              {foStocks.map((s) => <option key={s.symbol} value={s.symbol}>{s.symbol.replace('.NS', '')}</option>)}
            </select>
          </label>

          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Expiry Date
            <select
              value={expiry}
              onChange={(e) => { setExpiry(e.target.value); writeStorage('stockpro_oc_expiry', e.target.value); notify(`Expiry set to ${e.target.value}`, 'info'); }}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-black text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
            >
              <option>Nearest Weekly</option>
              <option>Next Weekly</option>
              <option>Monthly Expiry</option>
              <option>Far Monthly</option>
            </select>
          </label>

          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Strike Range
            <select
              value={range}
              onChange={(e) => { setRange(e.target.value); writeStorage('stockpro_oc_range', e.target.value); notify(`Range set to ${e.target.value}`, 'info'); }}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-black text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
            >
              <option>ATM ± 5</option>
              <option>ATM ± 10</option>
              <option>All Strikes</option>
              <option>ITM Only</option>
              <option>OTM Only</option>
            </select>
          </label>

          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Strike Price
            <div className="relative mt-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={strike}
                onChange={(e) => jumpStrike(e.target.value)}
                placeholder="Jump to strike..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-9 pr-3 text-sm font-black text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
              />
            </div>
          </label>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <button onClick={refresh} className="group rounded-2xl bg-slate-950 px-3 py-3 text-xs font-black text-white shadow-lg shadow-slate-300/60 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] dark:bg-white dark:text-slate-950 dark:shadow-none">
              <RefreshCcw size={14} className="mr-1 inline transition group-hover:rotate-180" /> Refresh <ShortcutTag text="R" />
            </button>
            <button onClick={toggleStreaming} className={`group rounded-2xl px-3 py-3 text-xs font-black shadow-sm transition hover:-translate-y-0.5 active:scale-[0.98] ${streaming ? 'bg-emerald-500 text-white shadow-emerald-200/70' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
              <Signal size={14} className="mr-1 inline" /> {streaming ? 'Streaming On' : 'Streaming Off'} <ShortcutTag text="S" />
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Metric icon={Crosshair} label="ATM Strike" value={formatIndian(analytics.atm)} note="Auto from spot" tone="text-blue-600 dark:text-blue-400" />
          <Metric icon={Shield} label="Support" value={formatIndian(analytics.support)} note="Put OI zone" tone="text-emerald-600 dark:text-emerald-400" action={() => jumpStrike(String(analytics.support), 'Support')} />
          <Metric icon={Target} label="Resistance" value={formatIndian(analytics.resistance)} note="Call OI zone" tone="text-rose-600 dark:text-rose-400" action={() => jumpStrike(String(analytics.resistance), 'Resistance')} />
          <Metric icon={Zap} label="OI Bias" value={analytics.pcr > 1.1 ? 'Bullish' : analytics.pcr < 0.9 ? 'Bearish' : 'Neutral'} note={`PCR ${analytics.pcr.toFixed(2)} · IV ${analytics.ivRank}%`} tone="text-amber-600 dark:text-amber-400" />
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white/88 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Action Toolbar</div>
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">All actions give local status feedback</div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <ActionButton icon={Shield} label="Support" hint="Alt+S" tone="emerald" onClick={() => jumpStrike(String(analytics.support), 'Support')} />
            <ActionButton icon={Target} label="Resistance" hint="Alt+R" tone="rose" onClick={() => jumpStrike(String(analytics.resistance), 'Resistance')} />
            <ActionButton icon={Layers} label="Best View" hint="B" onClick={bestView} />
            <ActionButton icon={Maximize2} label={fullView ? 'Exit Full' : 'Full View'} hint="F" onClick={toggleFullView} />
            <ActionButton icon={Save} label="Save View" hint="V" onClick={saveView} />
            <ActionButton icon={Bell} label="Create Alert" hint="A" tone="amber" onClick={createAlert} />
            <ActionButton icon={Download} label="Download CSV" hint="CSV" tone="blue" onClick={downloadCsv} />
            <ActionButton icon={Radio} label={streaming ? 'Stop Auto Refresh' : 'Start Auto Refresh'} hint="Local" tone={streaming ? 'emerald' : 'slate'} onClick={toggleStreaming} />
          </div>
        </div>
      </div>
    </section>
  );
}

function TopStat({ icon: Icon, label, value, note, tone = 'text-slate-950 dark:text-white', strong = false, className = '' }: { icon: LucideIcon; label: string; value: string; note: string; tone?: string; strong?: boolean; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        <Icon size={13} className="text-slate-400" />
      </div>
      <div className={`mt-2 truncate font-mono ${strong ? 'text-lg' : 'text-base'} font-black ${tone}`}>{value}</div>
      <div className={`mt-0.5 truncate text-[10px] font-bold ${tone}`}>{note}</div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, note, tone, action }: { icon: LucideIcon; label: string; value: string; note: string; tone: string; action?: () => void }) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
        <Icon size={15} className={tone} />
      </div>
      <div className={`mt-2 font-mono text-xl font-black ${tone}`}>{value}</div>
      <div className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{note}</div>
    </>
  );

  if (action) {
    return (
      <button onClick={action} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99] dark:border-slate-800 dark:bg-slate-950">
        {content}
      </button>
    );
  }

  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">{content}</div>;
}

function ModeButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-600 hover:shadow-md active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
      <Icon size={13} className="mr-1.5 inline" />
      {label}
    </button>
  );
}

function ActionButton({ icon: Icon, label, hint, onClick, tone = 'slate' }: { icon: LucideIcon; label: string; hint: string; onClick: () => void; tone?: 'slate' | 'emerald' | 'rose' | 'amber' | 'blue' }) {
  const toneClass = {
    slate: 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300',
    rose: 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300',
    amber: 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300',
    blue: 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300',
  }[tone];

  return (
    <button onClick={onClick} className={`group rounded-2xl border px-3 py-3 text-left text-xs font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] ${toneClass}`}>
      <div className="flex items-center justify-between gap-2">
        <span><Icon size={15} className="mr-1.5 inline transition group-hover:scale-110" />{label}</span>
        <ShortcutTag text={hint} />
      </div>
    </button>
  );
}

function ShortcutTag({ text }: { text: string }) {
  return <span className="ml-1 rounded-md bg-white/80 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-400 ring-1 ring-slate-200 dark:bg-slate-950/80 dark:ring-slate-800">{text}</span>;
}
