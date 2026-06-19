import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid 
} from 'recharts';
import { 
  Building2, Search, ArrowUpDown, Filter, Sparkles, RefreshCw, Calendar, 
  TrendingUp, TrendingDown, Layers, HelpCircle, Check, ArrowRightLeft, ShieldAlert
} from 'lucide-react';

export interface Deal {
  date: string;
  symbol: string;
  clientName: string;
  buySell: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  value: number; // in ₹ Crores
}

export default function DealsTracker() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorObj, setErrorObj] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Filters State
  const [symbolSearch, setSymbolSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [minVal, setMinVal] = useState<number>(0);
  
  // Date Picker States
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Sorting
  const [sortField, setSortField] = useState<'date' | 'value' | 'price' | 'quantity'>('value');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchDeals = async () => {
    setLoading(true);
    setErrorObj(null);
    try {
      const response = await fetch('/api/block-deals');
      if (!response.ok) {
        throw new Error(`Failed to load block deals: HTTP ${response.status}`);
      }
      const json = await response.json();
      if (json && json.data) {
        setDeals(json.data);
        setLastFetched(new Date());
      } else {
        throw new Error('API returned malformed block deal payload');
      }
    } catch (err: any) {
      console.error(err);
      setErrorObj(err.message || 'System issues fetching block deals. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  // Set default calendar constraints when deals are loaded
  useEffect(() => {
    if (deals.length > 0) {
      // Extract unique dates sorted chronologically
      const dates = Array.from(new Set(deals.map(d => d.date)))
        .map((dStr: string) => ({ str: dStr, ms: new Date(dStr.replace(/-/g, ' ')).getTime() }))
        .sort((a, b) => a.ms - b.ms);
      
      if (dates.length > 0) {
        // Find min / max dates to preselect range
        const firstDealDate = deals[deals.length - 1]?.date; // usually oldest
        const lastDealDate = deals[0]?.date; // usually newest
      }
    }
  }, [deals]);

  // Handle Sort changes
  const toggleSort = (field: 'date' | 'value' | 'price' | 'quantity') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Unique list of dates for dropdown selections
  const uniqueDates = useMemo(() => {
    const datesSet = new Set(deals.map(d => d.date));
    return Array.from(datesSet).sort((a: string, b: string) => {
      const msA = new Date(a.replace(/-/g, ' ')).getTime();
      const msB = new Date(b.replace(/-/g, ' ')).getTime();
      return msB - msA; // Date Newest First
    });
  }, [deals]);

  // Apply filters
  const filteredDeals = useMemo(() => {
    let result = [...deals];

    // Symbol lookup
    if (symbolSearch.trim() !== '') {
      const query = symbolSearch.toLowerCase().trim();
      result = result.filter(d => 
        d.symbol.toLowerCase().includes(query) || 
        d.clientName.toLowerCase().includes(query)
      );
    }

    // Buy/Sell filter
    if (typeFilter !== 'ALL') {
      result = result.filter(d => d.buySell === typeFilter);
    }

    // Minimum deal size crores
    if (minVal > 0) {
      result = result.filter(d => d.value >= minVal);
    }

    // Date range picker filters
    if (startDate !== '') {
      const msStart = new Date(startDate.replace(/-/g, ' ')).getTime();
      result = result.filter(d => {
        const msD = new Date(d.date.replace(/-/g, ' ')).getTime();
        return msD >= msStart;
      });
    }

    if (endDate !== '') {
      const msEnd = new Date(endDate.replace(/-/g, ' ')).getTime();
      result = result.filter(d => {
        const msD = new Date(d.date.replace(/-/g, ' ')).getTime();
        return msD <= msEnd;
      });
    }

    // Sort logic
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        const msA = new Date(a.date.replace(/-/g, ' ')).getTime();
        const msB = new Date(b.date.replace(/-/g, ' ')).getTime();
        comparison = msA - msB;
      } else if (sortField === 'value') {
        comparison = a.value - b.value;
      } else if (sortField === 'price') {
        comparison = a.price - b.price;
      } else if (sortField === 'quantity') {
        comparison = a.quantity - b.quantity;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [deals, symbolSearch, typeFilter, minVal, startDate, endDate, sortField, sortDirection]);

  // Summary Metrics calculations
  const summaryMetrics = useMemo(() => {
    // We compute "today's" deals based on the most recent date available in the dataset
    if (deals.length === 0) return { totalBuyCr: 0, totalSellCr: 0, mostTradedSymbol: 'None', mostTradedVal: 0 };

    const newestDate = deals[0].date;
    const todayDeals = deals.filter(d => d.date === newestDate);

    const totalBuy = todayDeals
      .filter(d => d.buySell === 'BUY')
      .reduce((sum, d) => sum + d.value, 0);

    const totalSell = todayDeals
      .filter(d => d.buySell === 'SELL')
      .reduce((sum, d) => sum + d.value, 0);

    // Compute most active stock inside the whole loaded list (value sum)
    const stockStats: Record<string, number> = {};
    deals.forEach(d => {
      stockStats[d.symbol] = (stockStats[d.symbol] || 0) + d.value;
    });

    let maxStock = 'None';
    let maxVal = 0;
    Object.entries(stockStats).forEach(([sym, val]) => {
      if (val > maxVal) {
        maxVal = val;
        maxStock = sym;
      }
    });

    return {
      newestDate,
      totalBuyCr: Number(typeof totalBuy === 'number' ? totalBuy.toFixed(2) : Number(totalBuy || 0).toFixed(2)),
      totalSellCr: Number(typeof totalSell === 'number' ? totalSell.toFixed(2) : Number(totalSell || 0).toFixed(2)),
      mostTradedSymbol: maxStock,
      mostTradedVal: Number(typeof maxVal === 'number' ? maxVal.toFixed(2) : Number(maxVal || 0).toFixed(2))
    };
  }, [deals]);

  // Weekly aggregates bar chart data: Top 10 most traded stocks by total cumulative deal value
  const chartData = useMemo(() => {
    const agg: Record<string, { buy: number; sell: number; total: number }> = {};
    
    deals.forEach(d => {
      if (!agg[d.symbol]) {
        agg[d.symbol] = { buy: 0, sell: 0, total: 0 };
      }
      if (d.buySell === 'BUY') {
        agg[d.symbol].buy += d.value;
      } else {
        agg[d.symbol].sell += d.value;
      }
      agg[d.symbol].total += d.value;
    });

    return Object.entries(agg)
      .map(([sym, item]) => ({
        stock: sym,
        'Cumulative BUY Value (₹Cr)': Number(typeof item.buy === 'number' ? item.buy.toFixed(1) : Number(item.buy || 0).toFixed(1)),
        'Cumulative SELL Value (₹Cr)': Number(typeof item.sell === 'number' ? item.sell.toFixed(1) : Number(item.sell || 0).toFixed(1)),
        totalValue: Number(typeof item.total === 'number' ? item.total.toFixed(1) : Number(item.total || 0).toFixed(1))
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);
  }, [deals]);

  return (
    <div className="space-y-6" id="deals_tracker_panel">
      
      {/* Top Banner & Control bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-lg">
              <Building2 size={18} />
            </span>
            <h2 className="text-lg font-black font-sans uppercase text-slate-900 dark:text-white leading-none tracking-tight">
              Institutional Bulk & Block Deals Command Center
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            TRACKING LARGE BLOCK TRANSACTIONS OVER ₹5CR BY FII, DII, AND GLOBAL TRUSTS
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {lastFetched && (
            <span className="text-[10px] font-mono text-slate-400 font-bold">
              Synced: {lastFetched.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchDeals}
            disabled={loading}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold transition disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Fetch NSE Feed
          </button>
        </div>
      </div>

      {/* Summary Analytics Cards Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Card 1: Today's Date Context */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850 shadow-sm">
          <span className="text-[10px] font-black tracking-widest text-slate-400 font-mono uppercase block">Active Tracking Session</span>
          <div className="flex items-center gap-2.5 mt-2">
            <Calendar className="text-blue-500 shrink-0" size={18} />
            <div>
              <span className="text-sm font-black text-slate-900 dark:text-white font-mono uppercase">
                {summaryMetrics.newestDate || 'Retrieving...'}
              </span>
              <p className="text-[10px] text-slate-500 font-semibold font-sans mt-0.5">Most Recent Trading Slate</p>
            </div>
          </div>
        </div>

        {/* Card 2: Cumulative BUYs */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850 shadow-sm border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-black tracking-widest text-emerald-600 dark:text-emerald-400 font-mono uppercase block">Total BUY Actions (Today)</span>
          <div className="flex items-center gap-2.5 mt-2">
            <TrendingUp className="text-emerald-500 shrink-0" size={18} />
            <div>
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                ₹{summaryMetrics.totalBuyCr.toLocaleString()} Cr
              </span>
              <p className="text-[10px] text-slate-500 font-semibold font-sans mt-0.5">FII/DII Direct Injections Today</p>
            </div>
          </div>
        </div>

        {/* Card 3: Cumulative SELLs */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850 shadow-sm border-l-4 border-l-rose-500">
          <span className="text-[10px] font-black tracking-widest text-rose-600 dark:text-rose-400 font-mono uppercase block">Total SELL Actions (Today)</span>
          <div className="flex items-center gap-2.5 mt-2">
            <TrendingDown className="text-rose-500 shrink-0" size={18} />
            <div>
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                ₹{summaryMetrics.totalSellCr.toLocaleString()} Cr
              </span>
              <p className="text-[10px] text-slate-500 font-semibold font-sans mt-0.5">Institutional Strategic Outflows</p>
            </div>
          </div>
        </div>

        {/* Card 4: Most Active Stock */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850 shadow-sm border-l-4 border-l-amber-500">
          <span className="text-[10px] font-black tracking-widest text-amber-500 font-mono uppercase block">Most Active Stock This Week</span>
          <div className="flex items-center gap-2.5 mt-2">
            <Sparkles className="text-amber-500 shrink-0" size={18} />
            <div>
              <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                {summaryMetrics.mostTradedSymbol}
              </span>
              <p className="text-[10px] text-slate-500 font-semibold font-sans mt-0.5">
                ₹{summaryMetrics.mostTradedVal.toLocaleString()} Cr Cumulative Deals
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Grid: Bar Chart & Custom Dynamic Filter Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top 10 Stocks volume block visual graph (Recharts) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-sm flex flex-col justify-between min-h-[360px]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[9px] font-black text-indigo-500 font-mono uppercase tracking-wider block">Institutional Footprint</span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">TOP 10 STOCKS BY WEEKLY BLOCK VALUE (BUY vs SELL)</h3>
              </div>
              <span className="text-[9px] bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-slate-500 font-mono font-bold">
                100% Real API
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500 leading-snug">
              Compare institutional buying (green block segments) versus sales (red blocks) to assess market consolidation or rotation phases.
            </p>
          </div>

          <div className="flex-1 w-full min-h-[220px] mt-4">
            {deals.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-450 font-mono">
                Loading volume coordinates...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.12} vertical={false} />
                  <XAxis 
                    dataKey="stock" 
                    tick={{ fontSize: 9, fontWeight: 'bold', fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', fontSize: '11px', border: 'none', backgroundColor: '#0f172a', color: '#ffffff' }}
                    cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                  />
                  <Bar dataKey="Cumulative BUY Value (₹Cr)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Cumulative SELL Value (₹Cr)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-4 text-[9px] font-bold font-mono pt-3 border-t border-slate-100 dark:border-slate-850">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> BUY Value Cr</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block"></span> SELL Value Cr</span>
          </div>
        </div>

        {/* Dynamic Multi-Parameter Interactive Filters Desk */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Filter size={15} className="text-emerald-555" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">Smarter Analytics Filter Deck</h3>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Refine results below to highlight critical institutional footprints by symbol, deal size, or direction.
            </p>
          </div>

          <div className="space-y-4 my-5 flex-1 select-none">
            
            {/* Symbol & Client Search */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] font-black uppercase text-slate-500 dark:text-slate-400 font-mono tracking-wider block">Symbol or Client Search</label>
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. RELIANCE, Morgan Stanley, LIC..."
                  value={symbolSearch}
                  onChange={(e) => setSymbolSearch(e.target.value)}
                  className="w-full text-xs font-semibold pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Buy Sell toggle Buttons */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] font-black uppercase text-slate-500 dark:text-slate-400 font-mono tracking-wider block">Transaction Category Filter</label>
              <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800">
                {(['ALL', 'BUY', 'SELL'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`py-1 rounded-md transition ${typeFilter === type ? 'bg-white dark:bg-slate-850 hover:bg-white text-slate-900 dark:text-white shadow-sm font-extrabold' : 'text-slate-500 dark:text-slate-450 hover:text-slate-750 dark:hover:text-slate-200'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Minimum deal value slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[9.5px] font-black uppercase text-slate-500 dark:text-slate-400 font-mono tracking-wider block">Min Deal Value (₹ Crores)</label>
                <span className="text-xs font-mono font-bold text-emerald-500 dark:text-emerald-400">
                  {minVal === 0 ? 'All Sizes' : `&ge; ₹${minVal} Cr`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="150"
                step="5"
                value={minVal}
                onChange={(e) => setMinVal(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                <span>0 Cr (All)</span>
                <span>₹50 Cr</span>
                <span>₹100 Cr (Whales)</span>
                <span>₹150 Cr+</span>
              </div>
            </div>

            {/* Date range picker logic */}
            <div className="grid grid-cols-2 gap-3.5 pt-1">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 font-mono tracking-wider flex items-center gap-1">
                  <Calendar size={10} /> Date From
                </label>
                <select
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs font-mono font-medium p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Any Oldest</option>
                  {uniqueDates.map(d => (
                    <option key={`start-${d}`} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 font-mono tracking-wider flex items-center gap-1">
                  <Calendar size={10} /> Date To
                </label>
                <select
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs font-mono font-medium p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Any Newest</option>
                  {uniqueDates.map(d => (
                    <option key={`end-${d}`} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          {/* Quick reset option */}
          <button
            onClick={() => {
              setSymbolSearch('');
              setTypeFilter('ALL');
              setMinVal(0);
              setStartDate('');
              setEndDate('');
            }}
            className="w-full text-[10.5px] font-bold text-slate-600 dark:text-slate-400 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-center transition"
          >
            Reset Active Filters
          </button>
        </div>

      </div>

      {/* Main Deals Table Panel */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-sm overflow-hidden" id="deals_datatable">
        
        {/* Table header indicators */}
        <div className="bg-slate-50 dark:bg-slate-900/60 px-5 py-4 border-b border-slate-150 dark:border-slate-850 flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
              Institutional Deals Tracking Log
            </h3>
            <p className="text-[10.5px] text-slate-550 dark:text-slate-400 mt-0.5">
              Reflecting actual transaction logs. Records showing <span className="font-extrabold inline-flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-750 dark:text-emerald-400 py-0.5 px-1.5 rounded text-[9.5px]">&gt; ₹100 Cr Whale</span> highlights have premium whale icons 🐋.
            </p>
          </div>

          <div className="text-[11px] font-mono font-medium text-slate-500 ml-auto bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-lg py-1 px-2.5">
            Displaying <span className="font-bold text-slate-900 dark:text-white">{filteredDeals.length}</span> out of {deals.length} global trades
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center space-y-4">
            <span className="w-8 h-8 rounded-full border-3 border-emerald-500 border-t-transparent animate-spin inline-block" />
            <p className="text-xs font-mono text-slate-500 font-bold uppercase tracking-widest">Compiling active deal records from NSE gateways...</p>
          </div>
        ) : errorObj ? (
          <div className="p-16 text-center select-none space-y-3">
            <ShieldAlert size={40} className="mx-auto text-rose-500" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">External Data Blockage</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">{errorObj}</p>
            <button
              onClick={fetchDeals}
              className="mt-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-4 rounded-lg shadow"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="p-20 text-center select-none space-y-2">
            <Layers size={32} className="mx-auto text-slate-400 opacity-60" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-350">No Large Scale Deals Passed Your Filters</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">Adjust search keys or lower the Crore limit slider to surface more records.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-150 dark:border-slate-850 text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest font-mono select-none">
                  <th className="py-3.5 px-5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-850 transition" onClick={() => toggleSort('date')}>
                    <div className="flex items-center gap-1">
                      Date {sortField === 'date' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Symbol</th>
                  <th className="py-3.5 px-4">Client Name</th>
                  <th className="py-3.5 px-4 text-center">Buy/Sell</th>
                  <th className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-850 transition" onClick={() => toggleSort('quantity')}>
                    <div className="flex items-center justify-end gap-1">
                      Quantity {sortField === 'quantity' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-850 transition" onClick={() => toggleSort('price')}>
                    <div className="flex items-center justify-end gap-1">
                      Price {sortField === 'price' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </div>
                  </th>
                  <th className="py-3.5 px-5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-850 transition" onClick={() => toggleSort('value')}>
                    <div className="flex items-center justify-end gap-1">
                      Deal Value {sortField === 'value' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-sans">
                {filteredDeals.map((deal, idx) => {
                  const isWhale = deal.value >= 100;
                  const isBuy = deal.buySell === 'BUY';
                  
                  return (
                    <tr 
                      key={`deal-${idx}`} 
                      className={`hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors ${
                        isWhale 
                          ? 'bg-amber-500/5 dark:bg-amber-950/10 border-l border-amber-500' 
                          : isBuy 
                            ? 'bg-emerald-500/[0.01]' 
                            : 'bg-rose-500/[0.01]'
                      }`}
                    >
                      <td className="py-3 px-5 font-mono text-slate-600 dark:text-slate-400 font-semibold whitespace-nowrap">
                        {deal.date}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-black text-slate-900 dark:text-white text-xs bg-slate-100 dark:bg-slate-800/80 rounded px-1.5 py-0.5 shadow-sm">
                          {deal.symbol}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-1.5 truncate max-w-[240px]">
                          <span className="truncate">{deal.clientName}</span>
                          {isWhale && (
                            <span 
                              className="text-xs cursor-help bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-900/60 text-amber-800 dark:text-amber-400 rounded-full px-1.5 py-0.2"
                              title="Smart Money Whales: Cumulative deal size exceeding ₹100 Crore"
                            >
                              🐋 Whale Alert
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          isBuy 
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400' 
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-400'
                        }`}>
                          {deal.buySell}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-705 dark:text-slate-200">
                        {(deal.quantity || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-705 dark:text-slate-200">
                        ₹{(deal.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-5 text-right font-mono text-xs font-black">
                        <span className={isBuy ? 'text-emerald-600' : 'text-rose-600'}>
                          ₹{typeof deal.value === 'number' ? deal.value.toFixed(2) : Number(deal.value || 0).toFixed(2)} Cr
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
