import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, ShieldCheck } from 'lucide-react';
import type { Time } from 'lightweight-charts';
import LightweightStockChart, { type StockCandle } from './charts/LightweightStockChart';
import ChartEmptyState from './charts/ChartEmptyState';
import { chartResponseSchema } from '../core/schemas';

interface StockChartProps {
  symbol: string;
  name: string;
}

const INTERVALS = ['1D', '5D', '1M', '3M', '12M'] as const;

async function loadCandles(symbol: string, interval: string, signal: AbortSignal) {
  const params = new URLSearchParams({ symbol, interval });
  const response = await fetch(`/api/chart?${params.toString()}`, { signal });
  const payload = await response.json().catch(() => null);
  const parsed = chartResponseSchema.safeParse(payload);
  if (!parsed.success) throw new Error('Chart provider returned malformed data.');
  if (parsed.data.status !== 'ok' || parsed.data.data.length === 0) return { source: parsed.data.source, candles: [] as StockCandle[], message: parsed.data.message };
  return {
    source: parsed.data.source,
    message: parsed.data.message,
    candles: parsed.data.data.map((candle) => ({ ...candle, time: candle.time as Time })),
  };
}

export default function StockChart({ symbol, name }: StockChartProps) {
  const [interval, setInterval] = useState<(typeof INTERVALS)[number]>('3M');
  const cleanSymbol = useMemo(() => String(symbol || '').replace('NSE:', '').replace('.NS', '').replace('.BO', '').trim(), [symbol]);
  const query = useQuery({
    queryKey: ['stock-chart', cleanSymbol, interval],
    queryFn: ({ signal }) => loadCandles(cleanSymbol, interval, signal),
    enabled: Boolean(cleanSymbol),
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  return (
    <section className="mb-6 border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 sm:p-5" id="chart_section">
      <div className="mb-4 flex flex-col gap-4 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-slate-200 px-2 py-0.5 font-mono text-sm font-bold text-slate-900 dark:border-slate-800 dark:text-white">{cleanSymbol || 'No symbol'}</span>
            <span className="max-w-56 truncate text-xs font-semibold text-slate-500" title={name}>{name}</span>
            <span className="hidden items-center gap-1 rounded border border-amber-200 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-700 dark:border-amber-900 dark:text-amber-300 sm:inline-flex"><ShieldCheck size={10} /> Provider data only</span>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1 dark:border-slate-800">
          <Clock size={12} className="mx-1 text-slate-400" />
          {INTERVALS.map((item) => (
            <button key={item} type="button" onClick={() => setInterval(item)} className={`rounded px-2 py-1 text-[10px] font-bold ${interval === item ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950' : 'text-slate-500'}`}>{item}</button>
          ))}
        </div>
      </div>

      {query.isPending ? (
        <div className="min-h-72 animate-pulse bg-slate-100 dark:bg-slate-900" aria-label="Loading chart data" />
      ) : query.isError || !query.data || query.data.candles.length === 0 ? (
        <ChartEmptyState message="Chart data unavailable" />
      ) : (
        <LightweightStockChart data={query.data.candles} ariaLabel={`${cleanSymbol} OHLC chart from ${query.data.source}`} />
      )}
      <p className="mt-3 text-[11px] font-semibold text-slate-500">{query.data?.message || 'No synthetic candles or locally generated prices are used.'}</p>
    </section>
  );
}
