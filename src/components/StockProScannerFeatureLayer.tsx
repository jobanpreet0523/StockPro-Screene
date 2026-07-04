import React, { useMemo, useState } from 'react';
import { Bell, Copy, Download, FileSpreadsheet, Heart, MoreHorizontal, Play, Plus, RefreshCcw, Save, Search, Settings, SlidersHorizontal, ToggleLeft, ToggleRight, Trash2, WandSparkles } from 'lucide-react';
import { Stock } from '../types';

interface Props {
  stocks: Stock[];
}

type Rule = {
  id: string;
  left: string;
  op: string;
  right: string;
  group: 'all' | 'any' | 'extra';
  enabled: boolean;
};

const baseRules: Rule[] = [
  { id: 'r1', left: 'Daily Volume', op: 'Greater than', right: 'Number 200000', group: 'all', enabled: true },
  { id: 'r2', left: 'Daily High', op: 'Greater than', right: 'Daily Close', group: 'all', enabled: true },
  { id: 'r3', left: 'Daily Low', op: 'Less than', right: 'Daily Close', group: 'all', enabled: true },
  { id: 'r4', left: 'Daily Close', op: 'Greater than', right: 'Daily SMA(close,20)', group: 'all', enabled: true },
  { id: 'r5', left: 'Daily Open / Daily Close', op: 'Crossed above', right: 'Number 1', group: 'any', enabled: true },
  { id: 'r6', left: 'Daily Open / Daily Close', op: 'Crossed below', right: 'Number 1', group: 'any', enabled: true },
  { id: 'r7', left: 'Daily Open', op: 'Equals', right: 'Daily Close', group: 'any', enabled: true },
  { id: 'r8', left: 'Daily Open / Daily Close', op: 'Greater than', right: 'Number 0.99', group: 'extra', enabled: true },
  { id: 'r9', left: 'Daily Close / Daily Open', op: 'Greater than', right: 'Number 0.99', group: 'extra', enabled: true },
];

const chips = ['5-minute volume > 2 x 5-minute SMA(volume,10)', 'consecutive 5 red candles on 5-min', 'Doji on 15-min', 'Green candle on 15-min'];

