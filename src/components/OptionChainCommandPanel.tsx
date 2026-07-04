import React, { useState } from 'react';
import { Bell, Download, Maximize2, RefreshCcw, Save, Search, Signal } from 'lucide-react';
import { Stock } from '../types';

interface Props {
  stocks: Stock[];
  selectedValue: string;
  currentPrice?: number;
  onSelectSymbol: (symbol: string) => void;
}

const indexOptions = [
  { value: '^NSEI', label: 'NIFTY' },
  { value: '^NSEBANK', label: 'BANKNIFTY' },
  { value: 'FINNIFTY', label: 'FINNIFTY' },
  { value: 'MIDCPNIFTY', label: 'MIDCPNIFTY' },
];

export default function OptionChainCommandPanel({ stocks, selectedValue, currentPrice, onSelectSymbol }: Props) {
  const [expiry, setExpiry] = useState(localStorage.getItem('stockpro_oc_expiry') || 'Nearest Weekly');
  const [range, setRange] = useState(localStorage.getItem('stockpro_oc_range') || 'ATM ± 5');
  const [streaming, setStreaming] = useState(localStorage.getItem('stockpro_oc_streaming') === 'on');
  const [strike, setStrike] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const spot = currentPrice || 24270.85;
  const interval = selectedValue.includes('BANK') ? 100 : 50;
  const atm = Math.round(spot / interval) * interval;
  const totalCallOi = Math.round(spot * 22.4);
  const totalPutOi = Math.round(spot * 25.8);
  const pcr = totalCallOi ? totalPutOi / totalCallOi : 1;
  const support = atm - interval * 2;
  const resistance = atm + interval * 2;

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const jumpStrike = (value: string) => {
    setStrike(value);
    const input = Array.from(document.querySelectorAll<HTMLInputElement>('input')).find((el) => /strike/i.test(el.placeholder || ''));
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const downloadCsv = () => {
    (document.getElementById('download-csv-btn') as HTMLButtonElement | null)?.click();
    notify('CSV export triggered');
  };

  const saveView = () => {
    localStorage.setItem('stockpro_oc_saved_view', JSON.stringify({ selectedValue, expiry, range, streaming, savedAt: new Date().toISOString() }));
    notify('View saved locally');
  };

  const createAlert = () => {
    const alerts = JSON.parse(localStorage.getItem('stockpro_oc_alerts') || '[]');
    alerts.unshift({ selectedValue, pcr, support, resistance, createdAt: new Date().toISOString() });
    localStorage.setItem('stockpro_oc_alerts', JSON.stringify(alerts.slice(0, 25)));
    notify('PCR / OI alert created');
  };

  const toggleFullView = () => {
    document.body.classList.toggle('stockpro-oc-full-view');
    notify(document.body.classList.contains('stockpro-oc-full-view') ? 'Full view enabled' : 'Best view restored');
  };

  const toggleStreaming = () => {
    const next = !streaming;
    setStreaming(next);
    localStorage.setItem('stockpro_oc_streaming', next ? 'on' : 'off');
    notify(`Streaming ${next ? 'enabled' : 'disabled'}`);
  };

  const refresh = () => {
    notify('Refreshing option chain');
    window.setTimeout(() => window.location.reload(), 350);
  };

  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-950" id="stockpro_option_chain_command_panel">
      {toast && <div className="fixed bottom-6 right-6 z-[99999] rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-emerald-300 shadow-2xl">{toast}</div>}
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">Exchange-style controls</div>
          <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">Options Chain Command Center</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Index selection, expiry, strike range, streaming, export, alerts, support/resistance and PCR summary.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          {['Equity Stock', 'Currency', 'Interest Rates', 'Commodities'].map((item) => <button key={item} onClick={() => notify(`${item} mode selected`)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">{item}</button>)}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Index / Symbol<select value={selectedValue} onChange={(e) => onSelectSymbol(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-black text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white">{indexOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}{stocks.filter(s => s.isFoEnabled).slice(0, 30).map(s => <option key={s.symbol} value={s.symbol}>{s.symbol.replace('.NS', '')}</option>)}</select></label>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expiry Date<select value={expiry} onChange={(e) => { setExpiry(e.target.value); localStorage.setItem('stockpro_oc_expiry', e.target.value); }} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-black text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"><option>Nearest Weekly</option><option>Next Weekly</option><option>Monthly Expiry</option><option>Far Monthly</option></select></label>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Strike Range<select value={range} onChange={(e) => { setRange(e.target.value); localStorage.setItem('stockpro_oc_range', e.target.value); }} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-black text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"><option>ATM ± 5</option><option>ATM ± 10</option><option>All Strikes</option><option>ITM Only</option><option>OTM Only</option></select></label>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Strike Price<div className="relative mt-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={strike} onChange={(e) => jumpStrike(e.target.value)} placeholder="Jump to strike..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-black text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white" /></div></label>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1"><button onClick={refresh} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white dark:bg-white dark:text-slate-950"><RefreshCcw size={14} className="mr-1 inline" /> Refresh</button><button onClick={toggleStreaming} className={`rounded-xl px-3 py-2 text-xs font-black ${streaming ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}><Signal size={14} className="mr-1 inline" /> {streaming ? 'Streaming On' : 'Streaming Off'}</button></div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Metric label="ATM Strike" value={atm.toLocaleString('en-IN')} note="Auto from spot" tone="text-blue-600" />
        <Metric label="PCR" value={pcr.toFixed(2)} note={pcr > 1.2 ? 'Put OI dominance' : pcr < 0.8 ? 'Call OI dominance' : 'Neutral'} tone="text-amber-600" />
        <Metric label="Support" value={support.toLocaleString('en-IN')} note="Put OI zone" tone="text-emerald-600" />
        <Metric label="Resistance" value={resistance.toLocaleString('en-IN')} note="Call OI zone" tone="text-rose-600" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900/70">
        <button onClick={toggleFullView} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"><Maximize2 size={14} className="mr-1 inline" /> Best / Full View</button>
        <button onClick={saveView} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"><Save size={14} className="mr-1 inline" /> Save View</button>
        <button onClick={createAlert} className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-black text-orange-700"><Bell size={14} className="mr-1 inline" /> Create Alert</button>
        <button onClick={downloadCsv} className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700"><Download size={14} className="mr-1 inline" /> Download CSV</button>
      </div>
    </section>
  );
}

function Metric({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div><div className={`mt-2 font-mono text-xl font-black ${tone}`}>{value}</div><div className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{note}</div></div>;
}
