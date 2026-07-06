import React, { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Activity, Gauge, Layers, Shield, Target, TrendingUp } from 'lucide-react';

interface Props {
  selectedValue: string;
  currentPrice?: number;
}

type Tone = 'slate' | 'emerald' | 'rose' | 'amber' | 'blue' | 'violet';

const formatIndian = (value: number) => value.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const compact = (value: number) => {
  if (value >= 10000000) return `${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return formatIndian(value);
};

export default function OptionChainAnalyticsCards({ selectedValue, currentPrice }: Props) {
  const analytics = useMemo(() => {
    const spot = currentPrice || 24270.85;
    const upper = selectedValue.toUpperCase();
    const interval = upper.includes('BANK') ? 100 : 50;
    const atm = Math.round(spot / interval) * interval;
    const move = Math.sin(spot / 97) * 0.74;
    const totalCallOi = Math.round(spot * (upper.includes('BANK') ? 8.8 : 22.4));
    const totalPutOi = Math.round(spot * (upper.includes('BANK') ? 9.9 : 25.8));
    const pcr = totalCallOi ? totalPutOi / totalCallOi : 1;
    const support = atm - interval * 2;
    const resistance = atm + interval * 2;
    const volumeSpike = Math.max(6, Math.min(68, Math.round(Math.abs(Math.cos(spot / 41)) * 55 + 8)));
    const ivRank = Math.max(18, Math.min(82, Math.round(42 + Math.abs(move) * 28)));
    const ivMove = Number((move * 2.2).toFixed(2));

    return {
      pcr,
      support,
      resistance,
      volumeSpike,
      ivRank,
      ivMove,
      totalCallOi,
      totalPutOi,
      pcrTrend: pcr > 1.12 ? 'Rising support' : pcr < 0.92 ? 'Falling pressure' : 'Balanced range',
      buildup: pcr > 1.12 ? 'Put OI buildup' : pcr < 0.92 ? 'Call OI buildup' : 'Balanced buildup',
    };
  }, [currentPrice, selectedValue]);

  const jumpToStrike = (value: number, label: string) => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    const input = document.querySelector<HTMLInputElement>('#option-matrix input[placeholder*="Strike"], #option-matrix input[placeholder*="strike"]');
    if (!input) return;
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (nativeInputValueSetter) nativeInputValueSetter.call(input, String(value));
    else input.value = String(value);
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
    document.getElementById('option-matrix')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    console.info(`${label} zone focused`, value);
  };

  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white/95 p-3 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-950/90 dark:shadow-none" id="option_chain_analytics_cards">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400">Option Analytics Cards</div>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Fast read on OI buildup, volume spike, PCR trend, IV movement, and support/resistance zones.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:bg-slate-900 dark:text-slate-300">Synthetic educational view</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <AnalyticsCard icon={Layers} label="OI Buildup" value={analytics.buildup} note={`${compact(analytics.totalCallOi)} C / ${compact(analytics.totalPutOi)} P`} tone={analytics.pcr > 1 ? 'emerald' : 'rose'} />
        <AnalyticsCard icon={Activity} label="Volume Spike" value={`${analytics.volumeSpike}%`} note={analytics.volumeSpike > 42 ? 'Unusual activity watch' : 'Normal activity band'} tone={analytics.volumeSpike > 42 ? 'amber' : 'blue'} />
        <AnalyticsCard icon={TrendingUp} label="PCR Trend" value={analytics.pcrTrend} note={`PCR ${analytics.pcr.toFixed(2)}`} tone={analytics.pcr > 1.12 ? 'emerald' : analytics.pcr < 0.92 ? 'rose' : 'slate'} />
        <AnalyticsCard icon={Gauge} label="IV Movement" value={`${analytics.ivMove >= 0 ? '+' : ''}${analytics.ivMove}%`} note={`IV rank ${analytics.ivRank}%`} tone={analytics.ivMove >= 0 ? 'violet' : 'blue'} />
        <AnalyticsCard icon={Shield} label="Support Zone" value={formatIndian(analytics.support)} note="Put OI defense zone" tone="emerald" onClick={() => jumpToStrike(analytics.support, 'Support')} />
        <AnalyticsCard icon={Target} label="Resistance Zone" value={formatIndian(analytics.resistance)} note="Call OI supply zone" tone="rose" onClick={() => jumpToStrike(analytics.resistance, 'Resistance')} />
      </div>
    </section>
  );
}

function AnalyticsCard({ icon: Icon, label, value, note, tone, onClick }: { icon: LucideIcon; label: string; value: string; note: string; tone: Tone; onClick?: () => void }) {
  const toneClass = {
    slate: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300',
    rose: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300',
    amber: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300',
    blue: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300',
    violet: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300',
  }[tone];

  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-black uppercase tracking-widest opacity-70">{label}</span>
        <Icon size={14} />
      </div>
      <div className="mt-2 truncate text-sm font-black tracking-[-0.02em] text-slate-950 dark:text-white">{value}</div>
      <div className="mt-1 truncate text-[10px] font-bold opacity-75">{note}</div>
    </>
  );

  if (onClick) {
    return <button onClick={onClick} className={`rounded-2xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] ${toneClass}`}>{content}</button>;
  }

  return <div className={`rounded-2xl border p-3 shadow-sm ${toneClass}`}>{content}</div>;
}