export default function StockProScannerFeatureLayer({ stocks }: Props) {
  const [mode, setMode] = useState<'Append' | 'Replace' | 'Draw'>('Append');
  const [prompt, setPrompt] = useState("Scan stocks using simple language like 'stocks up by 4% and rising volume'");
  const [rules, setRules] = useState<Rule[]>(baseRules);
  const [toast, setToast] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const previewStocks = useMemo(() => {
    return (stocks || [])
      .filter((stock) => !query || `${stock.name} ${stock.symbol}`.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 12);
  }, [stocks, query]);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  };

  const triggerButton = (label: RegExp, msg: string) => {
    const btn = Array.from(document.querySelectorAll<HTMLButtonElement>('#chartink_style_scanner_lab button')).find((b) => label.test(b.textContent || ''));
    btn?.click();
    notify(msg);
  };

  const addRule = (group: Rule['group']) => {
    setRules((prev) => [...prev, { id: `rule-${Date.now()}`, left: 'Daily Close', op: 'Greater than', right: 'Daily Open', group, enabled: true }]);
  };

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((rule) => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule));
  };

  const duplicateRule = (rule: Rule) => {
    setRules((prev) => [...prev, { ...rule, id: `copy-${Date.now()}` }]);
    notify('Rule duplicated');
  };

  const deleteRule = (id: string) => setRules((prev) => prev.filter((rule) => rule.id !== id));

  const magicGenerate = () => {
    if (mode === 'Replace') setRules([{ id: `magic-${Date.now()}`, left: 'Generated Condition', op: 'Matches', right: prompt.slice(0, 32), group: 'all', enabled: true }]);
    else if (mode === 'Append') addRule('all');
    notify(`${mode} magic filter generated`);
  };

  const ruleRow = (rule: Rule) => (
    <div key={rule.id} className={`flex flex-wrap items-center gap-2 rounded-xl px-2 py-1.5 text-sm ${rule.enabled ? 'bg-white dark:bg-slate-950' : 'bg-slate-100 opacity-55 dark:bg-slate-900'}`}>
      <span className="font-semibold text-slate-600 dark:text-slate-300">{rule.left}</span>
      <span className="font-black text-fuchsia-500">{rule.op}</span>
      <span className="rounded bg-slate-950 px-1.5 py-0.5 font-black text-white dark:bg-white dark:text-slate-950">{rule.right}</span>
      <button onClick={() => duplicateRule(rule)} className="rounded p-1 text-orange-500 hover:bg-orange-50"><Copy size={14} /></button>
      <button onClick={() => toggleRule(rule.id)} className="rounded p-1 text-emerald-500 hover:bg-emerald-50">{rule.enabled ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}</button>
      <button onClick={() => notify('Rule settings opened')} className="rounded p-1 text-slate-500 hover:bg-slate-100"><Settings size={14} /></button>
      <button onClick={() => deleteRule(rule.id)} className="rounded p-1 text-rose-500 hover:bg-rose-50"><Trash2 size={14} /></button>
    </div>
  );

  return (
    <div className="space-y-6" id="scanner_feature_parity_layer">
      {toast && <div className="fixed right-6 top-24 z-[140] rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-emerald-300 shadow-2xl">{toast}</div>}

      <section className="rounded-[1.5rem] border border-sky-200 bg-sky-50/80 p-4 shadow-sm dark:border-sky-500/20 dark:bg-sky-950/20">
        <div className="mb-3 flex items-center gap-2 text-base font-black text-sky-600 dark:text-sky-300"><WandSparkles size={20} /> MAGIC FILTERS</div>
        <div className="grid gap-2 lg:grid-cols-[280px_1fr_150px]">
          <div className="grid grid-cols-3 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-950">
            {(['Append', 'Replace', 'Draw'] as const).map((item) => <button key={item} onClick={() => setMode(item)} className={`rounded-lg px-3 py-2 text-xs font-black ${mode === item ? 'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-300' : 'text-slate-500'}`}>{item}</button>)}
          </div>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-[42px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-sky-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200" />
          <button onClick={magicGenerate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-black text-white shadow-lg"><RefreshCcw size={16} /> Generate</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((chip) => <button key={chip} onClick={() => setPrompt(chip)} className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 dark:border-sky-500/20 dark:bg-slate-950 dark:text-slate-200">{chip}</button>)}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h2 className="border-b border-slate-200 pb-4 text-sm font-black text-slate-950 dark:border-slate-800 dark:text-white">Stock passes all of the below filters in cash segment:</h2>
        <div className="mt-4 space-y-2 border-l-2 border-dashed border-slate-200 pl-4 dark:border-slate-800">
          {rules.filter((r) => r.group === 'all').map(ruleRow)}
          <div className="flex gap-2"><button onClick={() => addRule('all')} className="rounded-lg bg-fuchsia-500 p-2 text-white"><Plus size={16} /></button><button onClick={() => notify('Group copied')} className="rounded-lg bg-blue-500 p-2 text-white"><Copy size={16} /></button></div>
          <h3 className="pt-2 text-sm font-black text-slate-950 dark:text-white">Stock passes any 1 of the below filters in cash segment:</h3>
          <div className="space-y-2 border-l-2 border-dashed border-slate-200 pl-4 dark:border-slate-800">{rules.filter((r) => r.group === 'any').map(ruleRow)}<div className="flex gap-2"><button onClick={() => addRule('any')} className="rounded-lg bg-fuchsia-500 p-2 text-white"><Plus size={16} /></button><button onClick={() => notify('Nested group copied')} className="rounded-lg bg-blue-500 p-2 text-white"><Copy size={16} /></button></div></div>
          <div className="space-y-2 pt-2">{rules.filter((r) => r.group === 'extra').map(ruleRow)}<div className="flex gap-2"><button onClick={() => addRule('extra')} className="rounded-lg bg-fuchsia-500 p-2 text-white"><Plus size={16} /></button><button onClick={() => notify('Ratio group copied')} className="rounded-lg bg-blue-500 p-2 text-white"><Copy size={16} /></button></div></div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button onClick={() => triggerButton(/run scan/i, 'Run Scan triggered')} className="inline-flex items-center gap-2 rounded-xl border border-emerald-400 bg-white px-4 py-3 text-sm font-black text-emerald-600 hover:bg-emerald-50 dark:bg-slate-950"><Play size={16} /> Run Scan</button>
          <button onClick={() => triggerButton(/^\s*save\s*$/i, 'Save Scan triggered')} className="inline-flex items-center gap-2 rounded-xl border border-emerald-400 bg-white px-4 py-3 text-sm font-black text-emerald-600 hover:bg-emerald-50 dark:bg-slate-950"><Save size={16} /> Save Scan</button>
          <button onClick={() => notify('Backtest preview is available below')} className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-400 bg-white px-4 py-3 text-sm font-black text-fuchsia-600 hover:bg-fuchsia-50 dark:bg-slate-950"><RefreshCcw size={16} /> Backtest Results</button>
          <button onClick={() => triggerButton(/alert/i, 'Alert created')} className="inline-flex items-center gap-2 rounded-xl border border-orange-400 bg-white px-4 py-3 text-sm font-black text-orange-600 hover:bg-orange-50 dark:bg-slate-950"><Bell size={16} /> Create Alert</button>
          <button onClick={() => notify('More menu opened')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"><MoreHorizontal size={16} /> More</button>
          <span className="ml-auto inline-flex items-center gap-2 text-sm font-bold text-slate-500"><Heart size={17} className="text-rose-500" /> 629 people love this</span>
        </div>
        <div className="mt-3 rounded-xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800 dark:bg-violet-950/20 dark:text-violet-200">Realtime scanner data is unlocked in StockPro Free Access.</div>
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h2 className="mb-3 text-lg font-black text-slate-950 dark:text-white">STOCKS</h2>
        <div className="flex flex-wrap items-center gap-2 rounded-t-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
          <button onClick={() => notify('Column customizer opened')} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-black text-white"><SlidersHorizontal size={14} className="mr-1 inline" /> Customize columns</button>
          <button onClick={() => notify('Rows copied')} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-black text-white"><Copy size={14} className="mr-1 inline" /> Copy</button>
          <button onClick={() => notify('CSV export ready')} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-black text-white"><Download size={14} className="mr-1 inline" /> CSV</button>
          <button onClick={() => notify('Excel export ready')} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-black text-white"><FileSpreadsheet size={14} className="mr-1 inline" /> Excel</button>
          <div className="relative ml-auto"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search stocks" className="rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs font-bold outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white" /></div>
          <button onClick={() => notify('Settings opened')} className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-black text-slate-700 dark:bg-violet-950/20 dark:text-violet-200"><Settings size={14} className="mr-1 inline" /> Settings</button>
          <button onClick={() => notify('Column add menu opened')} className="rounded-lg px-2 py-2 text-fuchsia-500"><Plus size={17} /></button>
        </div>
        <div className="overflow-auto rounded-b-2xl border-x border-b border-slate-200 dark:border-slate-800"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-blue-50 text-slate-950 dark:bg-slate-900 dark:text-white"><tr>{['Sr.', 'Stock Name', 'Symbol', 'Close', '%_change', 'Volume'].map((h) => <th key={h} className="px-3 py-3 font-black">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{previewStocks.map((s, i) => <tr key={s.symbol} className="odd:bg-white even:bg-slate-50 hover:bg-blue-50 dark:odd:bg-slate-950 dark:even:bg-slate-900/70 dark:hover:bg-slate-800"><td className="px-3 py-3 font-semibold text-slate-500">{i + 1}</td><td className="px-3 py-3 font-bold text-blue-600">{s.name}</td><td className="px-3 py-3 font-bold text-blue-600">{s.symbol.replace('.NS', '')}</td><td className="px-3 py-3 text-right font-mono font-bold">{Number(s.close || s.price).toFixed(2)}</td><td className="px-3 py-3 text-right font-mono font-bold text-emerald-600">{Number(s.changePercent || 0).toFixed(2)}%</td><td className="px-3 py-3 text-right font-mono font-bold">{Number(s.volume || 0).toLocaleString('en-IN')}</td></tr>)}</tbody></table></div>
      </section>
    </div>
  );
}
