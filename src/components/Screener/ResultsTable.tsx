import React from 'react';
import { useLiveStocks, StockQuote } from '../../hooks/useLiveStocks';
import { useScreenerStore } from '../../store/screenerStore';
import { fmtINR, fmtPct, fmtLakhCrore } from '../../utils/formatters';
import { SkeletonTable } from '../SkeletonLoader';
import PriceFlash from '../PriceFlash';
import { ChevronUp, ChevronDown } from 'lucide-react';

const COLS = [
  { key: 'symbol', label: 'Symbol', sortable: true },
  { key: 'name', label: 'Company', sortable: false },
  { key: 'price', label: 'LTP', sortable: true },
  { key: 'changePercent', label: 'Change%', sortable: true },
  { key: 'volume', label: 'Volume', sortable: true },
  { key: 'marketCap', label: 'Mkt Cap', sortable: true },
  { key: 'peRatio', label: 'P/E', sortable: true },
  { key: 'sector', label: 'Sector', sortable: true },
] as const;

export default function ResultsTable() {
  const { data, isLoading, error } = useLiveStocks();
  const { filters, setFilter } = useScreenerStore();
  const stocks: StockQuote[] = data?.data || [];

  // Apply filters
  const filtered = stocks.filter(s => {
    if (s.price < filters.priceMin) return false;
    if (s.price > filters.priceMax) return false;
    if (s.changePercent < filters.changeMin) return false;
    if (s.changePercent > filters.changeMax) return false;
    if (filters.sector && s.sector !== filters.sector) return false;
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const key = filters.sortBy as keyof StockQuote;
    const aVal = a[key] ?? 0;
    const bVal = b[key] ?? 0;
    const cmp = typeof aVal === 'string' ? (aVal as string).localeCompare(bVal as string) : (aVal as number) - (bVal as number);
    return filters.sortDir === 'asc' ? cmp : -cmp;
  });

  // Pagination
  const pageSize = 50;
  const totalPages = Math.ceil(sorted.length / pageSize);
  const page = Math.min(filters.page, totalPages || 1);
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key: string) => {
    if (filters.sortBy === key) {
      setFilter('sortDir', filters.sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setFilter('sortBy', key);
      setFilter('sortDir', 'desc');
    }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (filters.sortBy !== col) return null;
    return filters.sortDir === 'asc' ? <ChevronUp size={10} className="inline" /> : <ChevronDown size={10} className="inline" />;
  };

  if (isLoading) return <SkeletonTable rows={15} cols={8} />;
  if (error) return <div className="text-red-400 p-4">Failed to load stocks: {error.message}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400">{sorted.length} stocks found</span>
        <button
          onClick={() => {
            const csv = ['Symbol,Company,LTP,Change%,Volume,MCap,PE,Sector'];
            sorted.forEach(s => csv.push(`${s.symbol},"${s.name}",${s.price},${s.changePercent},${s.volume},${s.marketCap},${s.peRatio},${s.sector}`));
            const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'stockpro-screener.csv';
            a.click();
          }}
          className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded font-bold hover:bg-emerald-500"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-900 text-slate-400">
              {COLS.map(col => (
                <th key={col.key} className={`px-2 py-2 text-left font-bold uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:text-white' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}>
                  {col.label} {col.sortable && <SortIcon col={col.key} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map(s => (
              <tr key={s.symbol} className="border-t border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="px-2 py-1.5">
                  <span className="text-white font-bold">{s.symbol.replace('.NS', '')}</span>
                  {s.isFoEnabled && <span className="ml-1 text-[8px] bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded font-bold">F&O</span>}
                </td>
                <td className="px-2 py-1.5 text-slate-300 truncate max-w-[150px]">{s.name}</td>
                <td className="px-2 py-1.5 text-white font-mono font-semibold">
                  <PriceFlash value={s.price} formatter={fmtINR} />
                </td>
                <td className={`px-2 py-1.5 font-mono font-bold ${s.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmtPct(s.changePercent)}
                </td>
                <td className="px-2 py-1.5 text-slate-300 font-mono">{fmtLakhCrore(s.volume)}</td>
                <td className="px-2 py-1.5 text-slate-300 font-mono">{fmtLakhCrore(s.marketCap)}</td>
                <td className="px-2 py-1.5 text-slate-400 font-mono">{s.peRatio.toFixed(1)}</td>
                <td className="px-2 py-1.5 text-slate-500">{s.sector}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <button onClick={() => setFilter('page', Math.max(1, page - 1))} disabled={page <= 1}
            className="text-xs px-2 py-1 bg-slate-800 rounded disabled:opacity-30 text-white">← Prev</button>
          <span className="text-xs text-slate-400">Page {page} / {totalPages}</span>
          <button onClick={() => setFilter('page', Math.min(totalPages, page + 1))} disabled={page >= totalPages}
            className="text-xs px-2 py-1 bg-slate-800 rounded disabled:opacity-30 text-white">Next →</button>
        </div>
      )}
    </div>
  );
}
