import React, { useEffect, useState, useMemo } from 'react';
import { HelpCircle, RefreshCw, Calculator, ArrowUpRight, ArrowDownRight, ShieldCheck, PlayCircle, PlusCircle, Trash2, TrendingUp, Search, Download, Presentation, Lock } from 'lucide-react';
import { OptionChain, OptionData, Position } from '../types';
import { useTheme } from './ThemeContext';
import StockChart from './StockChart';
import { useAuth } from '../contexts/AuthContext';
import { fetchMarketData, providerLabel } from '../core/marketDataClient';
import type { MarketDataStatus, OptionChainResponse } from '../core/marketDataProvider';

interface OptionChainViewProps {
  symbol: string;
  currentPrice?: number;
  stockName?: string;
  onOrderAdded?: (pos: Position) => void;
}

export default function OptionChainView({ symbol, currentPrice, stockName: propStockName, onOrderAdded }: OptionChainViewProps) {
  const { theme } = useTheme();
  const { isPro } = useAuth();
  const [chain, setChain] = useState<OptionChain | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [chainError, setChainError] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<MarketDataStatus | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedStrike, setSelectedStrike] = useState<OptionData | null>(null);
  const [simPositions, setSimPositions] = useState<Position[]>([]);
  const [simDirection, setSimDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [simOptionType, setSimOptionType] = useState<'CALL' | 'PUT'>('CALL');
  const [simQty, setSimQty] = useState<number>(50); // Lot size default for index

  const [sortField, setSortField] = useState<'NONE' | 'CALL_LTP' | 'CALL_IV' | 'CALL_OICHG' | 'PUT_LTP' | 'PUT_IV' | 'PUT_OICHG'>('NONE');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [strikeSearch, setStrikeSearch] = useState<string>('');
  const [showChart, setShowChart] = useState<boolean>(true);

  const stockName = useMemo(() => {
    if (propStockName) return propStockName;
    if (symbol === '^NSEI') return 'NIFTY 50 Index';
    if (symbol === '^NSEBANK') return 'BANK NIFTY Index';
    if (symbol === '^BSESN') return 'SENSEX Index';
    if (symbol === '^IXIC') return 'NASDAQ Composite Index';
    return symbol;
  }, [symbol, propStockName]);

  const handleSort = (field: 'CALL_LTP' | 'CALL_IV' | 'CALL_OICHG' | 'PUT_LTP' | 'PUT_IV' | 'PUT_OICHG') => {
    if (sortField === field) {
      if (sortOrder === 'ASC') {
        setSortOrder('DESC');
      } else {
        setSortField('NONE');
      }
    } else {
      setSortField(field);
      setSortOrder('ASC');
    }
  };

  const sortedOptions = useMemo(() => {
    if (!chain?.options) return [];
    const optionsCopy = [...chain.options];
    if (sortField === 'NONE') return optionsCopy;

    return optionsCopy.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      switch (sortField) {
        case 'CALL_OICHG':
          valA = a.callOiChg;
          valB = b.callOiChg;
          break;
        case 'CALL_IV':
          valA = a.callIv;
          valB = b.callIv;
          break;
        case 'CALL_LTP':
          valA = a.callLtp;
          valB = b.callLtp;
          break;
        case 'PUT_LTP':
          valA = a.putLtp;
          valB = b.putLtp;
          break;
        case 'PUT_IV':
          valA = a.putIv;
          valB = b.putIv;
          break;
        case 'PUT_OICHG':
          valA = a.putOiChg;
          valB = b.putOiChg;
          break;
        default:
          return 0;
      }

      if (valA !== valB) {
        return sortOrder === 'ASC' ? valA - valB : valB - valA;
      }

      // Stable sorting tie-breaker using strike price
      return a.strikePrice - b.strikePrice;
    });
  }, [chain?.options, sortField, sortOrder]);

  const filteredOptions = useMemo(() => {
    let list = sortedOptions;

    // NIFTY specific: Display strikes within ±500 from ATM
    const spot = chain?.spotPrice || 0;
    const cleanSym = (chain?.symbol || symbol || '').toUpperCase();
    if (spot > 0 && (cleanSym === 'NIFTY' || cleanSym.includes('NIFTY'))) {
      const strikeInterval = cleanSym.includes('BANKNIFTY') ? 100 : 50;
      const atmStrike = Math.round(spot / strikeInterval) * strikeInterval;
      list = list.filter(opt => opt.strikePrice >= atmStrike - 500 && opt.strikePrice <= atmStrike + 500);
    }

    if (strikeSearch.trim() !== '') {
      const q = strikeSearch.trim();
      list = list.filter(opt => opt.strikePrice.toString().includes(q));
    }
    return list;
  }, [sortedOptions, strikeSearch, chain?.spotPrice, chain?.symbol, symbol]);

  const handleDownloadCSV = () => {
    if (!chain || !filteredOptions.length) return;

    const headers = [
      'Call OI (Lot)',
      'Call Chg OI',
      'Call Volume',
      'Call IV (%)',
      'Call LTP (INR)',
      'Call Change (%)',
      'Strike Price',
      'Put Change (%)',
      'Put LTP (INR)',
      'Put IV (%)',
      'Put Volume',
      'Put Chg OI',
      'Put OI (Lot)'
    ];

    const rows = filteredOptions.map(option => [
      option.callOi,
      option.callOiChg,
      option.callVol,
      option.callIv,
      option.callLtp,
      option.callChange,
      option.strikePrice,
      option.putChange,
      option.putLtp,
      option.putIv,
      option.putVol,
      option.putOiChg,
      option.putOi
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        if (val === null || val === undefined) return '';
        const strVal = String(val);
        return strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')
          ? `"${strVal.replace(/"/g, '""')}"`
          : strVal;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${chain.symbol}_option_chain_${chain.expiryDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Option chain fetching
  useEffect(() => {
    async function fetchChain() {
      setLoading(true);
      const cleanSymbol = symbol.endsWith('.NS') ? symbol.replace('.NS', '') : symbol;

      const upperSym = cleanSymbol.toUpperCase();
      const lookupSymbol = upperSym === '^NSEI' ? 'NIFTY' : upperSym === '^NSEBANK' ? 'BANKNIFTY' : upperSym;

      try {
        setChainError(null);
        const response = await fetchMarketData<OptionChainResponse>(`/api/live/option-chain/${encodeURIComponent(lookupSymbol)}`, AbortSignal.timeout(15000));
        setProviderStatus(response);
        if (response.status !== 'ok' || !response.data || response.data.options.length === 0) throw new Error(response.message || 'Option-chain provider returned no data.');
        const chainData: OptionChain = response.data;
        setChain(chainData);
        setSelectedStrike(chainData.options[Math.floor(chainData.options.length / 2)]);
      } catch (err: any) {
        setChain(null);
        setSelectedStrike(null);
        setChainError(err?.message || 'Option-chain provider is unavailable.');
      } finally {
        setLoading(false);
      }
    }

    fetchChain();

    // Index options refresh every 3 minutes (180000ms), standard stocks are normal polling intervals
    const cleanSym = symbol.endsWith('.NS') ? symbol.replace('.NS', '') : symbol;
    const isIndexStr = cleanSym === 'NIFTY' || cleanSym === 'BANKNIFTY' || cleanSym === 'FINNIFTY' || cleanSym.startsWith('^');
    const pollInterval = isIndexStr ? 60_000 : 15 * 60 * 1000;
    const timer = setInterval(fetchChain, pollInterval);
    return () => clearInterval(timer);
  }, [symbol, reloadKey]);

  // Calculations for Option payoff diagrams
  const minStrategyPrice = chain ? chain.spotPrice * 0.88 : 0;
  const maxStrategyPrice = chain ? chain.spotPrice * 1.12 : 0;
  const payoffDataPointsCount = 20;

  const payoffPoints = useMemo(() => {
    if (simPositions.length === 0 || !chain) return [];
    
    const points: { price: number, pnl: number }[] = [];
    const step = (maxStrategyPrice - minStrategyPrice) / payoffDataPointsCount;

    for (let i = 0; i <= payoffDataPointsCount; i++) {
      const testPrice = minStrategyPrice + i * step;
      let totalPnL = 0;

      for (const pos of simPositions) {
        const underlyingStrike = pos.strike || 0;
        let pnlAtExpiry = 0;

        if (pos.optionType === 'CALL') {
          const payoff = Math.max(0, testPrice - underlyingStrike);
          pnlAtExpiry = pos.direction === 'BUY'
            ? (payoff - pos.entryPrice) * pos.quantity
            : (pos.entryPrice - payoff) * pos.quantity;
        } else {
          const payoff = Math.max(0, underlyingStrike - testPrice);
          pnlAtExpiry = pos.direction === 'BUY'
            ? (payoff - pos.entryPrice) * pos.quantity
            : (pos.entryPrice - payoff) * pos.quantity;
        }
        totalPnL += pnlAtExpiry;
      }

      points.push({ price: Math.round(testPrice), pnl: Math.round(totalPnL) });
    }
    return points;
  }, [simPositions, chain, minStrategyPrice, maxStrategyPrice]);

  const handleAddPositionFromStrike = (strike: OptionData, type: 'CALL' | 'PUT', direction: 'BUY' | 'SELL') => {
    const ltp = type === 'CALL' ? strike.callLtp : strike.putLtp;
    const newPos: Position = {
      id: Math.random().toString(36).substring(3),
      symbol: symbol,
      type: type === 'CALL' ? 'CE' : 'PE',
      strike: strike.strikePrice,
      optionType: type,
      direction: direction,
      entryPrice: ltp,
      currentPrice: ltp,
      quantity: simQty
    };

    setSimPositions(prev => [...prev, newPos]);
    if (onOrderAdded) onOrderAdded(newPos);
  };

  const handleRemovePosition = (id: string) => {
    setSimPositions(prev => prev.filter(p => p.id !== id));
  };

  const formatVolume = (vol: number) => {
    const v = vol ?? 0;
    if (v >= 100000) return `${typeof v === 'number' ? (v / 1000).toFixed(0) : Number(v / 1000).toFixed(0)}K`;
    return v.toLocaleString();
  };

  const getHeaderClassName = (
    field: 'CALL_LTP' | 'CALL_IV' | 'CALL_OICHG' | 'PUT_LTP' | 'PUT_IV' | 'PUT_OICHG',
    align: 'left' | 'right' | 'center',
    padding: string = 'px-1'
  ) => {
    const isSorted = sortField === field;
    return `py-2 ${padding} ${align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center'} cursor-pointer select-none transition-all duration-250 ${
      isSorted
        ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-extrabold border-b-2 border-b-indigo-500 dark:border-b-indigo-400 shadow-inner'
        : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/50'
    }`;
  };

  // Real PCR Calculation
  const { realPcr, realCallOi, realPutOi } = useMemo(() => {
    let callOi = 0;
    let putOi = 0;
    if (chain?.options) {
      chain.options.forEach(opt => {
        callOi += opt.callOi;
        putOi += opt.putOi;
      });
    }
    const derivedPcr = callOi > 0 ? Number((typeof putOi === 'number' && typeof callOi === 'number' ? (putOi / callOi).toFixed(2) : Number((putOi || 0) / (callOi || 1)).toFixed(2))) : 1.0;
    return { realPcr: derivedPcr, realCallOi: callOi, realPutOi: putOi };
  }, [chain]);

  if (loading && !chain) {
    return (
      <div className="h-[400px] flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm" id="option_chain_loader">
        Constructing derivative math matrix...
      </div>
    );
  }

  if (!chain) {
    return (
      <div className="h-[400px] flex flex-col gap-3 items-center justify-center px-6 text-center text-xs text-slate-500 dark:text-slate-400 font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
        <span>{loading ? 'Loading option-chain provider…' : chainError || 'Option-chain data is unavailable.'}</span>
        {!loading && <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="rounded-lg bg-slate-900 px-4 py-2 font-bold text-white dark:bg-white dark:text-slate-900">Retry provider</button>}
      </div>
    );
  }

  // Intermediary details
  const spot = chain?.spotPrice || 0;

  const pcrVal = realPcr;
  const getPcrSentiment = (p: number) => {
    if (p > 1.5) return 'Bullish / Overbought support';
    if (p >= 0.8) return 'Neutral Range';
    return 'Bearish / Hard resistance';
  };

  const getPcrColorClass = (p: number) => {
    if (p > 1.5) return 'text-emerald-600 dark:text-emerald-400';
    if (p >= 0.8) return 'text-amber-500 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  return (
    <div className="flex flex-col gap-6" id="option_chain_workspace">
      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 transition-all duration-300 shadow-sm">
        <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider font-semibold">Spot Price</span>
          <span className="text-base font-extrabold text-slate-900 dark:text-white mt-1 block font-mono">
            ₹{spot.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          {providerStatus?.isLive === true ? (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1 mt-0.5 font-bold animate-pulse" title="Provider reports live data">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" /> Live provider connected
            </span>
          ) : (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono flex items-center gap-1 mt-0.5 font-bold" title={providerStatus?.message}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 dark:bg-amber-400/50" /> {providerLabel(providerStatus)}
            </span>
          )}
        </div>

        <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider font-semibold">Put-Call Ratio (PCR)</span>
          <span className={`text-base font-extrabold mt-1 block font-mono ${getPcrColorClass(pcrVal)}`}>
            {pcrVal}
          </span>
          <span className={`text-[10px] truncate block mt-0.5 font-semibold ${getPcrColorClass(pcrVal)}`}>
            {getPcrSentiment(pcrVal)}
          </span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider font-semibold">Estimated MAX PAIN</span>
          <span className="text-base font-extrabold text-rose-600 dark:text-rose-400 mt-1 block font-mono">
            ₹{chain.maxPain.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-405 truncate block mt-0.5">
            Key expiration target for option sellers
          </span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider font-semibold">Aggregate Open Interest</span>
          <div className="flex items-center justify-between mt-1 text-xs font-mono text-slate-650 dark:text-slate-300">
            <div>
              <span className="text-[9px] text-slate-500 dark:text-slate-450 block font-bold">CALLS</span>
              <span className="text-xs text-rose-600 dark:text-rose-400 font-extrabold">{formatVolume(realCallOi)}</span>
            </div>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <div className="text-right">
              <span className="text-[9px] text-slate-500 dark:text-slate-450 block font-bold font-sans">PUTS</span>
              <span className="text-xs text-emerald-650 dark:text-emerald-400 font-extrabold">{formatVolume(realPutOi)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic TradingView Chart Overlay with Stocks */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm transition-all duration-300">
        <div
          onClick={() => setShowChart(!showChart)}
          className="bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3.5 flex justify-between items-center px-4 cursor-pointer select-none transition-all duration-200"
          id="fo_chart_header"
        >
          <div className="flex items-center gap-2">
            <Presentation size={14} className="text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider font-mono">
              Technical Chart: {stockName}
            </h3>
          </div>
          <button 
            type="button"
            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-950/85 rounded transition active:scale-95 cursor-pointer"
          >
            {showChart ? 'COLLAPSE CHART [-]' : 'SHOW CHART [+]'}
          </button>
        </div>

        {showChart && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/5" id="fo_chart_body">
            <StockChart symbol={symbol} name={stockName} />
          </div>
        )}
      </div>

      {/* Main Option Chain side-by-side Sheet Grid */}
      <div id="option-matrix" className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm dark:shadow-2xl">
        <div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 flex flex-col sm:flex-row justify-between items-center px-4 gap-3">
          <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider font-mono">
            Derivatives Matrix ({chain.symbol}) — Expiry: {chain.expiryDate}
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Search size={12} />
              </span>
              <input
                type="text"
                placeholder="Search Strike Price..."
                value={strikeSearch}
                onChange={(e) => setStrikeSearch(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded pl-7 pr-3 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-450"
              />
            </div>

            <button
              onClick={handleDownloadCSV}
              id="download-csv-btn"
              title="Download currently filtered and sorted chain data as CSV"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold rounded text-xs transition duration-150 shadow-sm cursor-pointer shrink-0"
            >
              <Download size={13} />
              <span>Download CSV</span>
            </button>

            {/* Pro Feature Buttons */}
            <button
              disabled={!isPro}
              title={isPro ? "Open IV Calculator" : "Upgrade to Pro to use IV Calculator"}
              className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1 border rounded text-xs font-semibold transition shrink-0 ${
                isPro
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-80'
              }`}
            >
              {!isPro && <Lock size={12} className="text-slate-400 dark:text-slate-500" />}
              <span>IV Calculator</span>
              {!isPro && <span className="ml-1 text-[9px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-1 py-0.5 rounded font-black tracking-wider uppercase border border-emerald-200 dark:border-emerald-800">PRO</span>}
            </button>

            <button
              disabled={!isPro}
              title={isPro ? "View Block Trade workspace" : "Upgrade to Pro to view Block Trades"}
              className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1 border rounded text-xs font-semibold transition shrink-0 ${
                isPro
                  ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 cursor-pointer'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-80'
              }`}
            >
              {!isPro && <Lock size={12} className="text-slate-400 dark:text-slate-500" />}
              <span>Block Trades</span>
              {!isPro && <span className="ml-1 text-[9px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-1 py-0.5 rounded font-black tracking-wider uppercase border border-emerald-200 dark:border-emerald-800">PRO</span>}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto font-mono text-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              {/* Calls Side / Strike / Puts Side Labels */}
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-sans text-[10px] font-extrabold text-center uppercase text-slate-500 dark:text-slate-400">
                <th colSpan={6} className="py-2 border-r border-slate-200 dark:border-slate-850 text-rose-600 dark:text-rose-400 bg-rose-50/40 dark:bg-rose-955/5">Calls Derivatives</th>
                <th colSpan={1} className="py-2 border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-black">Spot</th>
                <th colSpan={6} className="py-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-955/5">Puts Derivatives</th>
              </tr>
              {/* Header Parameters */}
              <tr className="border-b border-slate-200 dark:border-slate-850 text-[9px] text-slate-550 dark:text-slate-400 text-center font-bold">
                <th className="py-2 px-2 text-slate-500 dark:text-slate-400 text-center">OI (Lot)</th>
                <th
                  onClick={() => handleSort('CALL_OICHG')}
                  className={getHeaderClassName('CALL_OICHG', 'center', 'px-1')}
                >
                  Chg OI {sortField === 'CALL_OICHG' ? (sortOrder === 'ASC' ? '▲' : '▼') : '↕'}
                </th>
                <th className="py-2 px-1 text-right text-slate-500 dark:text-slate-400">Volume</th>
                <th
                  onClick={() => handleSort('CALL_IV')}
                  className={getHeaderClassName('CALL_IV', 'center', 'px-1')}
                >
                  IV % {sortField === 'CALL_IV' ? (sortOrder === 'ASC' ? '▲' : '▼') : '↕'}
                </th>
                <th
                  onClick={() => handleSort('CALL_LTP')}
                  className={getHeaderClassName('CALL_LTP', 'right', 'px-2')}
                >
                  LTP (₹) {sortField === 'CALL_LTP' ? (sortOrder === 'ASC' ? '▲' : '▼') : '↕'}
                </th>
                <th className="py-2 px-1 text-center text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-855">% Chg</th>
                
                <th className="py-2 px-3 text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900 font-extrabold border-r border-slate-200 dark:border-slate-800 text-center">STRIKE</th>
                
                <th className="py-2 px-1 text-center text-slate-500 dark:text-slate-400 font-semibold border-r border-slate-200 dark:border-slate-800">% Chg</th>
                <th
                  onClick={() => handleSort('PUT_LTP')}
                  className={getHeaderClassName('PUT_LTP', 'left', 'px-2')}
                >
                  LTP (₹) {sortField === 'PUT_LTP' ? (sortOrder === 'ASC' ? '▲' : '▼') : '↕'}
                </th>
                <th
                  onClick={() => handleSort('PUT_IV')}
                  className={getHeaderClassName('PUT_IV', 'center', 'px-1')}
                >
                  IV % {sortField === 'PUT_IV' ? (sortOrder === 'ASC' ? '▲' : '▼') : '↕'}
                </th>
                <th className="py-2 px-1 text-left text-slate-500 dark:text-slate-400 col-volume">Volume</th>
                <th
                  onClick={() => handleSort('PUT_OICHG')}
                  className={getHeaderClassName('PUT_OICHG', 'center', 'px-1')}
                >
                  Chg OI {sortField === 'PUT_OICHG' ? (sortOrder === 'ASC' ? '▲' : '▼') : '↕'}
                </th>
                <th className="py-2 px-2 text-slate-500 dark:text-slate-400 font-semibold text-center">OI (Lot)</th>
              </tr>
            </thead>
            <tbody>
              {filteredOptions.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-500 dark:text-slate-400 font-mono text-xs">
                    No active strike price nodes matching "{strikeSearch}" found.
                  </td>
                </tr>
              ) : (
                filteredOptions.map(option => {
                  const strike = option.strikePrice;
                  // Calls are ITM when spot > strike
                  const isCallItm = spot > strike;
                  // Puts are ITM when spot < strike
                  const isPutItm = spot < strike;

                  const isCallIvHigh = option.callIv > 30;
                  const isPutIvHigh = option.putIv > 30;

                  const cleanSym = (chain?.symbol || symbol || '').toUpperCase();
                  const strikeInterval = cleanSym.includes('BANKNIFTY') ? 100 : 50;
                  const atmStrike = spot > 0 ? Math.round(spot / strikeInterval) * strikeInterval : 0;
                  const isAtm = strike === atmStrike;

                  return (
                    <tr
                      key={strike}
                      className={`border-b border-slate-100 dark:border-slate-850/60 hover:bg-slate-50 dark:hover:bg-slate-900/20 text-center select-none ${
                        isAtm
                          ? 'bg-yellow-150/50 dark:bg-yellow-500/10 font-bold border-y-2 border-yellow-400/60 dark:border-yellow-700/60'
                          : ''
                      }`}
                    >
                      {/* CALLS */}
                      <td className={`py-2 px-2 text-slate-600 dark:text-slate-350 border-l ${isAtm ? 'bg-yellow-200/10 dark:bg-yellow-500/5' : isCallItm ? 'bg-amber-100/20 dark:bg-[#292211]/30 font-semibold' : ''}`}>
                        {formatVolume(option.callOi)}
                      </td>
                      <td className={`py-2 px-1 ${option.callOiChg >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} ${isAtm ? 'bg-yellow-200/10 dark:bg-yellow-500/5' : isCallItm ? 'bg-amber-100/20 dark:bg-[#292211]/30' : ''}`}>
                        {option.callOiChg >= 0 ? '+' : ''}{formatVolume(option.callOiChg)}
                      </td>
                      <td className={`py-2 px-1 text-right text-slate-500 dark:text-slate-455 ${isAtm ? 'bg-yellow-200/10 dark:bg-yellow-500/5' : isCallItm ? 'bg-amber-100/20 dark:bg-[#292211]/30' : ''}`}>
                        {formatVolume(option.callVol)}
                      </td>
                      <td
                        title={isCallIvHigh ? 'Unusual Market Activity: Implied Volatility exceeds 30%' : undefined}
                        className={`py-2 px-1 text-[10px] transition-colors duration-200 ${
                          isCallIvHigh
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold border-l border-r border-amber-500/20 dark:bg-amber-500/10'
                            : isAtm
                              ? 'bg-yellow-250/20 dark:bg-yellow-500/10 text-slate-700 dark:text-slate-350'
                              : isCallItm
                                ? 'bg-amber-100/20 dark:bg-[#292211]/30 text-slate-600 dark:text-slate-350'
                                : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {option.callIv}%
                      </td>

                      {/* LTP - Click trigger simulation */}
                      <td
                        onClick={() => handleAddPositionFromStrike(option, 'CALL', 'BUY')}
                        title="Click to Simulate BUY CALL Order"
                        className={`py-2 px-2 text-right font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-900 cursor-pointer active:scale-95 transition ${
                          isAtm
                            ? 'bg-yellow-200/20 dark:bg-yellow-500/20'
                            : isCallItm
                              ? 'bg-amber-200/40 dark:bg-[#403310]/50'
                              : 'bg-slate-50 dark:bg-slate-950/20'
                        }`}
                      >
                        {typeof option.callLtp === 'number' ? option.callLtp.toFixed(1) : Number(option.callLtp || 0).toFixed(1)}
                      </td>
                      <td className={`py-2 px-1 text-center border-r border-slate-200 dark:border-slate-850 text-[10px] ${option.callChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} ${isAtm ? 'bg-yellow-200/10 dark:bg-yellow-500/5' : isCallItm ? 'bg-amber-100/20 dark:bg-[#292211]/30' : ''}`}>
                        {option.callChange >= 0 ? '+' : ''}{option.callChange}%
                      </td>

                      {/* STRIKE PRICE */}
                      <td className={`py-2 px-3 text-slate-900 dark:text-white font-extrabold text-[12px] border-r border-slate-200 dark:border-slate-800 text-center ${
                        isAtm
                          ? 'bg-yellow-350 text-slate-950 dark:bg-yellow-600 dark:text-black font-black outline outline-2 outline-yellow-400'
                          : 'bg-slate-100 dark:bg-slate-900/95 shadow-sm'
                      }`}>
                        {strike}
                      </td>

                      {/* PUTS */}
                      <td className={`py-2 px-1 text-center border-r border-slate-200 dark:border-slate-800 text-[10px] ${option.putChange >= 0 ? 'text-emerald-600 dark:text-emerald-405' : 'text-rose-600 dark:text-rose-400'} ${isAtm ? 'bg-yellow-200/10 dark:bg-yellow-500/5' : isPutItm ? 'bg-amber-100/20 dark:bg-[#292211]/30' : ''}`}>
                        {option.putChange >= 0 ? '+' : ''}{option.putChange}%
                      </td>
                      <td
                        onClick={() => handleAddPositionFromStrike(option, 'PUT', 'BUY')}
                        title="Click to Simulate BUY PUT Order"
                        className={`py-2 px-2 text-left font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-955 cursor-pointer active:scale-95 transition ${
                          isAtm
                            ? 'bg-yellow-200/20 dark:bg-yellow-500/20'
                            : isPutItm
                              ? 'bg-amber-200/40 dark:bg-[#403310]/50'
                              : 'bg-slate-50 dark:bg-slate-950/20'
                        }`}
                      >
                        {typeof option.putLtp === 'number' ? option.putLtp.toFixed(1) : Number(option.putLtp || 0).toFixed(1)}
                      </td>
                      <td
                        title={isPutIvHigh ? 'Unusual Market Activity: Implied Volatility exceeds 30%' : undefined}
                        className={`py-2 px-1 text-[10px] transition-colors duration-200 ${
                          isPutIvHigh
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold border-l border-r border-amber-500/20 dark:bg-amber-500/10'
                            : isAtm
                              ? 'bg-yellow-250/20 dark:bg-yellow-500/10 text-slate-700 dark:text-slate-350'
                              : isPutItm
                                ? 'bg-amber-100/20 dark:bg-[#292211]/30 text-slate-600 dark:text-slate-350'
                                : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {option.putIv}%
                      </td>
                      <td className={`py-2 px-1 text-left text-slate-500 dark:text-slate-455 ${isAtm ? 'bg-yellow-200/10 dark:bg-yellow-500/5' : isPutItm ? 'bg-amber-100/20 dark:bg-[#292211]/30' : ''}`}>
                        {formatVolume(option.putVol)}
                      </td>
                      <td className={`py-2 px-1 ${option.putOiChg >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-450'} ${isAtm ? 'bg-yellow-200/10 dark:bg-yellow-500/5' : isPutItm ? 'bg-amber-100/20 dark:bg-[#292211]/30' : ''}`}>
                        {option.putOiChg >= 0 ? '+' : ''}{formatVolume(option.putOiChg)}
                      </td>
                      <td className={`py-2 px-2 text-slate-600 dark:text-slate-350 border-r border-slate-200 dark:border-slate-850 py-2 ${isAtm ? 'bg-yellow-200/10 dark:bg-yellow-500/5' : isPutItm ? 'bg-amber-100/20 dark:bg-[#292211]/30 font-semibold' : ''}`}>
                        {formatVolume(option.putOi)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DERIVATIVES STRATEGY BOARD (Simulator) */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm dark:shadow-xl transition-all duration-300" id="strategy_simulator">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3 mb-4 gap-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator size={15} className="text-emerald-500 dark:text-emerald-400" />
              Interactive Derivatives Strategy Simulator
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Click LTP values in the option chain above to pile positions into a test model and calculate payload outcomes</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[10px] text-slate-550 dark:text-slate-400 font-mono font-bold">Model Lot Qty:</span>
            <input
              type="number"
              value={simQty}
              onChange={(e) => setSimQty(Math.max(1, Number(e.target.value)))}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center h-8 w-16 text-xs text-slate-900 dark:text-white rounded font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {simPositions.length === 0 ? (
          <div className="py-12 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl text-center text-xs font-mono text-slate-405 dark:text-slate-500 bg-slate-50/40 dark:bg-transparent">
            No derivative positions queued yet. Click option premiums in the LTP columns above to design custom payload profiles!
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Queued Position Rows */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-450 block font-sans tracking-wide">Simulator Ledger</span>
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {simPositions.map(pos => {
                  const isBuy = pos.direction === 'BUY';
                  const premiumPaidRec = pos.entryPrice * pos.quantity;
                  return (
                    <div
                      key={pos.id}
                      className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850/80 rounded-lg flex items-center justify-between shadow-xs transition-all duration-300"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded text-white ${isBuy ? 'bg-indigo-600 dark:bg-indigo-900/60 border border-indigo-500 dark:border-indigo-700/50' : 'bg-amber-600 dark:bg-amber-955/60 border border-amber-500 dark:border-amber-700/50'}`}>
                            {pos.direction}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-800 dark:text-white">
                            {pos.symbol.replace('.NS', '')} {pos.strike} {pos.optionType}
                          </span>
                        </div>
                        <div className="flex gap-4 text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-mono">
                          <span>Avg Entry: <span className="text-slate-900 dark:text-white font-bold">₹{pos.entryPrice}</span></span>
                          <span>Qty: <span className="text-slate-900 dark:text-white font-bold">{pos.quantity}</span></span>
                          <span>Cap: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">₹{premiumPaidRec.toLocaleString()}</span></span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemovePosition(pos.id)}
                        className="p-1 px-2 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/50 hover:text-rose-400 rounded transition cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => setSimPositions([])}
                className="text-[10px] text-rose-600 dark:text-rose-450 font-bold bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-500 hover:text-white py-1.5 rounded transition self-end px-4 mt-2 cursor-pointer border border-rose-200 dark:border-rose-900/20"
              >
                Flush Ledger
              </button>
            </div>

            {/* Right Column: Dynamic Payoff Visual Vector Chart */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-455 block font-sans tracking-wide">Payout Profile Expiry Projection</span>
              <div className="flex-1 min-h-[180px] bg-slate-50 dark:bg-slate-955 rounded-lg p-2 flex flex-col justify-end border border-slate-200 dark:border-slate-900 relative shadow-inner">
                {/* Visual vectors projection svg bar lines */}
                <div className="absolute inset-x-4 top-4 flex justify-between font-mono text-[9px] text-slate-500">
                  <span>-12% Spot</span>
                  <span>PCR Target {pcrVal}</span>
                  <span>+12% Spot</span>
                </div>

                {/* Plot outline */}
                <div className="w-full h-[140px] flex items-end justify-between px-2 relative">
                  {/* Zero Line Marker */}
                  <div className="absolute left-0 right-0 top-[70px] h-[1px] bg-slate-350 dark:bg-slate-800 border-dashed" />

                  {/* Payoff Plot SVG curve */}
                  <svg className="absolute inset-0 w-full h-full overflow-visible">
                    <polyline
                      fill="none"
                      stroke={theme === 'dark' ? '#818cf8' : '#4f46e5'} // Dynamic SVG stroke color matching theme
                      strokeWidth="2.5"
                      points={payoffPoints.map((pt, i) => {
                        const x = (i / (payoffPoints.length - 1)) * 360; // scale nicely
                        // Scale payload: range of pnl
                        const pnls = payoffPoints.map(p => p.pnl);
                        const maxPnl = Math.max(...pnls.map(Math.abs), 500);
                        const y = 70 - (pt.pnl / maxPnl) * 60;
                        return `${x},${y}`;
                      }).join(' ')}
                    />

                    {/* Expiry anchors */}
                    {payoffPoints.map((pt, i) => {
                      if (i % 4 === 0) {
                        const x = (i / (payoffPoints.length - 1)) * 360;
                        const pnls = payoffPoints.map(p => p.pnl);
                        const maxPnl = Math.max(...pnls.map(Math.abs), 500);
                        const y = 70 - (pt.pnl / maxPnl) * 60;
                        const isGain = pt.pnl >= 0;

                        return (
                          <g key={i}>
                            <circle cx={x} cy={y} r="3.5" fill={isGain ? '#10b981' : '#f43f5e'} />
                            <text
                              x={x}
                              y={y > 70 ? y - 8 : y + 12}
                              fontSize="8px"
                              fill={theme === 'dark' ? '#94a3b8' : '#475569'}
                              textAnchor="middle"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              ₹{pt.price}
                            </text>
                          </g>
                        );
                      }
                      return null;
                    })}
                  </svg>
                </div>

                <div className="flex border-t border-slate-200 dark:border-slate-905 pt-2 items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 px-2 mt-4 font-mono">
                  <span>Strategy Outlook:</span>
                  <span className={`font-bold ${payoffPoints[payoffPoints.length-1]?.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-450'}`}>
                    {payoffPoints[payoffPoints.length-1]?.pnl >= 0 ? 'Net Bullish Payoff' : 'Net Bearish Hedged'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
