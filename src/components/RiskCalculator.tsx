import React, { useState, useMemo } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

export default function RiskCalculator() {
  const [accountSize, setAccountSize] = useState<number>(500000);
  const [riskPercent, setRiskPercent] = useState<number>(1);
  const [entryPrice, setEntryPrice] = useState<number>(100);
  const [stopLoss, setStopLoss] = useState<number>(90);
  const [targetPrice, setTargetPrice] = useState<number>(120);
  const [lotSize, setLotSize] = useState<number>(50);

  const presets = [
    { label: 'NIFTY', lots: 50 },
    { label: 'BANKNIFTY', lots: 15 },
    { label: 'FINNIFTY', lots: 40 }
  ];

  const stats = useMemo(() => {
    const accSize = Number(accountSize) || 0;
    const rPct = Number(riskPercent) || 0;
    const entry = Number(entryPrice) || 0;
    const sl = Number(stopLoss) || 0;
    const target = Number(targetPrice) || 0;
    const lotZ = Number(lotSize) || 1;

    const isLong = entry > sl;
    
    // Core Risk logic
    const maxLossAllowed = accSize * (rPct / 100);
    const riskPerShare = isLong ? Math.max(0, entry - sl) : Math.max(0, sl - entry);
    const rewardPerShare = isLong ? Math.max(0, target - entry) : Math.max(0, entry - target);
    
    let recShares = 0;
    let recLots = 0;

    if (riskPerShare > 0) {
      recShares = Math.floor(maxLossAllowed / riskPerShare);
      recLots = Math.floor(recShares / lotZ);
    }
    
    const actualShares = recLots * lotZ;
    const actualRisk = actualShares * riskPerShare;
    const maxProfit = actualShares * rewardPerShare;
    const capitalRequired = actualShares * entry;
    
    let rrRatio = 0;
    if (riskPerShare > 0) rrRatio = rewardPerShare / riskPerShare;

    const returnOnCapital = capitalRequired > 0 ? (maxProfit / capitalRequired) * 100 : 0;
    const allocationPercent = accSize > 0 ? (capitalRequired / accSize) * 100 : 0;

    // Warnings
    let sizeWarningBg = '';
    let sizeWarningText = '';
    if (allocationPercent > 20) {
      sizeWarningBg = 'bg-rose-500/10 border-rose-500/20';
      sizeWarningText = 'text-rose-500';
    }

    let rrStatus = 'neutral'; // 'good', 'poor', 'neutral'
    if (rrRatio < 1.5 && rrRatio > 0) rrStatus = 'poor';
    else if (rrRatio >= 2) rrStatus = 'good';

    return {
      maxLossAllowed,
      riskPerShare,
      recLots,
      actualShares,
      actualRisk,
      maxProfit,
      capitalRequired,
      rrRatio,
      returnOnCapital,
      allocationPercent,
      sizeWarningBg,
      sizeWarningText,
      rrStatus
    };
  }, [accountSize, riskPercent, entryPrice, stopLoss, targetPrice, lotSize]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto" id="risk_calculator_view">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-850 pb-4">
        <div>
          <h1 className="text-xl font-sans font-black flex items-center gap-2 text-slate-900 dark:text-white">
            <ShieldCheck size={20} className="text-emerald-555 dark:text-emerald-400" />
            Position Sizing / Risk Calculator
          </h1>
          <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
            Determine optimal position sizing and evaluate Trade Risk/Reward profiles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col - Inputs */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-5 shadow-sm space-y-6">
          <h3 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 font-mono tracking-wider flex items-center gap-2">
            Trade Setup
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">
                Account Size (₹)
              </label>
              <input 
                type="number"
                value={accountSize}
                onChange={(e) => setAccountSize(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5 flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                  Risk Per Trade %
                </label>
                <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">{riskPercent}%</span>
              </div>
              <div className="relative mt-2">
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">
                  Entry Price (₹)
                </label>
                <input 
                  type="number"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">
                  Stop Loss (₹)
                </label>
                <input 
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-lg px-3 py-2 text-sm font-bold text-rose-600 dark:text-rose-400 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">
                Target Price (₹)
              </label>
              <input 
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 rounded-lg px-3 py-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-850">
               <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">
                 Lot Size Presets
               </label>
               <div className="flex gap-2 mb-3">
                 {presets.map(p => (
                   <button 
                     key={p.label}
                     onClick={() => setLotSize(p.lots)}
                     className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-colors border ${lotSize === p.lots ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-400' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                   >
                     {p.label} ({p.lots})
                   </button>
                 ))}
               </div>
               <div className="flex items-center gap-3">
                 <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Custom Lot:
                 </span>
                 <input 
                    type="number"
                    value={lotSize}
                    onChange={(e) => setLotSize(Number(e.target.value))}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
               </div>
            </div>

          </div>
        </div>

        {/* Right Col - Outputs */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg text-white h-full relative overflow-hidden">
             
            {/* Background pattern */}
            <div className="absolute -right-6 -top-6 text-slate-800/30 pointer-events-none">
               <ShieldCheck size={180} />
            </div>

            <h3 className="text-xs font-bold uppercase text-slate-400 mb-6 tracking-wider font-mono">
               Risk Analysis Results
            </h3>

            <div className="flex flex-col gap-5 relative z-10">
               {/* Primary Readouts */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Max Loss Allowed</span>
                    <div className="text-rose-400 text-2xl font-black font-mono tracking-tight mt-1">₹{stats.maxLossAllowed.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">{riskPercent}% of account balance</div>
                  </div>

                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Recommended Lots</span>
                    </div>
                    <div className="text-white text-2xl font-black font-mono tracking-tight mt-1">{stats.recLots}</div>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">Risking ₹{stats.riskPerShare.toFixed(2)} / share</div>
                  </div>
               </div>

               {/* Warnings Section */}
               {stats.sizeWarningText && (
                  <div className={`p-3 rounded-lg border flex items-center gap-3 ${stats.sizeWarningBg}`}>
                     <AlertCircle size={20} className={stats.sizeWarningText} />
                     <div>
                       <div className={`font-bold text-sm ${stats.sizeWarningText}`}>Position too large!</div>
                       <div className="text-[11px] text-slate-400 mt-0.5">This trade requires {stats.allocationPercent.toFixed(1)}% of your capital. Target is &lt; 20%.</div>
                     </div>
                  </div>
               )}

               {stats.rrRatio > 0 && (
                  <div className={`p-3 rounded-lg border flex items-center gap-3 ${
                    stats.rrStatus === 'good' ? 'bg-emerald-500/10 border-emerald-500/20' : 
                    stats.rrStatus === 'poor' ? 'bg-amber-500/10 border-amber-500/20' : 
                    'bg-slate-800/50 border-slate-700/50'
                  }`}>
                     {stats.rrStatus === 'good' ? <CheckCircle size={20} className="text-emerald-400" /> : 
                      stats.rrStatus === 'poor' ? <AlertCircle size={20} className="text-amber-400" /> : 
                      <TrendingUp size={20} className="text-sky-400" />}
                     <div>
                       <div className={`font-bold text-sm ${
                         stats.rrStatus === 'good' ? 'text-emerald-400' : 
                         stats.rrStatus === 'poor' ? 'text-amber-400' : 'text-slate-200'
                       }`}>
                         {stats.rrStatus === 'good' ? 'Good setup ✓' : 
                          stats.rrStatus === 'poor' ? 'Poor risk/reward' : 'Average setup'}
                       </div>
                       <div className="text-[11px] text-slate-400 mt-0.5">Risk/Reward Ratio is 1 : {stats.rrRatio.toFixed(2)}</div>
                     </div>
                  </div>
               )}

               {/* Secondary Readouts */}
               <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                    <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Max Profit</span>
                    <span className="text-sm font-bold font-mono text-emerald-400">₹{(stats.maxProfit).toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                    <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Total Capital Req</span>
                    <span className="text-sm font-bold font-mono text-slate-200">₹{(stats.capitalRequired).toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                    <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Return on Capital</span>
                    <span className="text-sm font-bold font-mono text-sky-400">{stats.returnOnCapital.toFixed(1)}%</span>
                  </div>
               </div>

               {/* Capital Allocation Bar */}
               <div className="mt-2">
                  <div className="flex justify-between text-[10px] font-mono font-bold mb-1.5">
                     <span className="text-slate-400">Capital Utilized ({stats.allocationPercent.toFixed(1)}%)</span>
                     <span className="text-slate-500">Total: ₹{accountSize.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                     <div 
                       className={`h-full transition-all duration-500 ${stats.allocationPercent > 20 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                       style={{ width: `${Math.min(100, stats.allocationPercent)}%` }}
                     />
                  </div>
               </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
