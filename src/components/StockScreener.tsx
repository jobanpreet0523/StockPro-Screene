import React, { useState, useMemo, useEffect } from 'react';
import { SlidersHorizontal, ArrowUpDown, Play, Sparkles, Filter, CheckCircle2, ChevronRight, Calculator, Download } from 'lucide-react';
import { Stock } from '../types';

interface ScreenerRowProps {
  key?: string;
  stock: Stock;
  onSelectStock: (symbol: string) => void;
  onSelectFoStock: (symbol: string) => void;
  formatVolume: (vol: number) => string;
  formatMarketCap: (cap: number) => string;
}

function ScreenerRow({ stock, onSelectStock, onSelectFoStock, formatVolume, formatMarketCap }: ScreenerRowProps) {
  const [prevPrice, setPrevPrice] = useState<number>(stock.price);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (stock.price !== prevPrice) {
      setFlash(stock.price > prevPrice ? 'up' : 'down');
      setPrevPrice(stock.price);
      const timer = setTimeout(() => {
        setFlash(null);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [stock.price, prevPrice]);

  const isPositive = stock.change >= 0;
  const rsiColorClass = stock.rsi >= 70 
    ? 'bg-rose-950/40 text-rose-400 border border-rose-900/30 font-bold' 
    : stock.rsi <= 40 
    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 font-bold' 
    : 'bg-slate-900 text-slate-300';

  // Dynamic green/red flash visual background for price field
  const flashBgClass = flash === 'up'
    ? 'bg-emerald-500/20 text-emerald-300 font-bold scale-[1.02] shadow-sm shadow-emerald-500/20 rounded duration-150'
    : flash === 'down'
    ? 'bg-rose-500/20 text-rose-300 font-bold scale-[1.02] shadow-sm shadow-rose-500/20 rounded duration-150'
    : 'duration-1000';

  return (
    <tr className="hover:bg-slate-900/30 transition duration-150 class_stock_row text-sm">
      {/* Ticker Symbol */}
      <td className="py-3.5 px-4 font-mono font-bold text-white">
        <div className="flex items-center gap-1.5">
          <span onClick={() => onSelectStock(stock.symbol)} className="hover:text-emerald-400 cursor-pointer transition underline decoration-dotted underline-offset-4">
            {stock.symbol.replace('.NS', '')}
          </span>
          {stock.isFoEnabled && (
            <span
              onClick={() => onSelectFoStock(stock.symbol)}
              title="Futures and Options Supported - Click to open Option Chain"
              className="bg-purple-950 text-purple-300 text-[8px] font-extrabold px-1.5 py-0.5 rounded cursor-pointer border border-purple-800/40 hover:bg-purple-900 hover:text-white transition uppercase"
            >
              F&O
            </span>
          )}
        </div>
      </td>

      {/* Company Name & Sector */}
      <td className="py-3.5 px-3">
        <span className="font-sans text-slate-200 block text-xs truncate max-w-[160px]">{stock.name}</span>
        <span className="text-[10px] text-slate-450 font-mono uppercase">{stock.sector}</span>
      </td>

      {/* Spot Pricing */}
      <td className="py-3.5 px-3 text-right font-mono text-xs font-semibold">
        <span className={`inline-block px-1.5 py-0.5 transition-all text-right select-none ${flashBgClass}`}>
          {stock.price >= 100 ? stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : stock.price.toFixed(2)}
        </span>
      </td>

      {/* Today change % */}
      <td className="py-3.5 px-3 text-right font-mono font-bold text-xs">
        <span className={`inline-flex items-center ${isPositive ? 'text-emerald-450' : 'text-rose-450'}`}>
          {isPositive ? '+' : ''}{stock.changePercent}%
        </span>
      </td>

      {/* volume */}
      <td className="py-3.5 px-3 text-right font-mono text-slate-400 text-xs">
        {formatVolume(stock.volume)}
      </td>

      {/* market cap */}
      <td className="py-3.5 px-3 text-right font-mono text-slate-400 text-xs">
        {formatMarketCap(stock.marketCap)}
      </td>

      {/* PE Ratio */}
      <td className="py-3.5 px-3 text-center font-mono text-slate-300 text-xs">
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
            onClick={() => onSelectStock(stock.symbol)}
            title="Open Interactive Chart"
            className="p-1 px-2.5 rounded bg-emerald-950/40 hover:bg-emerald-900 text-emerald-400 hover:text-white transition text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Play size={10} className="fill-current" />
            Chart
          </button>
          {stock.isFoEnabled && (
            <button
              onClick={() => onSelectFoStock(stock.symbol)}
              title="Open F&O Derivatives Console"
              className="p-1 px-2.5 rounded bg-purple-950/45 hover:bg-purple-900 text-purple-300 hover:text-white transition text-xs font-semibold flex items-center gap-1 cursor-pointer"
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
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPe, setMaxPe] = useState<number>(100);
  const [minRsi, setMinRsi] = useState<number>(10);
  const [maxRsi, setMaxRsi] = useState<number>(90);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [sortField, setSortField] = useState<SortField>('changePercent');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Available sectors from inventory
  const sectors = useMemo(() => {
    return ['All', ...Array.from(new Set(stocks.map(s => s.sector)))];
  }, [stocks]);

  // Set preset query filters
  const presetFilteredStocks = useMemo(() => {
    switch (activePreset) {
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
  }, [stocks, activePreset]);

  // Refined sliders and select filter values
  const finalFilteredStocks = useMemo(() => {
    let result = [...presetFilteredStocks];
    
    if (selectedSector !== 'All') {
      result = result.filter(s => s.sector === selectedSector);
    }
    
    result = result.filter(s => s.price >= minPrice);
    result = result.filter(s => s.peRatio <= maxPe);
    result = result.filter(s => s.rsi >= minRsi && s.rsi <= maxRsi);

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
  }, [presetFilteredStocks, selectedSector, minPrice, maxPe, minRsi, maxRsi, sortField, sortOrder]);

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
    const sectorName = selectedSector.replace(/\s+/g, '_');
    const filename = `StockPro_Screener_${presetLabel}_${sectorName}_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 shadow-xl" id="screener_viewport">
      {/* Search Presets Row */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-6 border-b border-slate-850 pb-5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-400" />
            Stock Screening Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">Sift and filter high-liquidity assets based on technical criteria</p>
        </div>

        {/* Preset selections */}
        <div className="flex flex-wrap gap-2 w-full xl:w-auto" id="screener_presets">
          {[
            { id: 'all', name: 'All Instruments' },
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide border transition-all ${
                activePreset === p.id
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40 shadow-inner'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Toggle & Sliders */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="screener_controls">
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-emerald-400 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg cursor-pointer transition select-none"
            id="toggle_filters_btn"
          >
            <SlidersHorizontal size={14} className={showFilters ? 'text-emerald-400' : ''} />
            {showFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
            <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-medium">
              {selectedSector !== 'All' || minPrice > 0 || maxPe < 100 || minRsi > 10 || maxRsi < 90 ? 'Active' : 'Off'}
            </span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-400 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/25 hover:border-emerald-500/60 px-4 py-2 rounded-lg cursor-pointer transition shadow-lg shadow-emerald-950/20"
            id="btn_export_csv"
            title="Download filtered stock list as a CSV spreadsheet"
          >
            <Download size={14} className="text-emerald-400" />
            Export to CSV
            <span className="bg-emerald-900/50 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              {finalFilteredStocks.length} Stock{finalFilteredStocks.length !== 1 ? 's' : ''}
            </span>
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-4 p-4 rounded-xl bg-slate-900/50 border border-slate-850 animate-fadeIn" id="advanced_filters_panel">
            {/* Sector Choose */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Sector Group</label>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white text-xs rounded-lg p-2.5 outline-none focus:border-emerald-500 transition font-medium"
              >
                {sectors.map(s => (
                  <option key={s} value={s}>{s === 'All' ? 'All Sectors' : s}</option>
                ))}
              </select>
            </div>

            {/* Price floor slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Min Price</span>
                <span className="text-emerald-400 font-mono">₹{minPrice}</span>
              </div>
              <input
                type="range"
                min="0"
                max="3000"
                step="50"
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                className="accent-emerald-400 mt-2 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
              />
            </div>

            {/* PE Ceiling Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Max PE Ratio</span>
                <span className="text-emerald-400 font-mono">{maxPe >= 100 ? 'Any' : maxPe}</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="2"
                value={maxPe}
                onChange={(e) => setMaxPe(Number(e.target.value))}
                className="accent-emerald-400 mt-2 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
              />
            </div>

            {/* RSI Range Filter */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                <span>RSI Boundaries</span>
                <span className="text-emerald-400 font-mono">{minRsi} - {maxRsi}</span>
              </div>
              <div className="flex gap-2 items-center mt-1">
                <input
                  type="number"
                  min="5"
                  max="45"
                  value={minRsi}
                  onChange={(e) => setMinRsi(Math.max(5, Number(e.target.value)))}
                  className="w-1/2 bg-slate-950 border border-slate-800 text-center text-xs font-mono py-1 rounded text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-slate-500 text-xs">-</span>
                <input
                  type="number"
                  min="50"
                  max="95"
                  value={maxRsi}
                  onChange={(e) => setMaxRsi(Math.min(95, Number(e.target.value)))}
                  className="w-1/2 bg-slate-950 border border-slate-800 text-center text-xs font-mono py-1 rounded text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Stock Grid Table */}
      <div className="overflow-x-auto" id="screener_table_container">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-850 text-[10px] text-slate-400 uppercase tracking-widest font-mono">
              <th className="py-3 px-4 font-bold">
                <button onClick={() => handleSort('symbol')} className="flex items-center gap-1 hover:text-white cursor-pointer transition">
                  Ticker CODE
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-3 font-bold">Instrument NAME</th>
              <th className="py-3 px-3 font-bold text-right">
                <button onClick={() => handleSort('price')} className="flex items-center gap-1 ml-auto hover:text-white cursor-pointer transition">
                  SPOT Price (₹)
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-3 font-bold text-right">
                <button onClick={() => handleSort('changePercent')} className="flex items-center gap-1 ml-auto hover:text-white cursor-pointer transition">
                  Change %
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-3 font-bold text-right">
                <button onClick={() => handleSort('volume')} className="flex items-center gap-1 ml-auto hover:text-white cursor-pointer transition">
                  Vol 24H
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-3 font-bold text-right">
                <button onClick={() => handleSort('marketCap')} className="flex items-center gap-1 ml-auto hover:text-white cursor-pointer transition">
                  Mkt Cap
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-3 font-bold text-center">
                <button onClick={() => handleSort('peRatio')} className="flex items-center gap-1 mx-auto hover:text-white cursor-pointer transition">
                  P/E Ratio
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-3 font-bold text-center">
                <button onClick={() => handleSort('rsi')} className="flex items-center gap-1 mx-auto hover:text-white cursor-pointer transition">
                  RSI (14)
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-4 text-right font-bold text-slate-350">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/60">
            {finalFilteredStocks.length > 0 ? (
              finalFilteredStocks.map(stock => (
                <ScreenerRow
                  key={stock.symbol}
                  stock={stock}
                  onSelectStock={onSelectStock}
                  onSelectFoStock={onSelectFoStock}
                  formatVolume={formatVolume}
                  formatMarketCap={formatMarketCap}
                />
              ))
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
    </div>
  );
}
