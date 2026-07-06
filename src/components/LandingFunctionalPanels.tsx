import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertCircle, BarChart3, BookOpen, CalendarDays, Clock3, Newspaper, Search, TableProperties } from 'lucide-react';
import AdSlot from './AdSlot';
import LandingTradingViewChart from './LandingTradingViewChart';
import LiveMarketReads from './LiveMarketReads';
import { fetchMarketData, providerLabel } from '../core/marketDataClient';
import type { MarketDataStatus, MarketQuote, OptionChainResponse } from '../core/marketDataProvider';

interface LandingStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  exchange?: string;
}

interface OiSnapshot {
  totalCallOi: number;
  totalPutOi: number;
  pcr: number | null;
  maxPain: number | null;
  timestamp: string | null;
  label: string;
  source: string;
  message: string;
}

const portalIds = ['landing-nav-search-root', 'landing-hero-ad-root', 'landing-market-workspace-root', 'landing-live-news-root'] as const;
type PortalId = (typeof portalIds)[number];

function cleanSymbol(symbol: string) {
  return symbol.toUpperCase().replace(/^NSE:/, '').replace(/\.NS$|\.BO$/i, '');
}

function compact(value: number) {
  return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 2 }).format(value);
}

function formatNumber(value: number | null, digits = 2) {
  if (value === null || !Number.isFinite(value)) return 'Unavailable';
  return value.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function normalizeOi(payload: any): OiSnapshot {
  const data = payload?.data ?? payload;
  const rows = Array.isArray(data?.records?.data) ? data.records.data : Array.isArray(data?.options) ? data.options : [];
  const totalCallOi = Number(data?.totalCallOi) || rows.reduce((sum: number, row: any) => sum + Number(row?.CE?.openInterest ?? row?.callOi ?? 0), 0);
  const totalPutOi = Number(data?.totalPutOi) || rows.reduce((sum: number, row: any) => sum + Number(row?.PE?.openInterest ?? row?.putOi ?? 0), 0);
  const rawPcr = Number(data?.pcr);
  const pcr = Number.isFinite(rawPcr) && rawPcr > 0 ? rawPcr : totalCallOi > 0 ? totalPutOi / totalCallOi : null;
  const rawMaxPain = Number(data?.maxPain);
  const strikes = rows.map((row: any) => Number(row?.strikePrice)).filter((strike: number) => Number.isFinite(strike));
  const calculatedMaxPain = strikes.length > 0
    ? strikes.reduce((best: { strike: number; pain: number }, settlement: number) => {
        const pain = rows.reduce((sum: number, row: any) => {
          const strike = Number(row?.strikePrice) || 0;
          const callOi = Number(row?.CE?.openInterest ?? row?.callOi ?? 0);
          const putOi = Number(row?.PE?.openInterest ?? row?.putOi ?? 0);
          return sum + Math.max(0, settlement - strike) * callOi + Math.max(0, strike - settlement) * putOi;
        }, 0);
        return pain < best.pain ? { strike: settlement, pain } : best;
      }, { strike: strikes[0], pain: Number.POSITIVE_INFINITY }).strike
    : null;
  const timestamp = data?.records?.timestamp || data?.timestamp || payload?.updatedAt || null;
  const source = String(payload?.source || data?.source || '').toLowerCase();

  return {
    totalCallOi,
    totalPutOi,
    pcr,
    maxPain: Number.isFinite(rawMaxPain) && rawMaxPain > 0 ? rawMaxPain : calculatedMaxPain,
    timestamp,
    label: providerLabel(payload),
    source: String(payload?.source || data?.source || 'unknown'),
    message: String(payload?.message || data?.message || 'Provider metadata unavailable.'),
  };
}

export default function LandingFunctionalPanels() {
  const navigate = useNavigate();
  const [targets, setTargets] = useState<Partial<Record<PortalId, HTMLElement>>>({});
  const [stocks, setStocks] = useState<LandingStock[]>([]);
  const [stocksLoading, setStocksLoading] = useState(true);
  const [stocksError, setStocksError] = useState<string | null>(null);
  const [stocksProviderStatus, setStocksProviderStatus] = useState<MarketDataStatus | null>(null);
  const [query, setQuery] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY');
  const [oi, setOi] = useState<OiSnapshot | null>(null);
  const [oiLoading, setOiLoading] = useState(true);
  const [oiError, setOiError] = useState<string | null>(null);

  useEffect(() => {
    const refreshTargets = () => {
      setTargets((current) => {
        const next = Object.fromEntries(portalIds.map((id) => [id, document.getElementById(id)]).filter((entry) => entry[1])) as Partial<Record<PortalId, HTMLElement>>;
        return portalIds.every((id) => current[id] === next[id]) ? current : next;
      });
    };
    refreshTargets();
    const observer = new MutationObserver(refreshTargets);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    const loadStocks = async () => {
      try {
        setStocksLoading(true);
        setStocksError(null);
        const json = await fetchMarketData<MarketQuote[]>('/api/live/stocks', AbortSignal.timeout(15000));
        if (active) setStocksProviderStatus(json);
        if (json.status !== 'ok') throw new Error(json.message || 'Stock list request failed');
        const nextStocks = Array.isArray(json.data) ? json.data.filter((item: any) => item?.symbol && item?.name && Number.isFinite(Number(item?.price))) as LandingStock[] : [];
        if (active) setStocks(nextStocks);
      } catch (error: any) {
        if (active) {
          setStocks([]);
          setStocksError(error?.message || 'Stock data is unavailable');
        }
      } finally {
        if (active) setStocksLoading(false);
      }
    };
    loadStocks();
    return () => { active = false; };
  }, []);

  const fetchOi = useCallback(async (symbol: string) => {
    try {
      setOiLoading(true);
      setOiError(null);
      setOi(null);
      const lookup = cleanSymbol(symbol) || 'NIFTY';
      const json = await fetchMarketData<OptionChainResponse>(`/api/live/option-chain/${encodeURIComponent(lookup)}`, AbortSignal.timeout(15000));
      if (json.status !== 'ok' || !json.data) throw new Error(json.message || 'Option-chain request failed');
      setOi(normalizeOi(json));
    } catch (error: any) {
      setOiError(error?.message || 'Open-interest data is unavailable');
    } finally {
      setOiLoading(false);
    }
  }, []);

  useEffect(() => { fetchOi(selectedSymbol); }, [fetchOi, selectedSymbol]);

  const selectedStock = useMemo(() => stocks.find((stock) => cleanSymbol(stock.symbol) === cleanSymbol(selectedSymbol)) || null, [stocks, selectedSymbol]);
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return stocks.slice(0, 6);
    return stocks.filter((stock) => stock.symbol.toLowerCase().includes(needle) || stock.name.toLowerCase().includes(needle)).slice(0, 6);
  }, [query, stocks]);

  const chooseStock = (stock: LandingStock) => {
    setSelectedSymbol(stock.symbol);
    setQuery(`${cleanSymbol(stock.symbol)} — ${stock.name}`);
  };

  const searchControl = (
    <div className="relative w-full">
      <Search size={14} className="pointer-events-none absolute left-3 top-2.5 text-slate-400" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={stocksLoading ? 'Loading delayed stock list…' : 'Search NSE stocks…'}
        aria-label="Search and select a stock"
        className="w-full rounded border border-gray-200 bg-gray-100 py-2 pl-9 pr-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white"
      />
      {query && matches.length > 0 && !matches.some((stock) => query === `${cleanSymbol(stock.symbol)} — ${stock.name}`) && (
        <div className="absolute left-0 right-0 top-10 z-[70] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
          {matches.map((stock) => (
            <button key={stock.symbol} type="button" onClick={() => chooseStock(stock)} className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-blue-50">
              <span className="text-xs font-black text-slate-800">{cleanSymbol(stock.symbol)}</span>
              <span className="ml-3 truncate text-[10px] font-semibold text-slate-500">{stock.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const routeButtons = [
    { label: 'Screener', path: '/screener', icon: TableProperties },
    { label: 'Option Chain', path: '/option-chain', icon: BarChart3 },
    { label: 'Daily Brief', path: '/daily-brief', icon: CalendarDays },
    { label: 'News', path: '/news', icon: Newspaper },
    { label: 'Blog', path: '/blog', icon: BookOpen },
    { label: 'Pricing', path: '/pricing', icon: Activity },
    { label: 'Waitlist', path: '/contact?interest=landing', icon: Clock3 },
  ];

  const workspace = (
    <section className="border-b border-slate-200 bg-slate-50 py-12" aria-labelledby="landing-market-workspace-title">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">Market workspace</div>
            <h2 id="landing-market-workspace-title" className="mt-2 text-2xl font-black tracking-tight text-slate-950">Research a stock with provider-backed tools</h2>
            <p className="mt-2 max-w-2xl text-xs font-semibold leading-5 text-slate-500">Educational analytics only, not investment advice. Quotes and option-chain values are delayed/sample until provider setup.</p>
          </div>
          <div className="w-full lg:w-96">{searchControl}</div>
        </div>

        <nav className="my-6 flex flex-wrap gap-2" aria-label="StockPro feature navigation">
          {routeButtons.map(({ label, path, icon: Icon }) => (
            <button key={path} type="button" onClick={() => navigate(path)} data-analytics-event={label === 'Waitlist' ? 'waitlist_click' : 'tool_open_click'} data-analytics-label={`landing:${label}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700">
              <Icon size={13} /> {label}
            </button>
          ))}
        </nav>

        {stocksError && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800"><AlertCircle size={15} /> Quote list unavailable: {stocksError} No substitute values are shown.</div>
        )}

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8"><LandingTradingViewChart symbol={cleanSymbol(selectedSymbol)} /></div>
          <div className="space-y-4 lg:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Selected quote</div>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div><div className="font-mono text-lg font-black text-slate-950">{cleanSymbol(selectedSymbol)}</div><div className="mt-1 text-[11px] font-semibold text-slate-500">{selectedStock?.name || (selectedSymbol === 'NIFTY' ? 'Nifty 50 index' : 'Quote unavailable')}</div></div>
                <div className="text-right"><div className="font-mono text-xl font-black text-slate-950">{selectedStock ? `₹${formatNumber(Number(selectedStock.price))}` : 'Unavailable'}</div>{selectedStock && <div className={`text-[11px] font-black ${Number(selectedStock.changePercent) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{Number(selectedStock.changePercent) >= 0 ? '+' : ''}{formatNumber(Number(selectedStock.changePercent))}%</div>}</div>
              </div>
              <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-amber-700">{providerLabel(stocksProviderStatus)}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3"><div><div className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600">Open interest snapshot</div><div className="mt-1 text-xs font-black text-slate-900">{cleanSymbol(selectedSymbol)}</div></div><span className="rounded bg-amber-50 px-2 py-1 text-[8px] font-black uppercase text-amber-700">{oiError ? 'Unavailable' : oi?.label || (oiLoading ? 'Checking source' : 'Unavailable')}</span></div>
              {oiLoading ? <div className="py-10 text-center text-xs font-bold text-slate-400">Loading option-chain data…</div> : oiError ? <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">{oiError} No substitute values are shown.</div> : oi && (
                <>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <OiMetric label="Total call OI" value={compact(oi.totalCallOi)} />
                    <OiMetric label="Total put OI" value={compact(oi.totalPutOi)} />
                    <OiMetric label="PCR" value={formatNumber(oi.pcr)} />
                    <OiMetric label="Max pain" value={oi.maxPain === null ? 'Unavailable' : formatNumber(oi.maxPain, 0)} />
                  </div>
                  <div className="mt-4 space-y-1 text-[10px] font-semibold text-slate-400">
                    <div>Provider: {oi.source} · {oi.message}</div>
                    <div>Timestamp: {oi.timestamp ? new Date(oi.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Unavailable'}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <>
      {targets['landing-nav-search-root'] && createPortal(searchControl, targets['landing-nav-search-root'])}
      {targets['landing-hero-ad-root'] && createPortal(<div className="mx-auto max-w-7xl px-6 py-6"><AdSlot size="leaderboard" /></div>, targets['landing-hero-ad-root'])}
      {targets['landing-market-workspace-root'] && createPortal(workspace, targets['landing-market-workspace-root'])}
      {targets['landing-live-news-root'] && createPortal(<div className="space-y-6"><LiveMarketReads landing /><AdSlot size="in_feed" label="Sponsored" /></div>, targets['landing-live-news-root'])}
    </>
  );
}

function OiMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><div className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</div><div className="mt-1 font-mono text-sm font-black text-slate-900">{value}</div></div>;
}
