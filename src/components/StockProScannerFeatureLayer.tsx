import { useMemo, useState } from 'react';
import { Copy, Download, Plus, Search, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import type { Stock } from '../types';

interface Props {
  stocks: Stock[];
}

type Rule = {
  id: string;
  left: string;
  op: string;
  right: string;
  group: 'all' | 'any';
  enabled: boolean;
};

const baseRules: Rule[] = [
  { id: 'r1', left: 'Daily volume', op: 'Greater than', right: 'Selected threshold', group: 'all', enabled: true },
  { id: 'r2', left: 'Daily close', op: 'Greater than', right: 'Daily open', group: 'all', enabled: true },
  { id: 'r3', left: 'Daily close', op: 'Crosses', right: 'Configured average', group: 'any', enabled: true },
];

export default function StockProScannerFeatureLayer({ stocks }: Props) {
  const [rules, setRules] = useState<Rule[]>(baseRules);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [message, setMessage] = useState('Rule edits stay local until a configured provider-backed scanner is run.');

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (stocks || [])
      .filter((stock) => !needle || `${stock.name} ${stock.symbol}`.toLowerCase().includes(needle))
      .slice(0, 100);
  }, [stocks, query]);

  const addRule = (group: Rule['group'], text = '') => {
    const clean = text.trim();
    setRules((current) => [...current, {
      id: crypto.randomUUID(),
      left: clean || 'Daily close',
      op: clean ? 'Draft condition' : 'Greater than',
      right: clean ? 'Review before provider run' : 'Daily open',
      group,
      enabled: true,
    }]);
    setDraft('');
    setMessage('Local rule draft updated. No provider scan was claimed.');
  };

  const duplicateGroup = (group: Rule['group']) => {
    setRules((current) => [
      ...current,
      ...current.filter((rule) => rule.group === group).map((rule) => ({ ...rule, id: crypto.randomUUID() })),
    ]);
    setMessage('Rule group duplicated locally.');
  };

  const copyRows = async () => {
    if (!rows.length) {
      setMessage('Provider data is required before rows can be copied.');
      return;
    }
    const text = rows.map((stock) => [stock.symbol, stock.name, stock.close ?? stock.price, stock.changePercent, stock.volume].join('\t')).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setMessage(`${rows.length} provider row${rows.length === 1 ? '' : 's'} copied.`);
    } catch {
      setMessage('Clipboard access is unavailable in this browser.');
    }
  };

  const exportCsv = () => {
    if (!rows.length) {
      setMessage('Provider data is required before a CSV can be exported.');
      return;
    }
    const quote = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [
      ['Symbol', 'Name', 'Close', 'Change percent', 'Volume'].map(quote).join(','),
      ...rows.map((stock) => [stock.symbol, stock.name, stock.close ?? stock.price, stock.changePercent, stock.volume].map(quote).join(',')),
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'stockpro-provider-rows.csv';
    link.click();
    URL.revokeObjectURL(url);
    setMessage(`${rows.length} provider row${rows.length === 1 ? '' : 's'} exported.`);
  };

  const renderRule = (rule: Rule) => (
    <div key={rule.id} className={`flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm ${rule.enabled ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950' : 'border-slate-200 bg-slate-100 opacity-60 dark:border-slate-800 dark:bg-slate-900'}`}>
      <span className="font-semibold text-slate-700 dark:text-slate-200">{rule.left}</span>
      <span className="font-black text-blue-700 dark:text-blue-300">{rule.op}</span>
      <span className="bg-slate-950 px-2 py-1 font-bold text-white dark:bg-white dark:text-slate-950">{rule.right}</span>
      <button
        type="button"
        onClick={() => setRules((current) => current.map((item) => item.id === rule.id ? { ...item, enabled: !item.enabled } : item))}
        className="ml-auto rounded-md p-2 text-emerald-700 hover:bg-emerald-50"
        aria-label={rule.enabled ? 'Disable rule' : 'Enable rule'}
        title={rule.enabled ? 'Disable rule' : 'Enable rule'}
      >
        {rule.enabled ? <ToggleRight size={18} aria-hidden /> : <ToggleLeft size={18} aria-hidden />}
      </button>
      <button
        type="button"
        onClick={() => setRules((current) => current.filter((item) => item.id !== rule.id))}
        className="rounded-md p-2 text-rose-700 hover:bg-rose-50"
        aria-label="Delete rule"
        title="Delete rule"
      >
        <Trash2 size={16} aria-hidden />
      </button>
    </div>
  );

  return (
    <div className="space-y-6" id="scanner_feature_layer">
      <section className="rounded-md border border-sky-200 bg-sky-50 p-4 dark:border-sky-500/20 dark:bg-sky-950/20">
        <h2 className="text-base font-black text-sky-800 dark:text-sky-200">Rule draft builder</h2>
        <p className="mt-1 text-xs font-semibold text-sky-900/70 dark:text-sky-100/70">Drafting a condition does not run a scan or create a result.</p>
        <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_150px]">
          <label className="sr-only" htmlFor="scanner-rule-draft">Rule condition</label>
          <input id="scanner-rule-draft" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Describe a condition to review" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-950" />
          <button type="button" onClick={() => addRule('all', draft)} disabled={!draft.trim()} className="inline-flex items-center justify-center gap-2 rounded-md bg-sky-700 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"><Plus size={16} aria-hidden /> Add rule</button>
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        {(['all', 'any'] as const).map((group) => (
          <div key={group} className="mt-4 first:mt-0">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-black text-slate-950 dark:text-white">Stock passes {group === 'all' ? 'all' : 'any one'} of these draft rules</h2>
              <div className="flex gap-1">
                <button type="button" onClick={() => addRule(group)} className="rounded-md p-2 text-blue-700 hover:bg-blue-50" aria-label={`Add ${group} rule`} title={`Add ${group} rule`}><Plus size={16} aria-hidden /></button>
                <button type="button" onClick={() => duplicateGroup(group)} className="rounded-md p-2 text-blue-700 hover:bg-blue-50" aria-label={`Duplicate ${group} rule group`} title={`Duplicate ${group} rule group`}><Copy size={16} aria-hidden /></button>
              </div>
            </div>
            <div className="mt-2 space-y-2">{rules.filter((rule) => rule.group === group).map(renderRule)}</div>
          </div>
        ))}
        <p className="mt-5 border-l-2 border-amber-500 pl-3 text-sm font-semibold text-amber-900 dark:text-amber-200" role="status">{message}</p>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-lg font-black text-slate-950 dark:text-white">Provider rows</h2>
          <button type="button" onClick={() => void copyRows()} className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-xs font-black text-white"><Copy size={14} aria-hidden /> Copy</button>
          <button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-xs font-black text-white"><Download size={14} aria-hidden /> CSV</button>
          <label className="relative">
            <span className="sr-only">Search provider rows</span>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search provider rows" className="rounded-md border border-slate-200 py-2 pl-9 pr-3 text-xs font-bold outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900" />
          </label>
        </div>
        {!rows.length ? (
          <div className="mt-4 border border-dashed border-slate-300 p-6 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">Provider data is unavailable. No substitute scanner rows are shown.</div>
        ) : (
          <div className="mt-4 overflow-auto rounded-md border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-blue-50 text-slate-950 dark:bg-slate-900 dark:text-white"><tr>{['Stock name', 'Symbol', 'Close', 'Change', 'Volume'].map((heading) => <th key={heading} className="px-3 py-3 font-black">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{rows.map((stock) => <tr key={stock.symbol}><td className="px-3 py-3 font-bold">{stock.name}</td><td className="px-3 py-3 font-bold text-blue-700">{stock.symbol.replace('.NS', '')}</td><td className="px-3 py-3 text-right font-mono font-bold">{Number.isFinite(stock.close ?? stock.price) ? Number(stock.close ?? stock.price).toFixed(2) : 'Unavailable'}</td><td className="px-3 py-3 text-right font-mono font-bold">{Number.isFinite(stock.changePercent) ? `${Number(stock.changePercent).toFixed(2)}%` : 'Unavailable'}</td><td className="px-3 py-3 text-right font-mono font-bold">{Number.isFinite(stock.volume) ? Number(stock.volume).toLocaleString('en-IN') : 'Unavailable'}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
