import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { Calculator, Info, HelpCircle, TrendingUp, Cpu, Percent, Clock } from 'lucide-react';

// User provided Math Helper: Standard Normal Cumulative Distribution Function N(x)
function normalCDF(x: number): number {
  const a1=0.254829592, a2=-0.284496736, a3=1.421413741;
  const a4=-1.453152027, a5=1.061405429, p=0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x)/Math.sqrt(2);
  const t = 1/(1+p*x);
  const y = 1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
  return 0.5*(1+sign*y);
}

// User provided: Core Black-Scholes Greeks Calculation Engine
function blackScholes(S: number, K: number, days: number, r_percent: number, iv_percent: number, type: 'call' | 'put') {
  const T = Math.max(days, 0.001); // in days but we use T/365 in formula
  const sigma = Math.max(iv_percent, 0.1) / 100.0;
  const r = r_percent / 100.0;
  
  const t = T/365;
  const d1 = (Math.log(S/K)+(r+sigma*sigma/2)*t)/(sigma*Math.sqrt(t));
  const d2 = d1 - sigma*Math.sqrt(t);
  
  const price = type==='call'
    ? S*normalCDF(d1) - K*Math.exp(-r*t)*normalCDF(d2)
    : K*Math.exp(-r*t)*normalCDF(-d2) - S*normalCDF(-d1);
    
  const delta = type==='call' ? normalCDF(d1) : normalCDF(d1)-1;
  const gamma = Math.exp(-d1*d1/2)/(S*sigma*Math.sqrt(2*Math.PI*t));
  const theta = (-(S*sigma*Math.exp(-d1*d1/2))/(2*Math.sqrt(2*Math.PI*t)) - (type === 'call' ? 1 : -1) * r*K*Math.exp(-r*t)*normalCDF(type==='call'?d2:-d2))/365;
  const vega = S*Math.sqrt(t)*Math.exp(-d1*d1/2)/Math.sqrt(2*Math.PI)/100;
  const rho = type==='call' ? K*t*Math.exp(-r*t)*normalCDF(d2)/100 : -K*t*Math.exp(-r*t)*normalCDF(-d2)/100;
  
  return { theoreticalPrice: price, delta, gamma, theta, vega, rho };
}

