import React, { useEffect, useState, useMemo } from 'react';
import { HelpCircle, RefreshCw, Calculator, ArrowUpRight, ArrowDownRight, ShieldCheck, PlayCircle, PlusCircle, Trash2, TrendingUp, Search, Download, Presentation, Lock, ChevronDown } from 'lucide-react';
import { OptionChain, OptionData, Position } from '../types';
import { generateOptionChain } from '../data';
import { useTheme } from './ThemeContext';
import StockChart from './StockChart';
import { useAuth } from '../contexts/AuthContext';

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
  const [expiryDates, setExpiryDates] = useState<string[]>([]);
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  const [allData, setAllData] = useState<any>(null);

  const [simPositions, setSimPositions] = useState<Position[]>([]);
  const [simQty, setSimQty] = useState<number>(50);

  const [strikeSearch, setStrikeSearch] = useState<string>('');
  const [showChart, setShowChart] = useState<boolean>(false);

  const stockName = useMemo(() => {
    if (propStockName) return propStockName;
    if (symbol === '^NSEI' || symbol === 'NIFTY') return 'NIFTY 50';
    if (symbol === '^NSEBANK' || symbol === 'BANKNIFTY') return 'BANK NIFTY';
    if (symbol === 'FINNIFTY') return 'FINNIFTY';
    return symbol;
  }, [symbol, propStockName]);

  // Option chain fetching
  useEffect(() => {
    async function fetchChain() {
      setLoading(true);
      const cleanSymbol = symbol.endsWith('.NS') ? symbol.replace('.NS', '') : symbol;
      const upperSym = cleanSymbol.toUpperCase();
      const lookupSymbol = upperSym === 'RELIANCE' ? 'RELIANCE' : (upperSym.includes('BANKNIFTY') || upperSym.includes('BANK') ? 'BANKNIFTY' : upperSym);

      try {
        const res = await fetch(`/api/option-chain?symbol=${lookupSymbol}`, { signal: AbortSignal.timeout(15000) });
        if (res.ok) {
          const json = await res.json();
          if (json.status === 'ok' && json.data) {
            setAllData(json.data);
            const dates = json.data.records.expiryDates || [];
            setExpiryDates(dates);
            if (!selectedExpiry && dates.length > 0) {
              setSelectedExpiry(dates[0]);
            }

            const currentExp = selectedExpiry || dates[0];
            const parsed = parseNseOptionChain(json.data, lookupSymbol, currentExp);
            if (parsed) {
              setChain(parsed);
              setLoading(false);
              return;
            }
          }
        }
        throw new Error('Option chain API failed');
      } catch (err) {
        console.error("Option live sync error:", err);
        // Fallback
        const spotPrice = currentPrice || 24000;
        const fallbackChain = generateOptionChain(lookupSymbol, spotPrice);
        setChain(fallbackChain);
        setExpiryDates([fallbackChain.expiryDate]);
        setSelectedExpiry(fallbackChain.expiryDate);
      } finally {
        setLoading(false);
      }
    }

    fetchChain();
    const timer = setInterval(fetchChain, 30000); // 30s refresh
    return () => clearInterval(timer);
  }, [symbol, selectedExpiry]);

  function parseNseOptionChain(json: any, targetSymbol: string, expiry: string): OptionChain | null {
    const records = json.records;
    if (!records || !records.data) return null;

    const spotPrice = records.underlyingValue || 0;
    const rawList = records.data;
    
    const options: OptionData[] = rawList
      .filter((row: any) => row.expiryDate === expiry)
      .map((row: any) => {
        const strikePrice = row.strikePrice;
        const ce = row.CE || {};
        const pe = row.PE || {};

        return {
          strikePrice: strikePrice,
          callLtp: ce.lastPrice || 0,
          callChange: ce.pChange || 0,
          callVol: ce.totalTradedVolume || 0,
          callOi: ce.openInterest || 0,
          callOiChg: ce.changeinOpenInterest || 0,
          callIv: ce.impliedVolatility || 0,
          callDelta: 0,
          callBidQty: ce.bidQty || 0,
          callBidPrice: ce.bidprice || 0,
          callAskPrice: ce.askPrice || 0,
          callAskQty: ce.askQty || 0,

          putLtp: pe.lastPrice || 0,
          putChange: pe.pChange || 0,
          putVol: pe.totalTradedVolume || 0,
          putOi: pe.openInterest || 0,
          putOiChg: pe.changeinOpenInterest || 0,
          putIv: pe.impliedVolatility || 0,
          putDelta: 0,
          putBidQty: pe.bidQty || 0,
          putBidPrice: pe.bidprice || 0,
          putAskPrice: pe.askPrice || 0,
          putAskQty: pe.askQty || 0,
        };
      })
      .sort((a: any, b: any) => a.strikePrice - b.strikePrice);

    let totalCallOi = 0;
    let totalPutOi = 0;
    options.forEach(opt => {
      totalCallOi += opt.callOi;
      totalPutOi += opt.putOi;
    });

    return {
      symbol: targetSymbol,
      spotPrice: spotPrice,
      pcr: totalCallOi > 0 ? Number((totalPutOi / totalCallOi).toFixed(2)) : 1.0,
      totalCallOi: totalCallOi,
      totalPutOi: totalPutOi,
      maxPain: spotPrice, // Placeholder
      expiryDate: expiry,
      options: options
    };
  }

  const filteredOptions = useMemo(() => {
    if (!chain?.options) return [];
    let list = chain.options;

    const spot = chain.spotPrice;
    if (spot > 0 && !strikeSearch) {
      // Show ~20 strikes around ATM by default
      const diffs = list.map(o => Math.abs(o.strikePrice - spot));
      const minDiff = Math.min(...diffs);
      const atmIdx = diffs.indexOf(minDiff);
      const start = Math.max(0, atmIdx - 10);
      const end = Math.min(list.length, atmIdx + 11);
      list = list.slice(start, end);
    }

    if (strikeSearch.trim() !== '') {
      const q = strikeSearch.trim();
      list = chain.options.filter(opt => opt.strikePrice.toString().includes(q));
    }
    return list;
  }, [chain?.options, strikeSearch, chain?.spotPrice]);

  const formatNum = (v: any) => {
    if (v === undefined || v === null || isNaN(v)) return '-';
    if (v === 0) return '0';
    return v.toLocaleString();
  };

  const formatFixed = (v: any, d = 2) => {
    if (v === undefined || v === null || isNaN(v)) return '-';
    return Number(v).toFixed(d);
  };

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

  if (loading && !chain) {
    return (
      <div className="h-[500px] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
        <RefreshCw className="animate-spin mb-4 text-indigo-500" size={32} />
        <span className="font-mono text-sm">Fetching real-time NSE data...</span>
      </div>
    );
  }

  if (!chain) return null;

  const spot = chain.spotPrice;

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header & Filters */}
      <div className="bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Underlying Index</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-900 dark:text-white">{stockName}</span>
              <span className="text-lg font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {formatFixed(spot)}
              </span>
            </div>
          </div>
          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 hidden md:block" />
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Expiry Date</span>
            <div className="relative mt-1">
              <select
                value={selectedExpiry}
                onChange={(e) => setSelectedExpiry(e.target.value)}
                className="appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 pr-8 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {expiryDates.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Strike Price..."
              value={strikeSearch}
              onChange={(e) => setStrikeSearch(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded pl-9 pr-4 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 w-40"
            />
          </div>
          <button 
            onClick={() => setShowChart(!showChart)}
            className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition shadow-md active:scale-95"
          >
            <Presentation size={14} />
            {showChart ? 'Hide Chart' : 'Show Chart'}
          </button>
        </div>
      </div>

      {showChart && (
        <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <StockChart symbol={symbol} name={stockName} />
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <th colSpan={10} className="py-2 border-r border-slate-200 dark:border-slate-800 text-center uppercase tracking-tighter">CALLS</th>
                <th className="bg-slate-200 dark:bg-slate-800"></th>
                <th colSpan={10} className="py-2 text-center uppercase tracking-tighter">PUTS</th>
              </tr>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 text-[9px]">
                <th className="px-1 py-2 text-right">OI</th>
                <th className="px-1 py-2 text-right">CHNG OI</th>
                <th className="px-1 py-2 text-right">VOL</th>
                <th className="px-1 py-2 text-right">IV</th>
                <th className="px-1 py-2 text-right">LTP</th>
                <th className="px-1 py-2 text-right">CHNG</th>
                <th className="px-1 py-2 text-right">BID QTY</th>
                <th className="px-1 py-2 text-right">BID</th>
                <th className="px-1 py-2 text-right">ASK</th>
                <th className="px-1 py-2 text-right border-r border-slate-200 dark:border-slate-800">ASK QTY</th>
                
                <th className="px-4 py-2 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white font-black text-center text-xs">STRIKE</th>
                
                <th className="px-1 py-2 text-left border-l border-slate-200 dark:border-slate-800">BID QTY</th>
                <th className="px-1 py-2 text-left">BID</th>
                <th className="px-1 py-2 text-left">ASK</th>
                <th className="px-1 py-2 text-left">ASK QTY</th>
                <th className="px-1 py-2 text-left">CHNG</th>
                <th className="px-1 py-2 text-left">LTP</th>
                <th className="px-1 py-2 text-left">IV</th>
                <th className="px-1 py-2 text-left">VOL</th>
                <th className="px-1 py-2 text-left">CHNG OI</th>
                <th className="px-1 py-2 text-left">OI</th>
              </tr>
            </thead>
            <tbody>
              {filteredOptions.map((opt) => {
                const isCallItm = spot > opt.strikePrice;
                const isPutItm = spot < opt.strikePrice;
                const atmThreshold = symbol.includes('BANK') ? 100 : 50;
                const isAtm = Math.abs(opt.strikePrice - spot) < (atmThreshold / 2);

                return (
                  <tr
                    key={opt.strikePrice}
                    className={`border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-indigo-900/10 transition-colors ${isAtm ? 'ring-1 ring-inset ring-indigo-500/30' : ''}`}
                  >
                    {/* CALLS */}
                    <td className={`px-1 py-2 text-right ${isCallItm ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>{formatNum(opt.callOi)}</td>
                    <td className={`px-1 py-2 text-right ${isCallItm ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''} ${opt.callOiChg >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatNum(opt.callOiChg)}
                    </td>
                    <td className={`px-1 py-2 text-right ${isCallItm ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>{formatNum(opt.callVol)}</td>
                    <td className={`px-1 py-2 text-right ${isCallItm ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>{formatFixed(opt.callIv)}</td>
                    <td
                      onClick={() => handleAddPositionFromStrike(opt, 'CALL', 'BUY')}
                      className={`px-1 py-2 text-right font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline ${isCallItm ? 'bg-yellow-50/50 dark:bg-yellow-900/20' : ''}`}
                    >
                      {formatFixed(opt.callLtp)}
                    </td>
                    <td className={`px-1 py-2 text-right ${isCallItm ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''} ${opt.callChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatFixed(opt.callChange)}%
                    </td>
                    <td className={`px-1 py-2 text-right text-slate-400 ${isCallItm ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>{formatNum(opt.callBidQty)}</td>
                    <td className={`px-1 py-2 text-right text-slate-400 ${isCallItm ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>{formatFixed(opt.callBidPrice)}</td>
                    <td className={`px-1 py-2 text-right text-slate-400 ${isCallItm ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>{formatFixed(opt.callAskPrice)}</td>
                    <td className={`px-1 py-2 text-right text-slate-400 border-r border-slate-200 dark:border-slate-800 ${isCallItm ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>{formatNum(opt.callAskQty)}</td>

                    {/* STRIKE */}
                    <td className="px-3 py-2 bg-slate-100 dark:bg-slate-900 text-center font-black text-slate-900 dark:text-white text-[12px] shadow-sm z-10">
                      {opt.strikePrice}
                    </td>

                    {/* PUTS */}
                    <td className={`px-1 py-2 text-left text-slate-400 border-l border-slate-200 dark:border-slate-800 ${isPutItm ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>{formatNum(opt.putBidQty)}</td>
                    <td className={`px-1 py-2 text-left text-slate-400 ${isPutItm ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>{formatFixed(opt.putBidPrice)}</td>
                    <td className={`px-1 py-2 text-left text-slate-400 ${isPutItm ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>{formatFixed(opt.putAskPrice)}</td>
                    <td className={`px-1 py-2 text-left text-slate-400 ${isPutItm ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>{formatNum(opt.putAskQty)}</td>
                    <td className={`px-1 py-2 text-left ${isPutItm ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''} ${opt.putChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatFixed(opt.putChange)}%
                    </td>
                    <td
                      onClick={() => handleAddPositionFromStrike(opt, 'PUT', 'BUY')}
                      className={`px-1 py-2 text-left font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline ${isPutItm ? 'bg-yellow-50/50 dark:bg-yellow-900/20' : ''}`}
                    >
                      {formatFixed(opt.putLtp)}
                    </td>
                    <td className={`px-1 py-2 text-left ${isPutItm ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>{formatFixed(opt.putIv)}</td>
                    <td className={`px-1 py-2 text-left ${isPutItm ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>{formatNum(opt.putVol)}</td>
                    <td className={`px-1 py-2 text-left ${isPutItm ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''} ${opt.putOiChg >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatNum(opt.putOiChg)}
                    </td>
                    <td className={`px-1 py-2 text-left ${isPutItm ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>{formatNum(opt.putOi)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulator Section (Reduced height for focus) */}
      {simPositions.length > 0 && (
        <div className="bg-white dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calculator size={16} className="text-indigo-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Active Simulation Ledger</h4>
            </div>
            <button
              onClick={() => setSimPositions([])}
              className="text-[10px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-2 py-1 rounded transition"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {simPositions.map(pos => (
              <div key={pos.id} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                <span className={`font-black ${pos.direction === 'BUY' ? 'text-emerald-600' : 'text-rose-600'}`}>{pos.direction}</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{pos.strike} {pos.optionType}</span>
                <span className="font-mono font-bold">@ {pos.entryPrice}</span>
                <button onClick={() => setSimPositions(p => p.filter(x => x.id !== pos.id))} className="ml-1 text-slate-400 hover:text-rose-500">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
