import React, { useState, useMemo, useEffect } from 'react';
import { SlidersHorizontal, ArrowUpDown, Play, Sparkles, Filter, CheckCircle2, ChevronRight, Calculator, Download, Lock, Star } from 'lucide-react';
import { Stock } from '../types';
import OptionsCalculator from './OptionsCalculator';
import IVRankTool from './IVRankTool';
import RiskCalculator from './RiskCalculator';
import GreeksCalculator from './GreeksCalculator';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface ScreenerRowProps {
  key?: string;
  stock: Stock;
  onSelectStock: (symbol: string) => void;
  onSelectFoStock: (symbol: string) => void;
  formatVolume: (vol: number) => string;
  formatMarketCap: (cap: number) => string;
  realData?: { price: number; changePercent: number; volume: number; change: number };
  isLoading?: boolean;
  isWatchlisted: boolean;
  onToggleWatchlist: (symbol: string) => void;
}

function ScreenerRow({ stock, onSelectStock, onSelectFoStock, formatVolume, formatMarketCap, realData, isLoading, isWatchlisted, onToggleWatchlist }: ScreenerRowProps) {
  const displayPrice = realData ? realData.price : stock.price;
  const displayChangePercent = realData ? realData.changePercent.toFixed(2) : stock.changePercent;
  const displayVolume = realData ? realData.volume : stock.volume;
  const displayChange = realData ? realData.change : stock.change;

  const [prevPrice, setPrevPrice] = useState<number>(displayPrice);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (displayPrice !== prevPrice) {
      setFlash(displayPrice > prevPrice ? 'up' : 'down');
      setPrevPrice(displayPrice);
      const timer = setTimeout(() => {
        setFlash(null);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [displayPrice, prevPrice]);

  const isPositive = displayChange >= 0;
  const rsiColorClass = stock.rsi >= 70 
    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 font-bold' 
    : stock.rsi <= 40 
    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 font-bold' 
    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800';

  // Dynamic green/red flash visual background for price field
  const flashBgClass = flash === 'up'
    ? 'bg-emerald-500/20 text-emerald-650 dark:text-emerald-300 font-bold scale-[1.02] shadow-sm shadow-emerald-500/20 rounded duration-150'
    : flash === 'down'
    ? 'bg-rose-500/20 text-rose-650 dark:text-rose-305 font-bold scale-[1.02] shadow-sm shadow-rose-500/20 rounded duration-150'
    : 'duration-1000 text-slate-800 dark:text-slate-250';

  return (
    <tr className="hover:bg-slate-150/40 dark:hover:bg-slate-900/30 border-b border-slate-100 dark:border-slate-850/40 transition duration-150 class_stock_row text-sm">
      {/* Ticker Symbol */}
      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatchlist(stock.symbol);
            }}
            className="p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800/80 transition text-slate-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 cursor-pointer"
            title={isWatchlisted ? "Remove from Watchlist" : "Add to Watchlist"}
          >
            <Star size={14} className={isWatchlisted ? "fill-amber-400 text-amber-500 dark:text-amber-400" : "text-slate-350 dark:text-slate-600"} />
          </button>
          <span onClick={() => onSelectStock('NSE:' + stock.symbol.replace('.NS', ''))} className="hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer transition underline decoration-dotted underline-offset-4">
            {stock.symbol.replace('.NS', '')}
          </span>
          {stock.isFoEnabled && (
            <span
              onClick={() => onSelectFoStock(stock.symbol)}
              title="Futures and Options Supported - Click to open Option Chain"
              className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[8px] font-extrabold px-1.5 py-0.5 rounded cursor-pointer border border-purple-300 dark:border-purple-800/40 hover:bg-purple-500 hover:text-white dark:hover:bg-purple-900 transition uppercase"
            >
              F&O
            </span>
          )}
        </div>
      </td>

      {/* Company Name & Sector */}
      <td className="py-3.5 px-3">
        <span className="font-sans text-slate-700 dark:text-slate-200 block text-xs truncate max-w-[160px] font-medium">{stock.name}</span>
        <span className="text-[10px] text-slate-500 dark:text-slate-450 font-mono font-semibold uppercase">{stock.sector}</span>
      </td>

      {/* Spot Pricing */}
      <td className="py-3.5 px-3 text-right font-mono text-xs font-semibold">
        {isLoading ? (
          <div className="flex justify-end"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div></div>
        ) : (
          <span className={`inline-block px-1.5 py-0.5 transition-all text-right select-none ${flashBgClass}`}>
            {displayPrice >= 100 ? displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : displayPrice.toFixed(2)}
          </span>
        )}
      </td>

      {/* Today change % */}
      <td className="py-3.5 px-3 text-right font-mono font-bold text-xs">
        {isLoading ? (
           <div className="flex justify-end"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div></div>
        ) : (
          <span className={`inline-flex items-center ${isPositive ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-450'}`}>
            {isPositive ? '+' : ''}{displayChangePercent}%
          </span>
        )}
      </td>

      {/* volume */}
      <td className="py-3.5 px-3 text-right font-mono text-slate-500 dark:text-slate-400 text-xs font-medium">
        {isLoading ? (
           <div className="flex justify-end"><div className="h-4 w-14 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div></div>
        ) : (
          formatVolume(displayVolume)
        )}
      </td>

      {/* market cap */}
      <td className="py-3.5 px-3 text-right font-mono text-slate-500 dark:text-slate-400 text-xs font-medium">
        {formatMarketCap(stock.marketCap)}
      </td>

      {/* PE Ratio */}
      <td className="py-3.5 px-3 text-center font-mono text-slate-700 dark:text-slate-300 text-xs font-medium">
        {stock.peRatio || '-'}
      </td>

      {/* RSI 14-day value */}
      <td className="py-3.5 px-3 text-center font-mono text-xs">
        <span className={`px-2 py-0.5 rounded text-[11px] ${rsiColorClass}`}>
          {stock.rsi}
        </span>
      </td>

      {/* Interactive Triggers */}
      <td className="py-3.5 px-4 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => onSelectStock('NSE:' + stock.symbol.replace('.NS', ''))}
            title="Open Interactive Chart"
            className="p-1 px-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-500 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-950/10 text-emerald-700 dark:text-emerald-400 hover:text-white transition text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Play size={10} className="fill-current" />
            Chart
          </button>
          {stock.isFoEnabled && (
            <button
              onClick={() => onSelectFoStock(stock.symbol)}
              title="Open F&O Derivatives Console"
              className="p-1 px-2.5 rounded bg-purple-50 dark:bg-purple-950/45 hover:bg-purple-500 dark:hover:bg-purple-900 border border-purple-200 dark:border-purple-950/10 text-purple-700 dark:text-purple-300 hover:text-white transition text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Calculator size={10} />
              F&O
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

interface StockScreenerProps {
  stocks: Stock[];
  onSelectStock: (symbol: string) => void;
  onSelectFoStock: (symbol: string) => void;
}

type SortField = 'symbol' | 'price' | 'changePercent' | 'volume' | 'marketCap' | 'peRatio' | 'rsi' | 'dividendYield';
type SortOrder = 'asc' | 'desc';

export default function StockScreener({ stocks, onSelectStock, onSelectFoStock }: StockScreenerProps) {
  const [activePreset, setActivePreset] = useState<string>('all');
  const { user, loginWithGoogle, isPro } = useAuth();

  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [watchlistError, setWatchlistError] = useState<string | null>(null);
  const [watchlistLoading, setWatchlistLoading] = useState<boolean>(false);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);

  // Sync watchlist from Firestore
  useEffect(() => {
    if (!user) {
      setWatchlist([]);
      return;
    }
    setWatchlistLoading(true);
    const docRef = doc(db, 'watchlists', user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().symbols) {
        setWatchlist(docSnap.data().symbols);
      } else {
        setWatchlist([]);
      }
      setWatchlistLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `watchlists/${user.uid}`);
      setWatchlistError("Failed to load watchlist");
      setWatchlistLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleToggleWatchlist = async (symbol: string) => {
    if (!user) {
      loginWithGoogle();
      return;
    }
    
    setLimitWarning(null);
    const isAlreadyAdded = watchlist.includes(symbol);
    let updatedSymbols = [...watchlist];
    
    if (isAlreadyAdded) {
      updatedSymbols = updatedSymbols.filter(s => s !== symbol);
    } else {
      if (!isPro && watchlist.length >= 10) {
        setLimitWarning("Watchlist limit reached! Free accounts can save up to 10 stocks. Upgrade to PRO for unlimited.");
        setTimeout(() => setLimitWarning(null), 5000);
        return;
      }
      updatedSymbols.push(symbol);
    }
    
    try {
      const docRef = doc(db, 'watchlists', user.uid);
      await setDoc(docRef, {
        userId: user.uid,
        symbols: updatedSymbols
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `watchlists/${user.uid}`);
    }
  };
  
  // Real Yahoo data state
  const [realStockData, setRealStockData] = useState<Record<string, { price: number; changePercent: number; volume: number; change: number }>>({});
  const [loadingStocks, setLoadingStocks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const symbolsToFetch = ['TCS.NS', 'INFY.NS', 'RELIANCE.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'BHARTIARTL.NS', 'WIPRO.NS', 'AXISBANK.NS', 'KOTAKBANK.NS', 'LT.NS', 'BAJFINANCE.NS', 'MARUTI.NS', 'ASIANPAINT.NS', 'HINDUNILVR.NS', 'TITAN.NS', 'ULTRACEMCO.NS', 'NESTLEIND.NS', 'TECHM.NS', 'SUNPHARMA.NS', 'DRREDDY.NS'];

    const fetchStockData = async (symbol: string) => {
      try {
        setLoadingStocks(prev => ({ ...prev, [symbol]: true }));
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
        if (response.ok) {
          const json = await response.json();
          const meta = json?.chart?.result?.[0]?.meta;
          if (meta) {
            const price = meta.regularMarketPrice;
            const prevClose = meta.previousClose || price;
            const change = price - prevClose;
            const changePercent = prevClose ? (change / prevClose) * 100 : 0;
            const volume = meta.regularMarketVolume || meta.volume || 0;
            
            setRealStockData(prev => ({
              ...prev,
              [symbol]: { price, change, changePercent, volume }
            }));
          }
        } else {
          // Fallback to proxy
          const res = await fetch(`/api/yahoo-finance/${symbol}`);
          if(res.ok) {
              const data = await res.json();
              setRealStockData(prev => ({
                ...prev,
                [symbol]: data
              }));
          }
        }
      } catch (err) {
        console.warn("Failed to fetch", symbol, err);
        try {
          const res = await fetch(`/api/yahoo-finance/${symbol}`);
          if(res.ok) {
              const data = await res.json();
              setRealStockData(prev => ({
                ...prev,
                [symbol]: data
              }));
          }
        } catch(e) {}
      } finally {
        setLoadingStocks(prev => ({ ...prev, [symbol]: false }));
      }
    };

    // Load in batches to avoid overwhelming network
    const loadAll = async () => {
      for (const symbol of symbolsToFetch) {
        fetchStockData(symbol);
        await new Promise(r => setTimeout(r, 150)); // Small delay
      }
    };
    loadAll();
  }, []);

  // Draft filter state (for UI)
  const [draftSector, setDraftSector] = useState<string>('All');
  const [draftMarketCap, setDraftMarketCap] = useState<string>('All');
  const [draftRsiMin, setDraftRsiMin] = useState<number>(0);
  const [draftRsiMax, setDraftRsiMax] = useState<number>(100);
  const [draftMinVolume, setDraftMinVolume] = useState<number>(0);

  // Applied filter state (triggers the filtering logic)
  const [appliedFilters, setAppliedFilters] = useState({
    sector: 'All',
    marketCap: 'All',
    rsiMin: 0,
    rsiMax: 100,
    minVolume: 0
  });

  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [sortField, setSortField] = useState<SortField>('changePercent');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Specific sector options requested by user
  const sectorOptions = ['All', 'Technology', 'Banking', 'Energy', 'Pharma', 'Auto'];

  const applyFilters = () => {
    setAppliedFilters({
      sector: draftSector,
      marketCap: draftMarketCap,
      rsiMin: draftRsiMin,
      rsiMax: draftRsiMax,
      minVolume: draftMinVolume
    });
  };

  // Set preset query filters
  const presetFilteredStocks = useMemo(() => {
    switch (activePreset) {
      case 'watchlist':
        return stocks.filter(s => watchlist.includes(s.symbol));
      case 'gainers':
        return stocks.filter(s => s.changePercent > 0);
      case 'losers':
        return stocks.filter(s => s.changePercent < 0);
      case 'overbought':
        return stocks.filter(s => s.rsi >= 60);
      case 'oversold':
        return stocks.filter(s => s.rsi <= 45);
      case 'undervalued':
        return stocks.filter(s => s.peRatio > 0 && s.peRatio <= 22);
      case 'volume':
        return stocks.filter(s => s.volume > 5000000);
      default:
        return stocks;
    }
  }, [stocks, activePreset, watchlist]);

  // Refined sliders and select filter values
  const finalFilteredStocks = useMemo(() => {
    let result = [...presetFilteredStocks];
    
    if (appliedFilters.sector !== 'All') {
      result = result.filter(s => s.sector === appliedFilters.sector);
    }
    
    if (appliedFilters.marketCap !== 'All') {
      // Simple logic for illustration
      if (appliedFilters.marketCap === 'Large Cap') result = result.filter(s => s.marketCap > 200000);
      else if (appliedFilters.marketCap === 'Mid Cap') result = result.filter(s => s.marketCap <= 200000 && s.marketCap > 50000);
      else if (appliedFilters.marketCap === 'Small Cap') result = result.filter(s => s.marketCap <= 50000);
    }
    
    result = result.filter(s => s.rsi >= appliedFilters.rsiMin && s.rsi <= appliedFilters.rsiMax);
    result = result.filter(s => s.volume >= appliedFilters.minVolume);

    // Apply sorting
    result.sort((a, b) => {
      let valA = a[sortField] ?? 0;
      let valB = b[sortField] ?? 0;

      // Handle string comparison if needed
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return sortOrder === 'asc' 
        ? (valA as number) - (valB as number) 
        : (valB as number) - (valA as number);
    });

    return result;
  }, [presetFilteredStocks, appliedFilters, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(2)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(0)}K`;
    return vol.toString();
  };

  const formatMarketCap = (cap: number) => {
    if (cap >= 1000000) return `₹${(cap / 1000000).toFixed(2)}T`;
    return `₹${cap.toLocaleString()}Cr`;
  };

  const handleExportCSV = () => {
    // CSV Header row
    const headers = [
      'Ticker Code',
      'Instrument Name',
      'Sector',
      'Spot Price (INR)',
      'Change (%)',
      'Change Value (INR)',
      'Volume (24H)',
      'Market Cap (INR Cr)',
      'P/E Ratio',
      'RSI (14)',
      'High (INR)',
      'Low (INR)',
      'Open (INR)',
      'Close (INR)',
      'Exchange',
      'F&O Segment'
    ];

    // Helper to escape CSV cell strings containing commas or quotes
    const escapeCSVCell = (val: any) => {
      if (val === null || val === undefined) return '';
      const strVal = String(val);
      if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    };

    // Format individual stock records
    const rows = finalFilteredStocks.map(stock => [
      stock.symbol.replace('.NS', ''),
      stock.name,
      stock.sector,
      stock.price,
      stock.changePercent,
      stock.change,
      stock.volume,
      stock.marketCap,
      stock.peRatio || 'N/A',
      stock.rsi,
      stock.high || '',
      stock.low || '',
      stock.open || '',
      stock.close || '',
      stock.exchange,
      stock.isFoEnabled ? 'Enabled' : 'Disabled'
    ].map(escapeCSVCell));

    // Combine headers and rows
    const csvContent = [headers.map(escapeCSVCell).join(','), ...rows.map(r => r.join(','))].join('\n');

    // Create Download Blob and trigger anchor click
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate clean filename matching preset / selector
    const presetLabel = activePreset.charAt(0).toUpperCase() + activePreset.slice(1);
    const sectorName = appliedFilters.sector.replace(/\s+/g, '_');
    const filename = `StockPro_Screener_${presetLabel}_${sectorName}_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm dark:shadow-xl transition-all duration-300" id="screener_viewport">
      {/* Search Presets Row */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-850 pb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-500 dark:text-emerald-400" />
            Stock Screening Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Sift and filter high-liquidity assets based on technical criteria</p>
        </div>

        {/* Preset selections */}
        <div className="flex flex-wrap gap-2 w-full xl:w-auto" id="screener_presets">
          {[
            { id: 'all', name: 'All Instruments' },
            { id: 'watchlist', name: 'My Watchlist', count: watchlist.length },
            { id: 'gainers', name: 'Top Gainers' },
            { id: 'losers', name: 'Top Losers' },
            { id: 'volume', name: 'Volume Shockers' },
            { id: 'overbought', name: 'RSI Overbought' },
            { id: 'oversold', name: 'RSI Oversold' },
            { id: 'undervalued', name: 'Undervalued Growth' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setActivePreset(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide border transition-all cursor-pointer flex items-center gap-1.5 ${
                activePreset === p.id
                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40 shadow-inner'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{p.name}</span>
              {p.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  activePreset === p.id
                    ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-350'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {p.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Toggle & Sliders */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="screener_controls">
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-lg cursor-pointer transition select-none shadow-sm"
            id="toggle_filters_btn"
          >
            <SlidersHorizontal size={14} className={showFilters ? 'text-emerald-500 dark:text-emerald-400' : ''} />
            {showFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
            <span className="bg-slate-200 dark:bg-slate-800 text-slate-705 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              {appliedFilters.sector !== 'All' || appliedFilters.marketCap !== 'All' || appliedFilters.rsiMin > 0 || appliedFilters.rsiMax < 100 || appliedFilters.minVolume > 0 ? 'Active' : 'Off'}
            </span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-755 dark:text-emerald-400 hover:bg-emerald-600 dark:hover:bg-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/25 hover:border-emerald-500/60 px-4 py-2 rounded-lg cursor-pointer transition hover:text-white shadow-sm font-bold"
            id="btn_export_csv"
            title="Download filtered stock list as a CSV spreadsheet"
          >
            <Download size={14} className="text-emerald-600 dark:text-emerald-400" />
            Export to CSV
            <span className="bg-emerald-200/50 dark:bg-emerald-905/50 text-emerald-800 dark:text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              {finalFilteredStocks.length} Stock{finalFilteredStocks.length !== 1 ? 's' : ''}
            </span>
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-850 animate-fadeIn" id="advanced_filters_panel">
            {/* Sector Choose */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Sector</label>
              <select
                value={draftSector}
                onChange={(e) => setDraftSector(e.target.value)}
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-lg p-2.5 outline-none focus:border-emerald-500 transition font-medium shadow-sm"
              >
                {sectorOptions.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Market Cap */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Market Cap</label>
              <select
                value={draftMarketCap}
                onChange={(e) => setDraftMarketCap(e.target.value)}
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-lg p-2.5 outline-none focus:border-emerald-500 transition font-medium shadow-sm"
              >
                {['All', 'Large Cap', 'Mid Cap', 'Small Cap'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* RSI Range Filter */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[11px] text-slate-505 dark:text-slate-400 font-bold uppercase tracking-wider">
                <span>RSI Range</span>
                <span className="text-emerald-600 dark:text-emerald-405 font-mono">{draftRsiMin} - {draftRsiMax}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={draftRsiMax}
                onChange={(e) => setDraftRsiMax(Number(e.target.value))}
                className="accent-emerald-500 dark:accent-emerald-400 mt-2 cursor-pointer h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
              />
            </div>

             {/* Min Volume */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Min Volume</label>
              <input
                type="number"
                value={draftMinVolume}
                onChange={(e) => setDraftMinVolume(Number(e.target.value))}
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-lg p-2.5 outline-none focus:border-emerald-500 transition font-medium shadow-sm"
              />
            </div>

            {/* Apply Button */}
            <div className="flex items-end">
              <button
                onClick={applyFilters}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {limitWarning && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-400 text-xs font-bold animate-fadeIn flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-amber-500" />
            <span>{limitWarning}</span>
          </div>
          <button onClick={() => setLimitWarning(null)} className="text-[10px] uppercase font-mono tracking-wider text-amber-600 hover:text-amber-700 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Stock Grid Table */}
      <div className="overflow-x-auto" id="screener_table_container">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-850 text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">
              <th className="py-3 px-4 font-bold">
                <button onClick={() => handleSort('symbol')} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer transition">
                  Ticker CODE
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-3 font-bold">Instrument NAME</th>
              <th className="py-3 px-3 font-bold text-right">
                <button onClick={() => handleSort('price')} className="flex items-center gap-1 ml-auto hover:text-slate-900 dark:hover:text-white cursor-pointer transition">
                  SPOT Price (₹)
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-3 font-bold text-right">
                <button onClick={() => handleSort('changePercent')} className="flex items-center gap-1 ml-auto hover:text-slate-900 dark:hover:text-white cursor-pointer transition">
                  Change %
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-3 font-bold text-right">
                <button onClick={() => handleSort('volume')} className="flex items-center gap-1 ml-auto hover:text-slate-900 dark:hover:text-white cursor-pointer transition">
                  Vol 24H
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-3 font-bold text-right">
                <button onClick={() => handleSort('marketCap')} className="flex items-center gap-1 ml-auto hover:text-slate-905 dark:hover:text-white cursor-pointer transition">
                  Mkt Cap
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-3 font-bold text-center">
                <button onClick={() => handleSort('peRatio')} className="flex items-center gap-1 mx-auto hover:text-slate-900 dark:hover:text-white cursor-pointer transition">
                  P/E Ratio
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-3 font-bold text-center">
                <button onClick={() => handleSort('rsi')} className="flex items-center gap-1 mx-auto hover:text-slate-905 dark:hover:text-white cursor-pointer transition">
                  RSI (14)
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-4 text-right font-bold text-slate-500 dark:text-slate-350">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850/60">
            {finalFilteredStocks.length > 0 ? (
              finalFilteredStocks.map(stock => (
                <ScreenerRow
                  key={stock.symbol}
                  stock={stock}
                  onSelectStock={onSelectStock}
                  onSelectFoStock={onSelectFoStock}
                  formatVolume={formatVolume}
                  formatMarketCap={formatMarketCap}
                  realData={realStockData[stock.symbol]}
                  isLoading={loadingStocks[stock.symbol]}
                  isWatchlisted={watchlist.includes(stock.symbol)}
                  onToggleWatchlist={handleToggleWatchlist}
                />
              ))
            ) : activePreset === 'watchlist' && !user ? (
              <tr>
                <td colSpan={9} className="py-12 px-4 text-center">
                  <Lock size={32} className="mx-auto text-slate-400 dark:text-slate-505 mb-3" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Watchlist is Locked</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-4">
                    Get real-time market sync and track your preferred Indian equities by signing in first.
                  </p>
                  <button 
                    onClick={loginWithGoogle}
                    className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Login with Google
                  </button>
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={9} className="py-10 px-4 text-center text-xs font-mono text-slate-500">
                  No shares match the active screening properties
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Options P&L Calculator & IV Rank Section */}
      <div className="flex flex-col gap-6 mt-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={20} className="text-purple-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pro Tools <span className="text-xs font-mono font-medium text-slate-500 ml-2">ADVANCED ANALYSIS</span></h2>
        </div>
        {user ? (
          <>
            <GreeksCalculator />
            <OptionsCalculator />
            <IVRankTool />
            <RiskCalculator />
          </>
        ) : (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500"></div>
            <Lock size={40} className="mx-auto text-slate-400 dark:text-slate-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Pro Features Locked</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
              Sign in with your Google account to unlock advanced F&O modeling tools including the Black-Scholes Options Greeks Engine, Options P&L Calculator, IV Rank Indicator, and Risk Sizing Engine. Always 100% free.
            </p>
            <button 
              onClick={loginWithGoogle}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-sm px-6 py-2.5 rounded-lg text-sm font-bold transition"
            >
              Sign In to Access Pro Tools
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
