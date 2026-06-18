import React, { useState, useMemo } from 'react';
import { Settings2, Plus, Trash2, TrendingUp, HelpCircle, Activity } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface Leg {
  id: string;
  action: 'Buy' | 'Sell';
  type: 'Call' | 'Put';
  strike: number;
  premium: number;
  lots: number;
}

const STRATEGIES = [
  'Bull Call Spread',
  'Bear Put Spread',
  'Iron Condor',
  'Straddle',
  'Strangle',
  'Butterfly',
  'Covered Call'
] as const;

export default function StrategyBuilder() {
  const [spotPrice, setSpotPrice] = useState<number>(25000);
  const [legs, setLegs] = useState<Leg[]>([]);

  const applyStrategy = (strat: string) => {
    const s = spotPrice;
    let newLegs: Leg[] = [];
    const ID = () => Math.random().toString(36).substr(2, 9);
    
    switch (strat) {
      case 'Bull Call Spread':
        newLegs = [
          { id: ID(), action: 'Buy', type: 'Call', strike: s, premium: 200, lots: 50 },
          { id: ID(), action: 'Sell', type: 'Call', strike: s + 300, premium: 100, lots: 50 },
        ];
        break;
      case 'Bear Put Spread':
        newLegs = [
          { id: ID(), action: 'Buy', type: 'Put', strike: s, premium: 200, lots: 50 },
          { id: ID(), action: 'Sell', type: 'Put', strike: s - 300, premium: 100, lots: 50 },
        ];
        break;
      case 'Iron Condor':
        newLegs = [
          { id: ID(), action: 'Sell', type: 'Put', strike: s - 200, premium: 150, lots: 50 },
          { id: ID(), action: 'Buy', type: 'Put', strike: s - 400, premium: 70, lots: 50 },
          { id: ID(), action: 'Sell', type: 'Call', strike: s + 200, premium: 150, lots: 50 },
          { id: ID(), action: 'Buy', type: 'Call', strike: s + 400, premium: 70, lots: 50 },
        ];
        break;
      case 'Straddle':
        newLegs = [
          { id: ID(), action: 'Buy', type: 'Call', strike: s, premium: 250, lots: 50 },
          { id: ID(), action: 'Buy', type: 'Put', strike: s, premium: 250, lots: 50 },
        ];
        break;
      case 'Strangle':
        newLegs = [
          { id: ID(), action: 'Buy', type: 'Call', strike: s + 300, premium: 120, lots: 50 },
          { id: ID(), action: 'Buy', type: 'Put', strike: s - 300, premium: 120, lots: 50 },
        ];
        break;
      case 'Butterfly':
        newLegs = [
          { id: ID(), action: 'Buy', type: 'Call', strike: s - 300, premium: 350, lots: 50 },
          { id: ID(), action: 'Sell', type: 'Call', strike: s, premium: 150, lots: 100 },
          { id: ID(), action: 'Buy', type: 'Call', strike: s + 300, premium: 50, lots: 50 },
        ];
        break;
      case 'Covered Call':
        newLegs = [
          { id: ID(), action: 'Buy', type: 'Call', strike: 0, premium: s, lots: 50 }, // Synthetic Stock
          { id: ID(), action: 'Sell', type: 'Call', strike: s + 300, premium: 150, lots: 50 },
        ];
        break;
    }
    setLegs(newLegs);
  };

  const addLeg = () => {
    if (legs.length >= 4) return;
    setLegs([...legs, {
      id: Math.random().toString(36).substr(2, 9),
      action: 'Buy',
      type: 'Call',
      strike: spotPrice,
      premium: 100,
      lots: 50
    }]);
  };

  const removeLeg = (id: string) => {
    setLegs(legs.filter(l => l.id !== id));
  };

  const updateLeg = (id: string, field: keyof Leg, value: any) => {
    setLegs(legs.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const calculatePayoff = (spot: number, leg: Leg) => {
    let intrinsic = 0;
    if (leg.type === 'Call') {
      intrinsic = Math.max(0, spot - leg.strike);
    } else {
      intrinsic = Math.max(0, leg.strike - spot);
    }
    
    let pnl = 0;
    if (leg.action === 'Buy') {
      pnl = (intrinsic - leg.premium) * leg.lots;
    } else {
      pnl = (leg.premium - intrinsic) * leg.lots;
    }
    return pnl;
  };

  // Generate chart data
  const chartData = useMemo(() => {
    const data = [];
    const minSpot = Math.max(0, spotPrice - 500);
    const maxSpot = spotPrice + 500;
    const step = 10;

    for (let s = minSpot; s <= maxSpot; s += step) {
      const totalPnl = legs.reduce((acc, leg) => acc + calculatePayoff(s, leg), 0);
      data.push({ spot: s, pnl: totalPnl });
    }
    return data;
  }, [spotPrice, legs]);

  // Calculate gradient offset for green/red line
  const off = useMemo(() => {
    if (chartData.length === 0) return 0;
    const dataMax = Math.max(...chartData.map(i => i.pnl));
    const dataMin = Math.min(...chartData.map(i => i.pnl));
    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;
    return dataMax / (dataMax - dataMin);
  }, [chartData]);

  // Calculate stats
  const stats = useMemo(() => {
    if (legs.length === 0) return null;

    let netPrem = 0;
    legs.forEach(l => {
      const val = l.premium * l.lots;
      if (l.action === 'Buy') netPrem -= val;
      else netPrem += val;
    });

    let maxProf = -Infinity;
    let maxLoss = Infinity;

    // Check extreme points to deduce unboundedness
    const extendedData = [];
    for (let s = Math.max(0, spotPrice - 10000); s <= spotPrice + 10000; s += 100) {
      const totalPnl = legs.reduce((acc, leg) => acc + calculatePayoff(s, leg), 0);
      extendedData.push({ spot: s, pnl: totalPnl });
      if (totalPnl > maxProf) maxProf = totalPnl;
      if (totalPnl < maxLoss) maxLoss = totalPnl;
    }

    // Determine if practically unbounded
    const extremeLow = extendedData[0].pnl;
    const extremeHigh = extendedData[extendedData.length - 1].pnl;
    
    let displayMaxProf = maxProf > 500000 ? 'Unlimited' : `₹${(maxProf ?? 0).toFixed(2)}`;
    let displayMaxLoss = maxLoss < -500000 ? 'Unlimited' : `₹${(maxLoss ?? 0).toFixed(2)}`;

    // Breakevens approximation
    const breakevens: number[] = [];
    for (let i = 1; i < extendedData.length; i++) {
      const prev = extendedData[i - 1];
      const curr = extendedData[i];
      if ((prev.pnl < 0 && curr.pnl > 0) || (prev.pnl > 0 && curr.pnl < 0)) {
        // Interpolate
        const ratio = Math.abs(prev.pnl) / (Math.abs(prev.pnl) + Math.abs(curr.pnl));
        const be = prev.spot + ratio * (curr.spot - prev.spot);
        breakevens.push(be);
      }
    }

    // RR calculation
    let rr = 'N/A';
    if (typeof maxProf === 'number' && typeof maxLoss === 'number' && maxLoss < 0 && maxProf > 0) {
      rr = `1 : ${(maxProf / Math.abs(maxLoss ?? 1)).toFixed(2)}`;
    } else if (displayMaxLoss === 'Unlimited' && typeof maxProf === 'number' && maxProf > 0) {
       rr = 'Risk Unbounded';
    } else if (displayMaxProf === 'Unlimited' && typeof maxLoss === 'number') {
       rr = 'High Reward';
    }

    return {
      netPremium: netPrem,
      maxProfit: displayMaxProf,
      maxLoss: displayMaxLoss,
      breakevens: breakevens.map(b => Math.round(b)),
      rr
    };
  }, [legs, spotPrice]);

  return (
    <div className="flex flex-col gap-6" id="strategy_builder_view">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-850 pb-4">
        <div>
          <h1 className="text-xl font-sans font-black flex items-center gap-2 text-slate-900 dark:text-white">
            <Settings2 size={20} className="text-emerald-555 dark:text-emerald-400" />
            Options Strategy Builder
          </h1>
          <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
            Build, visualize, and analyze multi-leg options strategies purely locally.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Spot Price:</label>
          <input
            type="number"
            value={spotPrice}
            onChange={(e) => setSpotPrice(Number(e.target.value))}
            className="w-24 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Legs Builder */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Strategy Templates */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-3 font-mono">Pre-Built Strategies</h3>
            <div className="flex flex-wrap gap-2">
              {STRATEGIES.map(strat => (
                <button
                  key={strat}
                  onClick={() => applyStrategy(strat)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition active:scale-95"
                >
                  {strat}
                </button>
              ))}
            </div>
          </div>

          {/* Leg Builder */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 font-mono">Custom Legs ({legs.length}/4)</h3>
              <button
                onClick={addLeg}
                disabled={legs.length >= 4}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-xs font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={14} /> Add Leg
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {legs.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm font-mono border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                  Add a leg or choose a pre-built strategy to begin.
                </div>
              )}
              
              {legs.map((leg, index) => (
                <div key={leg.id} className="flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl relative group">
                  <div className="absolute -left-2.5 -top-2.5 w-5 h-5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full flex items-center justify-center text-[10px] font-black border border-white dark:border-slate-950">
                    {index + 1}
                  </div>
                  
                  {/* Buy/Sell */}
                  <div className="flex bg-slate-200/50 dark:bg-slate-950 p-1 rounded-lg">
                    <button
                      onClick={() => updateLeg(leg.id, 'action', 'Buy')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors ${leg.action === 'Buy' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => updateLeg(leg.id, 'action', 'Sell')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors ${leg.action === 'Sell' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                    >
                      Sell
                    </button>
                  </div>

                  {/* Call/Put */}
                  <div className="flex bg-slate-200/50 dark:bg-slate-950 p-1 rounded-lg">
                    <button
                      onClick={() => updateLeg(leg.id, 'type', 'Call')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors ${leg.type === 'Call' ? 'bg-slate-600 dark:bg-slate-700 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                    >
                      Call
                    </button>
                    <button
                      onClick={() => updateLeg(leg.id, 'type', 'Put')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors ${leg.type === 'Put' ? 'bg-slate-600 dark:bg-slate-700 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                    >
                      Put
                    </button>
                  </div>

                  <div className="flex-1 flex items-center gap-2 ml-auto w-full md:w-auto">
                    <div className="flex flex-col w-1/3">
                      <span className="text-[9px] uppercase text-slate-400 font-bold ml-1 mb-0.5">Strike</span>
                      <input
                        type="number"
                        value={leg.strike}
                        onChange={(e) => updateLeg(leg.id, 'strike', Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded px-2 py-1 text-xs font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex flex-col w-1/3">
                      <span className="text-[9px] uppercase text-slate-400 font-bold ml-1 mb-0.5">Premium (₹)</span>
                      <input
                        type="number"
                        value={leg.premium}
                        onChange={(e) => updateLeg(leg.id, 'premium', Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded px-2 py-1 text-xs font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex flex-col w-1/3">
                      <span className="text-[9px] uppercase text-slate-400 font-bold ml-1 mb-0.5">Lots / Qty</span>
                      <input
                        type="number"
                        value={leg.lots}
                        step={1}
                        onChange={(e) => updateLeg(leg.id, 'lots', Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded px-2 py-1 text-xs font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => removeLeg(leg.id)}
                    className="p-2 text-slate-400 md:ml-2 hover:bg-rose-100 hover:text-rose-500 dark:hover:bg-rose-500/20 rounded-md transition"
                    title="Delete Leg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Results & Chart */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 dark:border-slate-800 rounded-xl p-5 shadow-lg text-white">
             <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 tracking-wider flex items-center gap-2">
                <Activity size={14} className="text-sky-400" />
                Strategy Analysis
             </h3>

             {stats ? (
               <div className="flex flex-col gap-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Max Profit</span>
                      <div className="text-emerald-400 text-lg font-black font-mono tracking-tight mt-0.5">{stats.maxProfit}</div>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Max Loss</span>
                      <div className="text-rose-400 text-lg font-black font-mono tracking-tight mt-0.5">{stats.maxLoss}</div>
                    </div>
                 </div>

                 <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-800/30 p-2.5 rounded-lg border border-slate-700/30">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Net Premium</span>
                      <span className={`text-xs font-bold font-mono ${stats.netPremium >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {stats.netPremium >= 0 ? '+' : ''}{(stats.netPremium ?? 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="bg-slate-800/30 p-2.5 rounded-lg border border-slate-700/30">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Risk / Reward</span>
                      <span className="text-xs font-bold font-mono text-slate-200">{stats.rr}</span>
                    </div>
                    <div className="bg-slate-800/30 p-2.5 rounded-lg border border-slate-700/30 col-span-1">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Breakevens</span>
                      <span className="text-[10px] font-bold font-mono text-sky-300">
                        {stats.breakevens.length > 0 ? stats.breakevens.join(', ') : 'None'}
                      </span>
                    </div>
                 </div>
               </div>
             ) : (
               <div className="text-center py-6 text-slate-500 font-mono text-sm border-2 border-dashed border-slate-800 rounded-lg">
                 Add legs to see risk profile.
               </div>
             )}
          </div>

          {/* Chart Wrapper */}
          {legs.length > 0 && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-4 shadow-sm w-full" style={{ height: 350 }}>
              <h3 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2 font-mono flex items-center justify-between">
                <span>Payoff Chart at Expiry</span>
                <span className="text-[9px] bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded">Spot: {spotPrice}</span>
              </h3>
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset={off} stopColor="#10b981" stopOpacity={1} />
                        <stop offset={off} stopColor="#f43f5e" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis 
                      dataKey="spot" 
                      stroke="#888" 
                      tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }} 
                      domain={['dataMin', 'dataMax']}
                      type="number"
                    />
                    <YAxis 
                      stroke="#888" 
                      tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }} 
                      domain={['auto', 'auto']}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8, color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => [`₹${(value ?? 0).toFixed(2)}`, 'P&L']}
                      labelFormatter={(label) => `Spot Price: ${label}`}
                    />
                    <ReferenceLine y={0} stroke="#64748b" strokeOpacity={0.5} strokeDasharray="3 3" />
                    <ReferenceLine x={spotPrice} stroke="#0ea5e9" strokeOpacity={0.6} strokeDasharray="4 4" label={{ value: 'ATM', position: 'top', fill: '#0ea5e9', fontSize: 10 }} />
                    <Line 
                      type="monotone" 
                      dataKey="pnl" 
                      strokeWidth={3} 
                      dot={false}
                      stroke="url(#splitColor)"
                      activeDot={{ r: 6, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 text-[10px] text-slate-400 dark:text-slate-500 text-center font-mono italic max-w-4xl mx-auto leading-relaxed border-t border-slate-200 dark:border-slate-800 pt-6">
        Disclaimer: This tool calculates theoretical pay-offs based on standard Black-Scholes dynamics and simple arithmetic sum of intrinsic value at expiry. It does not account for slippage, brokerage, STT, margin requirements, or early assignment risks. Options trading is subject to market risks. StockPro is not a SEBI registered investment advisor. Always consult a certified financial planner.
      </div>
    </div>
  );
}
