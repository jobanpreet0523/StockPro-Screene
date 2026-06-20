import React, { useState, useEffect } from 'react';
import { Search, Globe, Landmark, Filter, RefreshCw, Sparkles, TrendingUp, TrendingDown, Layers, HelpCircle, DollarSign, Calendar } from 'lucide-react';
import { useTheme } from './ThemeContext';

interface UsStock {
  symbol: string;
  name: string;
  sector: string;
  priceUsd: number;
  priceInr: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
}

interface IndexQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const US_STOCK_SECTORS: Record<string, { name: string; sector: string }> = {
  AAPL: { name: 'Apple Inc.', sector: 'Technology' },
  MSFT: { name: 'Microsoft Corporation', sector: 'Technology' },
  GOOGL: { name: 'Alphabet Inc.', sector: 'Communication Services' },
  AMZN: { name: 'Amazon.com, Inc.', sector: 'Consumer Cyclical' },
  META: { name: 'Meta Platforms, Inc.', sector: 'Communication Services' },
  NVDA: { name: 'NVIDIA Corporation', sector: 'Technology' },
  TSLA: { name: 'Tesla, Inc.', sector: 'Consumer Cyclical' },
  AMD: { name: 'Advanced Micro Devices, Inc.', sector: 'Technology' },
  INTC: { name: 'Intel Corporation', sector: 'Technology' },
  JPM: { name: 'JPMorgan Chase & Co.', sector: 'Financial Services' },
  BAC: { name: 'Bank of America Corporation', sector: 'Financial Services' },
  GS: { name: 'The Goldman Sachs Group, Inc.', sector: 'Financial Services' },
  V: { name: 'Visa Inc.', sector: 'Financial Services' },
  MA: { name: 'Mastercard Incorporated', sector: 'Financial Services' },
  JNJ: { name: 'Johnson & Johnson', sector: 'Healthcare' },
  PFE: { name: 'Pfizer Inc.', sector: 'Healthcare' },
  XOM: { name: 'Exxon Mobil Corporation', sector: 'Energy' },
  CVX: { name: 'Chevron Corporation', sector: 'Energy' },
  WMT: { name: 'Walmart Inc.', sector: 'Consumer Defensive' },
  HD: { name: 'The Home Depot, Inc.', sector: 'Consumer Cyclical' },
  DIS: { name: 'The Walt Disney Company', sector: 'Communication Services' },
  PYPL: { name: 'PayPal Holdings, Inc.', sector: 'Financial Services' },
  NFLX: { name: 'Netflix, Inc.', sector: 'Communication Services' },
  ADBE: { name: 'Adobe Inc.', sector: 'Technology' },
  CRM: { name: 'Salesforce, Inc.', sector: 'Technology' },
  KO: { name: 'The Coca-Cola Company', sector: 'Consumer Defensive' },
  PEP: { name: 'PepsiCo, Inc.', sector: 'Consumer Defensive' },
  COST: { name: 'Costco Wholesale Corporation', sector: 'Consumer Defensive' },
  MCD: { name: 'McDonald\'s Corporation', sector: 'Consumer Cyclical' },
  NKE: { name: 'NIKE, Inc.', sector: 'Consumer Cyclical' }
};

