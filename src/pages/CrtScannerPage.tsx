import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Activity, AlertTriangle, Database, Play, RefreshCw, ShieldCheck } from 'lucide-react';
import StockProDataTable from '../components/tables/StockProDataTable';
import CrtCandlePreviewChart from '../components/charts/CrtCandlePreviewChart';
import { captureSafeEvent } from '../lib/posthog';
import { CRT_TIMEFRAMES, defaultCrtFilters, type CrtResult, type CrtScanFilters } from '../core/crtScanner';

interface ProviderStatus { status: 'configured' | 'setup_required'; provider: string; message: string }
interface ScanRun {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  provider: string;
  created_at: string;
  completed_at?: string;
  total_symbols?: number;
  processed_symbols?: number;
  result_count?: number;
  error_message?: string;
}

async function readJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => null) as (T & { message?: string }) | null;
  if (!response.ok && response.status !== 202) throw new Error(payload?.message || 'CRT Scanner request failed.');
  if (!payload) throw new Error('CRT Scanner returned malformed data.');
  return payload;
}

export default function CrtScannerPage() {
  const [filters, setFilters] = useState<CrtScanFilters>(defaultCrtFilters());
  const [provider, setProvider] = useState<ProviderStatus | null>(null);
  const [runs, setRuns] = useState<ScanRun[]>([]);
  const [activeRun, setActiveRun] = useState<ScanRun | null>(null);
  const [results, setResults] = useState<CrtResult[]>([]);
  const [chartResult, setChartResult] = useState<CrtResult | null>(null);
  const [state, setState] = useState<'idle' | 'scanning' | 'setup_required' | 'error'>('idle');
  const [message, setMessage] = useState('Filters will apply on next scan.');

  const loadRuns = async () => {
    const payload = await readJson<{ data: ScanRun[] }>('/api/crt-scanner/runs');
    setRuns(payload.data || []);
  };

  useEffect(() => {
    void readJson<ProviderStatus>('/api/market/provider-status').then(setProvider).catch((error) => setMessage(error.message));
    void loadRuns().catch((error) => {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Previous scan history is unavailable.');
    });
  }, []);

  useEffect(() => {
    if (!activeRun || !['queued', 'running'].includes(activeRun.status)) return;
    const timer = window.setInterval(async () => {
      if (document.hidden) return;
      try {
        const payload = await readJson<{ data: ScanRun }>(`/api/crt-scanner/runs/${activeRun.id}`);
        setActiveRun(payload.data);
        if (payload.data.status === 'completed') {
          const saved = await readJson<{ data: CrtResult[] }>(`/api/crt-scanner/results/${activeRun.id}`);
          setResults(saved.data || []);
          setState('idle');
          setMessage(`Saved scan completed with ${saved.data?.length || 0} verified result(s).`);
          void loadRuns();
        } else if (payload.data.status === 'failed') {
          setState('error');
          setMessage(payload.data.error_message || 'Scan failed. No substitute results are shown.');
        }
      } catch (error) {
        setState('error');
        setMessage(error instanceof Error ? error.message : 'Saved scan progress is unavailable.');
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [activeRun?.id, activeRun?.status]);

  const runScan = async () => {
    captureSafeEvent('crt_scan_click');
    if (provider?.status !== 'configured') {
      setState('setup_required');
      setMessage(provider?.message || 'Authorized market provider setup is required before a scan can run.');
      return;
    }
    setState('scanning');
    setResults([]);
    setMessage('Scanning market data...');
    try {
      const payload = await readJson<{ scan_run_id: string; data_captured_at: string; message: string }>('/api/crt-scanner/run', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filters }),
      });
      setActiveRun({ id: payload.scan_run_id, status: 'queued', provider: provider.provider, created_at: payload.data_captured_at });
      setMessage(payload.message);
      captureSafeEvent('crt_scan_run');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'CRT scan could not start.');
    }
  };

  const openSavedRun = async (run: ScanRun) => {
    setActiveRun(run);
    setResults([]);
    if (run.status !== 'completed') return setMessage('This saved scan has no final result set yet.');
    try {
      const payload = await readJson<{ data: CrtResult[] }>(`/api/crt-scanner/results/${run.id}`);
      setResults(payload.data || []);
      setMessage(`Loaded saved results for scan ${run.id}. No provider refetch occurred.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Saved results unavailable.');
    }
  };

  const columns = useMemo<ColumnDef<CrtResult>[]>(() => [
    { accessorKey: 'symbol', header: 'Symbol' },
    { accessorKey: 'companyName', header: 'Company Name' },
    { accessorKey: 'exchange', header: 'Exchange' },
    { accessorKey: 'timeframe', header: 'Timeframe' },
    { accessorKey: 'direction', header: 'CRT Direction' },
    { accessorKey: 'mode', header: 'Mode' },
    { accessorKey: 'crtCandleDate', header: 'CRT Candle Date' },
    { accessorKey: 'capturedPrice', header: 'Captured Price' },
    { accessorKey: 'previousHigh', header: 'Previous High' },
    { accessorKey: 'previousLow', header: 'Previous Low' },
    { accessorKey: 'sweepPrice', header: 'Sweep Price' },
    { accessorKey: 'triggerLevel', header: 'Trigger Level' },
    { accessorKey: 'invalidationLevel', header: 'Invalidation Level' },
    { accessorKey: 'target1', header: 'Target 1' },
    { accessorKey: 'target2', header: 'Target 2' },
    { accessorKey: 'riskReward', header: 'Risk Reward' },
    { accessorKey: 'volumeStatus', header: 'Volume Status' },
    { accessorKey: 'trendStatus', header: 'Trend Status' },
    { accessorKey: 'score', header: 'Score' },
    { accessorKey: 'dataCapturedAt', header: 'Data Captured At' },
    { accessorKey: 'scanRunId', header: 'Scan Run ID' },
    { id: 'chart', header: 'View Chart', cell: ({ row }) => <button type="button" className="font-bold text-emerald-700 underline" onClick={() => setChartResult(row.original)}>View saved chart</button> },
  ], []);

  return (
    <div className="lg:col-span-12 space-y-6">
      <section className="border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-950">
        <div className="flex items-start gap-2"><ShieldCheck size={18} className="mt-0.5 shrink-0" /><p>Educational scanner only. StockPro does not provide investment advice, buy/sell recommendations, guaranteed returns, or trade execution.</p></div>
      </section>

      <header>
        <p className="text-xs font-bold uppercase text-emerald-700">Free research tool</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">CRT Scanner</h1>
        <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-600 dark:text-slate-300">Run a one-time authorized market snapshot, persist the complete scan by run ID, and review only saved backend results.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatusCard label="Provider" value={provider?.status || 'checking'} detail={provider?.message || 'Checking backend provider...'} />
        <StatusCard label="Scan state" value={activeRun?.status || 'idle'} detail={activeRun ? `${activeRun.processed_symbols || 0} of ${activeRun.total_symbols || 'stored universe'} symbols processed` : 'No scan runs automatically.'} />
        <StatusCard label="Saved results" value={String(results.length)} detail={activeRun ? `Scan run: ${activeRun.id}` : 'Select or run a scan.'} />
      </section>

      <section className="border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black">Scan filters</h2>
          <span className="text-xs font-bold text-slate-500">Filters will apply on next scan.</span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Exchange" value="NSE" options={['NSE']} onChange={() => {}} />
          <Select label="Segment" value="EQ" options={['EQ']} onChange={() => {}} />
          <Select label="Timeframe" value={filters.timeframe} options={[...CRT_TIMEFRAMES]} onChange={(value) => setFilters((f) => ({ ...f, timeframe: value as CrtScanFilters['timeframe'] }))} />
          <Select label="CRT Direction" value={filters.direction} options={['Bullish','Bearish','Both']} onChange={(value) => setFilters((f) => ({ ...f, direction: value as CrtScanFilters['direction'] }))} />
          <Select label="Mode" value={filters.mode} options={['Forming','Confirmed','Completed']} onChange={(value) => setFilters((f) => ({ ...f, mode: value as CrtScanFilters['mode'] }))} />
          <NumberField label="Min price" value={filters.minPrice} onChange={(value) => setFilters((f) => ({ ...f, minPrice: value }))} />
          <NumberField label="Max price" value={filters.maxPrice} onChange={(value) => setFilters((f) => ({ ...f, maxPrice: value }))} />
          <NumberField label="Min average volume" value={filters.minAverageVolume} onChange={(value) => setFilters((f) => ({ ...f, minAverageVolume: value }))} />
          <NumberField label="Min market cap" value={filters.minMarketCap || 0} onChange={(value) => setFilters((f) => ({ ...f, minMarketCap: value || undefined }))} />
          <label className="grid gap-1 text-xs font-bold">Sector<input value={filters.sector || ''} onChange={(e) => setFilters((f) => ({ ...f, sector: e.target.value || undefined }))} className="border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" /></label>
          <NumberField label="Min CRT score" value={filters.minScore} onChange={(value) => setFilters((f) => ({ ...f, minScore: value }))} />
          <NumberField label="Minimum risk-reward" value={filters.minimumRiskReward} onChange={(value) => setFilters((f) => ({ ...f, minimumRiskReward: value }))} />
          <Select label="EMA period" value={String(filters.emaPeriod)} options={['20','50','100','200']} onChange={(value) => setFilters((f) => ({ ...f, emaPeriod: Number(value) as CrtScanFilters['emaPeriod'] }))} />
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <Toggle label="Volume confirmation" checked={filters.volumeConfirmation} onChange={(value) => setFilters((f) => ({ ...f, volumeConfirmation: value }))} />
          <Toggle label="Trend filter" checked={filters.trendFilter} onChange={(value) => setFilters((f) => ({ ...f, trendFilter: value }))} />
          <Toggle label="Exclude low liquidity" checked={filters.excludeLowLiquidity} onChange={(value) => setFilters((f) => ({ ...f, excludeLowLiquidity: value }))} />
          <Toggle label="Exclude insufficient history" checked={filters.excludeInsufficientHistory} onChange={(value) => setFilters((f) => ({ ...f, excludeInsufficientHistory: value }))} />
          <Toggle label="Show weak setups" checked={filters.showWeakSetups} onChange={(value) => setFilters((f) => ({ ...f, showWeakSetups: value }))} />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={() => void runScan()} disabled={state === 'scanning' || provider?.status !== 'configured'} className="inline-flex items-center gap-2 bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-50"><Play size={16} /> {state === 'scanning' ? 'Scanning market data...' : 'Run CRT Scan'}</button>
          <button type="button" onClick={() => void runScan()} disabled={state === 'scanning' || !activeRun} className="inline-flex items-center gap-2 border border-slate-300 px-5 py-3 text-sm font-black disabled:opacity-50 dark:border-slate-700"><RefreshCw size={16} /> Refresh Market Data &amp; Scan Again</button>
        </div>
        <p className={`mt-4 flex items-start gap-2 text-sm font-semibold ${state === 'error' ? 'text-rose-700' : state === 'setup_required' ? 'text-amber-700' : 'text-slate-600'}`}>{state === 'error' || state === 'setup_required' ? <AlertTriangle size={16} /> : <Activity size={16} />}{message}</p>
      </section>

      {chartResult && <section className="border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-black">{chartResult.symbol} saved CRT candles</h2><p className="text-xs font-semibold text-slate-500">Data captured at: {chartResult.dataCapturedAt} · Scan run: {chartResult.scanRunId}</p></div><button type="button" onClick={() => setChartResult(null)} className="text-xs font-bold text-slate-600">Close</button></div>
        <div className="mt-4"><CrtCandlePreviewChart candles={chartResult.chartCandles} symbol={chartResult.symbol} /></div>
      </section>}

      <section>
        <h2 className="mb-3 text-lg font-black">Saved scan results</h2>
        <StockProDataTable data={results} columns={columns} emptyMessage="No saved result matches this scan. Run a configured provider scan or select a completed previous run." filterPlaceholder="Filter saved results..." />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-black">Previous scans</h2>
        <div className="grid gap-2">
          {runs.length ? runs.map((run) => <button key={run.id} type="button" onClick={() => void openSavedRun(run)} className="flex flex-wrap items-center justify-between gap-2 border border-slate-200 bg-white p-3 text-left text-sm dark:border-slate-800 dark:bg-slate-950"><span className="font-bold">{run.id}</span><span>{run.status} · {run.result_count || 0} results · {new Date(run.created_at).toLocaleString()}</span></button>) : <p className="text-sm font-semibold text-slate-500">No saved scan runs are available.</p>}
        </div>
      </section>
    </div>
  );
}

function StatusCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 text-lg font-black">{value.replace('_', ' ')}</p><p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p></article>;
}
function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="grid gap-1 text-xs font-bold">{label}<select value={value} onChange={(e) => onChange(e.target.value)} className="border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="grid gap-1 text-xs font-bold">{label}<input type="number" min="0" value={value} onChange={(e) => onChange(Number(e.target.value))} className="border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" /></label>;
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="inline-flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-emerald-500" />{label}</label>;
}