export default function GreeksCalculator() {
  const [spotValue, setSpotValue] = useState<string>('24800');
  const [strikeValue, setStrikeValue] = useState<string>('24800');
  const [daysValue, setDaysValue] = useState<string>('14');
  const [rateValue, setRateValue] = useState<string>('6.5');
  const [ivValue, setIVValue] = useState<string>('15.5');
  const [activeType, setActiveType] = useState<'Call' | 'Put'>('Call');
  const [activeExplainer, setActiveExplainer] = useState<string | null>(null);

  const S = Number(spotValue) || 0;
  const K = Number(strikeValue) || 0;
  const days = Number(daysValue) || 0;
  const r = Number(rateValue) || 0;
  const iv = Number(ivValue) || 0;

  // Active Greeks calculations
  const greeks = useMemo(() => {
    return blackScholes(S, K, days, r, iv, activeType.toLowerCase() as 'call'|'put');
  }, [S, K, days, r, iv, activeType]);

  // Spot shifts: ±1%, ±2%, ±5% rows
  const spotShifts = useMemo(() => {
    const shifts = [-0.05, -0.02, -0.01, 0, 0.01, 0.02, 0.05];
    return shifts.map((shift) => {
      const shiftedSpot = S * (1 + shift);
      const res = blackScholes(shiftedSpot, K, days, r, iv, activeType.toLowerCase() as 'call'|'put');
      return {
        shiftLabel: shift === 0 ? 'Current' : `${shift > 0 ? '+' : ''}${(shift * 100).toFixed(0)}%`,
        shiftedSpot: Number((shiftedSpot ?? 0).toFixed(1)),
        delta: Number((res.delta ?? 0).toFixed(3)),
        gamma: Number((res.gamma ?? 0).toFixed(5)),
        theta: Number((res.theta ?? 0).toFixed(2)),
        vega: Number((res.vega ?? 0).toFixed(2)),
        rho: Number((res.rho ?? 0).toFixed(2)),
        price: Number((res.theoreticalPrice ?? 0).toFixed(2)),
        bg: shift === 0 ? 'bg-indigo-50/50 dark:bg-indigo-950/20 font-bold border-indigo-200 dark:border-indigo-800' : ''
      };
    });
  }, [S, K, days, r, iv, activeType]);

  // Delta Curve: strike relative from ATM-500 to ATM+500
  const deltaCurveData = useMemo(() => {
    const data = [];
    const baseStrike = Math.round(S / 100) * 100;
    const strikes = [];
    for (let currentStrike = baseStrike - 500; currentStrike <= baseStrike + 500; currentStrike += 50) {
      if (currentStrike > 0) {
        strikes.push(currentStrike);
      }
    }

    return strikes.map((str) => {
      const gCall = blackScholes(S, str, days, r, iv, 'call');
      const gPut = blackScholes(S, str, days, r, iv, 'put');
      return {
        strike: str,
        'Call Delta': Number((gCall.delta ?? 0).toFixed(3)),
        'Put Delta': Number((gPut.delta ?? 0).toFixed(3)),
        'ATM Reference': baseStrike === str ? 0.5 : null
      };
    });
  }, [S, days, r, iv]);

  const explainers = {
    Delta: {
      name: 'Delta (Δ)',
      symbol: 'Δ',
      def: 'Measures the rate of change of the option price relative to a ₹1 change in the underlying stock.',
      desc: 'Calls have Deltas between 0 and 1, while Puts have Deltas between -1 and 0. An ATM (At-The-Money) option typically has a Delta around 0.50. This can also serve as a rough probability of the option expiring in-the-money.',
      unit: '₹ per ₹1 stock move',
      impact: 'If the Nifty spot moves up by ₹10, an option with 0.5 Delta will typically gain or lose roughly ₹5 in premium.',
      color: 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
    },
    Gamma: {
      name: 'Gamma (Γ)',
      symbol: 'Γ',
      def: 'Measures the rate of change in Delta with respect to a ₹1 price move in the underlying asset.',
      desc: 'Gamma represents the acceleration of Delta. Buyers of options enjoy long Gamma (as stock moves in your favor, your Delta gets larger/stronger). Gamma is highest for At-The-Money options and declines as they go deep ITM or OTM.',
      unit: 'Delta shift per ₹1 stock move',
      impact: 'If Gamma is 0.0004 and the stock rises by ₹50, your Option Delta is expected to expand by +0.02, accelerating gains.',
      color: 'border-blue-500 text-blue-600 dark:text-blue-400'
    },
    Theta: {
      name: 'Theta (Θ)',
      symbol: 'Θ',
      def: 'Measures the daily rate of time decay of the option premium.',
      desc: 'Theta is almost always negative for options buyers. Since options represent wasting assets, they lose value as expiration approaches. Decay accelerates exponentially in the final 30 days before expiration.',
      unit: '₹ premium decay per day',
      impact: 'A Theta of -4.50 means the option contract loses ₹4.50 in value every single night just from time passing, assuming other metrics stay static.',
      color: 'border-rose-500 text-rose-600 dark:text-rose-400'
    },
    Vega: {
      name: 'Vega (ν)',
      symbol: 'ν',
      def: 'Measures the sensitivity of option premium to a absolute 1% change in Implied Volatility.',
      desc: 'Both Calls and Puts have positive Vega. When volatility swells (like ahead of corporate earnings or national budget events), premiums expand. When volatility drops (post-event crush), option buy prices drop drastically.',
      unit: 'Change in premium per 1% change in IV',
      impact: 'A Vega of 8.2 will increase the option price by ₹8.20 for a 1.0% expansion in underlying Implied Volatility.',
      color: 'border-purple-500 text-purple-600 dark:text-purple-400'
    },
    Rho: {
      name: 'Rho (ρ)',
      symbol: 'ρ',
      def: 'Measures sensitivity of the options package to a 1% shift in the Risk-Free rate of return.',
      desc: 'CE options have positive Rho while PE options have negative Rho. In India, with standard risk-free rates around 6.5%, Rho is highly structured but usually has less intraday impact than Delta or Volatility swings.',
      unit: 'Premium change per 1% change in rate',
      impact: 'For a Rho of 3.8, if interest rates suddenly go up by 0.50%, the CE premium will rise by ₹1.90 representing cost of carrying.',
      color: 'border-amber-500 text-amber-600 dark:text-amber-400'
    }
  };

  return (
    <div id="greeks-calculator" className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Cpu size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight font-sans leading-none">
              Black-Scholes Options Greeks Engine
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
              REAL-TIME RISK SENSITIVITY SCANNER
            </p>
          </div>
        </div>

        {/* Call PE selector */}
        <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold p-0.5">
          <button
            onClick={() => setActiveType('Call')}
            className={`px-4 py-1.5 rounded-md transition ${activeType === 'Call' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            Call Option (CE)
          </button>
          <button
            onClick={() => setActiveType('Put')}
            className={`px-4 py-1.5 rounded-md transition ${activeType === 'Put' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            Put Option (PE)
          </button>
        </div>
      </div>

      {/* Grid: Params Input Panel */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 font-mono">
            Spot Price (S)
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 font-bold">₹</span>
            <input
              type="number"
              value={spotValue}
              onChange={(e) => setSpotValue(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg pl-6 pr-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 font-mono">
            Strike Price (K)
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 font-bold">₹</span>
            <input
              type="number"
              value={strikeValue}
              onChange={(e) => setStrikeValue(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg pl-6 pr-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 font-mono">
              <Clock size={10} /> Days to Expiry (T)
            </label>
            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">{daysValue} Days</span>
          </div>
          <div className="relative mt-2">
            <input
              type="range"
              min="1"
              max="90"
              value={daysValue}
              onChange={(e) => setDaysValue(e.target.value)}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>

        <div className="space-y-1.5 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 font-mono">
              <Percent size={10} /> Implied Vol (IV)
            </label>
            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">{ivValue}%</span>
          </div>
          <div className="relative mt-2">
            <input
              type="range"
              min="5"
              max="150"
              step="0.1"
              value={ivValue}
              onChange={(e) => setIVValue(e.target.value)}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 font-mono">
            <Percent size={10} /> Risk Free Rate
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.05"
              value={rateValue}
              onChange={(e) => setRateValue(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-400 font-bold">%</span>
          </div>
        </div>
      </div>

      {/* Main Greeks Dashboard Deck */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-6">
        
        {/* Delta Card */}
        <div 
          onMouseEnter={() => setActiveExplainer('Delta')}
          onMouseLeave={() => setActiveExplainer(null)}
          className="relative group p-4 rounded-xl border border-emerald-100 bg-emerald-50/20 dark:border-emerald-950/40 dark:bg-emerald-950/10 cursor-help transition duration-250 hover:shadow-md"
        >
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[10px] font-black tracking-widest font-mono uppercase">Delta (&Delta;)</span>
            <HelpCircle size={13} className="text-emerald-400 group-hover:text-emerald-600 transition" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1.5 font-mono">
            {(greeks.delta ?? 0) >= 0 ? '+' : ''}{(greeks.delta ?? 0).toFixed(3)}
          </div>
          <p className="text-[9px] text-slate-500 mt-1 uppercase font-mono">Rate of Price Change</p>
        </div>

        {/* Gamma Card */}
        <div 
          onMouseEnter={() => setActiveExplainer('Gamma')}
          onMouseLeave={() => setActiveExplainer(null)}
          className="relative group p-4 rounded-xl border border-blue-100 bg-blue-50/20 dark:border-blue-950/40 dark:bg-blue-950/10 cursor-help transition duration-250 hover:shadow-md"
        >
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-[10px] font-black tracking-widest font-mono uppercase">Gamma (&Gamma;)</span>
            <HelpCircle size={13} className="text-blue-400 group-hover:text-blue-600 transition" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1.5 font-mono">
            {(greeks.gamma ?? 0).toFixed(5)}
          </div>
          <p className="text-[9px] text-slate-500 mt-1 uppercase font-mono">Delta Acceleration</p>
        </div>

        {/* Theta Card */}
        <div 
          onMouseEnter={() => setActiveExplainer('Theta')}
          onMouseLeave={() => setActiveExplainer(null)}
          className="relative group p-4 rounded-xl border border-rose-100 bg-rose-50/20 dark:border-rose-950/40 dark:bg-rose-950/10 cursor-help transition duration-250 hover:shadow-md"
        >
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-[10px] font-black tracking-widest font-mono uppercase">Theta (&Theta;)</span>
            <HelpCircle size={13} className="text-rose-400 group-hover:text-rose-600 transition" />
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1.5 font-mono">
            {(greeks.theta ?? 0).toFixed(2)}
          </div>
          <p className="text-[9px] text-slate-500 mt-1 uppercase font-mono">Time Decay / Day</p>
        </div>

        {/* Vega Card */}
        <div 
          onMouseEnter={() => setActiveExplainer('Vega')}
          onMouseLeave={() => setActiveExplainer(null)}
          className="relative group p-4 rounded-xl border border-purple-100 bg-purple-50/20 dark:border-purple-950/40 dark:bg-purple-950/10 cursor-help transition duration-250 hover:shadow-md"
        >
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
            <span className="text-[10px] font-black tracking-widest font-mono uppercase">Vega (&nu;)</span>
            <HelpCircle size={13} className="text-purple-400 group-hover:text-purple-600 transition" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1.5 font-mono">
            {(greeks.vega ?? 0).toFixed(2)}
          </div>
          <p className="text-[9px] text-slate-500 mt-1 uppercase font-mono">IV Volatility Sensitivity</p>
        </div>

        {/* Rho Card */}
        <div 
          onMouseEnter={() => setActiveExplainer('Rho')}
          onMouseLeave={() => setActiveExplainer(null)}
          className="relative group p-4 rounded-xl border border-amber-100 bg-amber-50/20 dark:border-amber-950/40 dark:bg-amber-950/10 cursor-help transition duration-250 hover:shadow-md"
        >
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-[10px] font-black tracking-widest font-mono uppercase">Rho (&rho;)</span>
            <HelpCircle size={13} className="text-amber-400 group-hover:text-amber-600 transition" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1.5 font-mono">
            {(greeks.rho ?? 0).toFixed(2)}
          </div>
          <p className="text-[9px] text-slate-500 mt-1 uppercase font-mono">Interest Rate Sensitivity</p>
        </div>

      </div>

      {/* Dynamic Floating Greeks Explainer panel */}
      {activeExplainer && explainers[activeExplainer as keyof typeof explainers] && (
        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl mb-6 border-l-4 shadow-sm animate-fade-in transition-all duration-300 border-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 font-sans tracking-wide">
              {explainers[activeExplainer as keyof typeof explainers].name} GUIDE
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-semibold leading-relaxed">
            {explainers[activeExplainer as keyof typeof explainers].def}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {explainers[activeExplainer as keyof typeof explainers].desc}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-[10.5px]">
            <div>
              <span className="font-bold text-slate-400 block uppercase font-mono">Measurement Unit</span>
              <span className="text-slate-800 dark:text-slate-200 font-mono font-medium">{explainers[activeExplainer as keyof typeof explainers].unit}</span>
            </div>
            <div>
              <span className="font-bold text-slate-400 block uppercase font-mono">Practical Impact Example</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">{explainers[activeExplainer as keyof typeof explainers].impact}</span>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Spot Shift & Delta Curve Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-6">
        
        {/* Plot Curve: Delta across Strikes */}
        <div className="lg:col-span-6 border border-slate-100 dark:border-slate-800 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 h-80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 font-mono uppercase tracking-wider block">Option Delta Profile</span>
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">Delta Curve across Strikes (ATM &plusmn; 500)</h4>
            </div>
            <span className="text-[9px] bg-slate-150 dark:bg-slate-800 py-0.5 px-2.5 rounded font-mono font-semibold text-slate-500">
              ATM Spot: {Math.round(S)}
            </span>
          </div>

          <div className="flex-1 min-h-0 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={deltaCurveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis 
                  dataKey="strike" 
                  tick={{ fontSize: 9, fill: '#64748b' }} 
                  axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  tickLine={false}
                  type="number"
                  domain={['dataMin', 'dataMax']}
                />
                <YAxis 
                  tick={{ fontSize: 9, fill: '#64748b' }} 
                  axisLine={false}
                  tickLine={false}
                  domain={[-1, 1]}
                  ticks={[-1.0, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1.0]}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [`${value >= 0 ? '+' : ''}${value}`, name]}
                  labelFormatter={(label) => `Strike Strike: ₹${label}`}
                  contentStyle={{ borderRadius: '8px', fontSize: '11px', border: 'none', backgroundColor: '#020617', color: '#ffffff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                <ReferenceLine x={Math.round(S / 100) * 100} stroke="#a855f7" strokeDasharray="3 3" label={{ position: 'top', value: 'ATM', fill: '#a855f7', fontSize: 8, fontWeight: 'bold' }} />
                <Line 
                  type="monotone" 
                  dataKey="Call Delta" 
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="Put Delta" 
                  stroke="#ef4444" 
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 text-[9px] font-bold font-mono mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Call Delta</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Put Delta</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 border-t-2 border-dashed border-purple-500 inline-block"></span> ATM Strike</span>
          </div>
        </div>

        {/* Table: Spot Shifts Analysis (±1%, ±2%, ±5%) */}
        <div className="lg:col-span-6 space-y-3.5">
          <div>
            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 font-mono uppercase tracking-wider block">Stress Testing Dashboard</span>
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">Hypothetical Spot Shift Analytics</h4>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left text-[11px] font-sans border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">
                  <th className="py-2.5 px-3">Spot Shift</th>
                  <th className="py-2.5 px-3">Spot Price</th>
                  <th className="py-2.5 px-3">Premium</th>
                  <th className="py-2.5 px-3">Delta</th>
                  <th className="py-2.5 px-3">Gamma</th>
                  <th className="py-2.5 px-3">Theta</th>
                  <th className="py-2.5 px-3 text-right">Vega</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {spotShifts.map((row, idx) => (
                  <tr key={idx} className={`${row.bg} hover:bg-slate-50 dark:hover:bg-slate-900/30 transition`}>
                    <td className="py-2 px-3">
                      {row.shiftLabel === 'Current' ? (
                        <span className="text-[9px] font-extrabold uppercase font-mono tracking-wide px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                          {row.shiftLabel}
                        </span>
                      ) : (
                        <span className={`font-mono font-bold ${row.shiftLabel.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {row.shiftLabel}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">₹{row.shiftedSpot.toLocaleString()}</td>
                    <td className="py-2 px-3 font-mono font-semibold text-slate-900 dark:text-white">₹{row.price}</td>
                    <td className={`py-2 px-3 font-mono font-medium ${row.delta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{row.delta >= 0 ? '+' : ''}{row.delta}</td>
                    <td className="py-2 px-3 font-mono text-slate-500 dark:text-slate-400">{row.gamma}</td>
                    <td className="py-2 px-3 font-mono text-rose-500">{row.theta}</td>
                    <td className="py-2 px-3 font-mono text-purple-500 text-right">{row.vega}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[9.5px] text-slate-500 leading-relaxed font-sans">
            *This stress tester reflects Black-Scholes modeling of option price changes assuming all other pricing variables (IV%, Interest Rate%, Days to Expiration) remain perfectly static.
          </p>
        </div>

      </div>

    </div>
  );
}