export default function UsMarketsView() {
  const { theme } = useTheme();
  const [stocks, setStocks] = useState<UsStock[]>([]);
  const [indices, setIndices] = useState<IndexQuote[]>([]);
  const [usdInrRate, setUsdInrRate] = useState<number>(83.50); // reliable fallback
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeChartSymbol, setActiveChartSymbol] = useState<string | null>(null);

  const fetchUsData = async () => {
    try {
      setLoading(true);
      const tickers = Object.keys(US_STOCK_SECTORS);
      const symbolsString = [...tickers, '^GSPC', '^IXIC', '^DJI', 'USDINR=X'].join(',');
      const res = await fetch(`/api/yahoo-finance/quotes?symbols=${encodeURIComponent(symbolsString)}`, {
        signal: AbortSignal.timeout(15000)
      });
      if (!res.ok) throw new Error('API gateway returned bad status');
      const payload = await res.json();
      const quotes = payload?.quoteResponse?.result || [];
      
      if (quotes.length === 0) throw new Error('Empty quotes array received from Yahoo Finance');

      // 1. Get USD/INR cross rate
      const forexQuote = quotes.find((q: any) => q.symbol === 'USDINR=X');
      const currentRate = forexQuote?.regularMarketPrice || 83.55;
      setUsdInrRate(currentRate);

      // 2. Parse major index bar markers
      const retrievedIndices: IndexQuote[] = [];
      const spIndex = quotes.find((q: any) => q.symbol === '^GSPC');
      const nasIndex = quotes.find((q: any) => q.symbol === '^IXIC');
      const dowIndex = quotes.find((q: any) => q.symbol === '^DJI');

      if (spIndex) {
        retrievedIndices.push({
          symbol: '^GSPC',
          name: 'S&P 500 Index',
          price: spIndex.regularMarketPrice || 0,
          change: spIndex.regularMarketChange || 0,
          changePercent: spIndex.regularMarketChangePercent || 0
        });
      }
      if (nasIndex) {
        retrievedIndices.push({
          symbol: '^IXIC',
          name: 'NASDAQ Composite',
          price: nasIndex.regularMarketPrice || 0,
          change: nasIndex.regularMarketChange || 0,
          changePercent: nasIndex.regularMarketChangePercent || 0
        });
      }
      if (dowIndex) {
        retrievedIndices.push({
          symbol: '^DJI',
          name: 'DOW JONES Industrial',
          price: dowIndex.regularMarketPrice || 0,
          change: dowIndex.regularMarketChange || 0,
          changePercent: dowIndex.regularMarketChangePercent || 0
        });
      }
      setIndices(retrievedIndices);

      // 3. Parse and construct top 30 US equities
      const parsedStocks: UsStock[] = quotes
        .filter((q: any) => US_STOCK_SECTORS[q.symbol] !== undefined)
        .map((q: any) => {
          const staticConf = US_STOCK_SECTORS[q.symbol];
          const usdPrice = q.regularMarketPrice || 0;
          return {
            symbol: q.symbol,
            name: staticConf.name,
            sector: staticConf.sector,
            priceUsd: usdPrice,
            priceInr: usdPrice * currentRate,
            change: q.regularMarketChange || 0,
            changePercent: q.regularMarketChangePercent || 0,
            volume: q.regularMarketVolume || 0,
            marketCap: q.marketCap || 0
          };
        });

      setStocks(parsedStocks);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      console.error('US Markets download failure:', err);
      setError(err?.message || 'Gateway sync latency issues. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsData();
    const interval = setInterval(fetchUsData, 60000); // 60 seconds auto ticking
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatVolume = (vol: number) => {
    const v = vol ?? 0;
    if (v >= 1000000000) return `${(typeof v === 'number' ? (v / 1000000000).toFixed(1) : Number(v / 1000000000).toFixed(1))}B`;
    if (v >= 1000000) return `${(typeof v === 'number' ? (v / 1000000).toFixed(1) : Number(v / 1000000).toFixed(1))}M`;
    if (v >= 1000) return `${(typeof v === 'number' ? (v / 1000).toFixed(0) : Number(v / 1000).toFixed(0))}K`;
    return v.toLocaleString();
  };

  const formatMarketCap = (cap: number) => {
    const c = cap ?? 0;
    if (c >= 1000000000000) return `$${(typeof c === 'number' ? (c / 1000000000000).toFixed(2) : Number(c / 1000000000000).toFixed(2))}T`;
    if (c >= 1000000000) return `$${(typeof c === 'number' ? (c / 1000000000).toFixed(1) : Number(c / 1000000000).toFixed(1))}B`;
    return `$${(typeof c === 'number' ? (c / 1000000).toFixed(0) : Number(c / 1000000).toFixed(0))}M`;
  };

  const sectors = ['All', ...new Set(Object.values(US_STOCK_SECTORS).map(s => s.sector))];

  const filteredStocks = stocks.filter(s => {
    const matchesSearch = s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === 'All' || s.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  return (
    <div className="flex flex-col gap-6" id="us_markets_workspace">
      {/* Ticker Bar indices overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="us_indices_ticker">
        {indices.length > 0 ? (
          indices.map(idx => {
            const isUp = idx.changePercent >= 0;
            return (
              <div 
                key={idx.symbol}
                className="p-3 bg-white/20 dark:bg-slate-950/40 backdrop-blur-xl border border-slate-205/50 dark:border-slate-855/50 rounded-xl shadow-xs transition hover:scale-[1.01] duration-150 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-800" />
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wide">{idx.name}</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                    {idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <div className={`text-[10px] font-bold flex items-center gap-0.5 font-mono ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      <span>{isUp ? '+' : ''}{typeof idx.changePercent === 'number' ? idx.changePercent.toFixed(2) : Number(idx.changePercent || 0).toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          /* Empty/Loading indicators state placeholders */
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl animate-pulse h-16" />
          ))
        )}

        {/* Currency cross rate ticker widget */}
        <div className="p-3 bg-white/20 dark:bg-slate-950/40 backdrop-blur-xl border border-slate-205/50 dark:border-slate-855/50 rounded-xl shadow-xs transition hover:scale-[1.01] duration-150 relative">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wide">Live FX Rate (USD/INR)</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-sm font-extrabold text-[#38bdf8] font-mono">
              ₹{typeof usdInrRate === 'number' ? usdInrRate.toFixed(4) : Number(usdInrRate || 83.5).toFixed(4)}
            </span>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1 rounded font-black uppercase border border-emerald-500/10">Connected</span>
          </div>
        </div>
      </div>

      {/* Main Filter & Action header toolbar */}
      <div className="bg-white/20 dark:bg-slate-950/40 backdrop-blur-xl border border-slate-205/50 dark:border-slate-855/50 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-center w-full md:w-auto gap-3">
          {/* Search bar input container */}
          <div className="relative w-full md:w-72">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search US tickers (e.g., AAPL)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder-slate-450 transition"
            />
          </div>

          {/* Core Sector Filter Select */}
          <div className="flex items-center gap-2 w-full md:w-auto font-mono text-xs text-slate-400">
            <Filter size={13} className="text-slate-500 hidden md:block" />
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full md:w-48 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none transition active:scale-95"
            >
              {sectors.map(sec => (
                <option key={sec} value={sec}>{sec} Sector</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sync telemetry logs updates */}
        <div className="flex items-center gap-3 self-end md:self-auto text-xs font-mono">
          {lastUpdated && (
            <span className="text-[10px] text-slate-400">Synced: {lastUpdated.toLocaleTimeString()}</span>
          )}
          <button
            onClick={fetchUsData}
            disabled={loading}
            className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-40"
          >
            <RefreshCw size={11} className={`${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Primary Screener Grid Board Table */}
      <div className="bg-white/20 dark:bg-slate-950/40 backdrop-blur-xl border border-slate-205/50 dark:border-slate-855/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/60 font-sans text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 text-left">Ticker</th>
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Sector</th>
                <th className="py-3 px-4 text-right">Price (USD)</th>
                <th className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">Price (INR Equiv)</th>
                <th className="py-3 px-4 text-right">Change (%)</th>
                <th className="py-3 px-4 text-right">Volume</th>
                <th className="py-3 px-4 text-right">Market Cap</th>
                <th className="py-3 px-4 text-center">Interactive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono">
              {loading && stocks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-mono">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin shrink-0" />
                      <span>Syncing bulk Wall Street quotes feed...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-mono">
                    No active US equity nodes matches your query terms.
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stk) => {
                  const isUp = stk.changePercent >= 0;
                  return (
                    <tr 
                      key={stk.symbol}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all duration-150 select-none"
                    >
                      {/* TICKER SYMBOL */}
                      <td className="py-3 px-4 text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">🇺🇸</span>
                          <span className="font-sans font-black text-slate-900 dark:text-white uppercase tracking-tight">{stk.symbol}</span>
                        </div>
                      </td>

                      {/* COMPANY NAME */}
                      <td className="py-3 px-4">
                        <span className="font-sans font-semibold text-slate-850 dark:text-slate-300 truncate max-w-[180px] block">{stk.name}</span>
                      </td>

                      {/* SECTOR */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-[10px] font-sans font-bold bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-md">
                          {stk.sector}
                        </span>
                      </td>

                      {/* USD PRICE */}
                      <td className="py-3 px-4 text-right font-bold text-slate-800 dark:text-slate-200">
                        ${stk.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* INR EQUIV */}
                      <td className="py-3 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-450">
                        ₹{stk.priceInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* CHANGE % */}
                      <td className={`py-3 px-4 text-right font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {(stk.changePercent ?? 0) >= 0 ? '+' : ''}{typeof stk.changePercent === 'number' ? stk.changePercent.toFixed(2) : Number(stk.changePercent || 0).toFixed(2)}%
                      </td>

                      {/* VOLUME */}
                      <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400">
                        {formatVolume(stk.volume)}
                      </td>

                      {/* MARKET CAP */}
                      <td className="py-3 px-4 text-right text-slate-900 dark:text-white font-extrabold">
                        {formatMarketCap(stk.marketCap)}
                      </td>

                      {/* INTERACTIVE ACTIONS */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setActiveChartSymbol(stk.symbol)}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-[#1a1438]/40 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40 rounded-lg text-[10px] font-bold font-sans transition active:scale-95 cursor-pointer"
                        >
                          View Chart
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TradingView Chart Overlay Modal */}
      {activeChartSymbol && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-[200] animate-fadeIn">
          <div className="bg-white dark:bg-slate-950 rounded-2xl w-[90vw] h-[80vh] flex flex-col shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 border-opacity-50">
              <span className="font-bold text-slate-800 dark:text-white uppercase font-sans text-sm tracking-widest flex items-center gap-1.5">
                <span>🇺🇸</span>
                <span>TradingView Chart: <span className="text-emerald-500">{activeChartSymbol}</span></span>
              </span>
              <button 
                onClick={() => setActiveChartSymbol(null)} 
                className="p-1 px-3.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/25 dark:hover:bg-rose-950/45 text-rose-500 rounded-lg text-xs font-bold transition duration-150 cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="flex-1 w-full bg-slate-100 flex items-center justify-center relative">
               <iframe 
                  src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_1&symbol=NASDAQ:${activeChartSymbol}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=America%2FNew_York&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=localhost&utm_medium=widget&utm_campaign=chart&utm_term=${activeChartSymbol}`}
                  width="100%"
                  height="100%"
                  allowFullScreen
                  className="bg-black"
                  style={{border: 'none'}}
               />
            </div>
          </div>
        </div>
      )}

      {/* Tiny disclaimer */}
      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans leading-relaxed text-center italic mt-1">
        * Wall Street pricing data and forex cross rates are feed proxies fetched from Yahoo Finance. Equivalent INR calculation is mathematically converted using the live exchange price ticker.
      </p>
    </div>
  );
}
