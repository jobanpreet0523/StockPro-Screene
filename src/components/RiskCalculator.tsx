import React, { useState, useMemo } from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

export default function RiskCalculator() {
  const [accountSizeVal, setAccountSizeVal] = useState<string>('500000');
  const [riskPercentVal, setRiskPercentVal] = useState<string>('1.0');
  const [entryVal, setEntryVal] = useState<string>('150');
  const [slVal, setSlVal] = useState<string>('130');
  const [targetVal, setTargetVal] = useState<string>('210');
  const [lotSizeVal, setLotSizeVal] = useState<string>('50');

  const accountSize = Number(accountSizeVal) || 0;
  const riskPercent = Number(riskPercentVal) || 0;
  const entry = Number(entryVal) || 0;
  const sl = Number(slVal) || 0;
  const target = Number(targetVal) || 0;
  const lotSize = Number(lotSizeVal) || 0;

  const results = useMemo(() => {
    const maxRiskAmt = accountSize * (riskPercent / 100);
    const riskPerUnit = Math.abs(entry - sl);
    const riskPerLot = riskPerUnit * lotSize;
    const lotsToTrade = riskPerLot > 0 ? Math.floor(maxRiskAmt / riskPerLot) : 0;
    const totalUnits = lotsToTrade * lotSize;
    const capitalRequired = totalUnits * entry;
    const rewardPerUnit = Math.abs(target - entry);
    const rrRatio = riskPerUnit > 0 ? (rewardPerUnit / riskPerUnit) : 0;
    const positionSizePercent = accountSize > 0 ? (capitalRequired / accountSize) * 100 : 0;

    return {
      maxRiskAmt,
      lotsToTrade,
      capitalRequired,
      rrRatio,
      positionSizePercent,
      isOverSize: positionSizePercent > 5,
    };
  }, [accountSize, riskPercent, entry, sl, target, lotSize]);

  return (
    <div className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mt-6">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
        <ShieldAlert size={18} className="text-indigo-500" />
        Position Sizing & Risk Calculator
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="space-y-1.5 lg:col-span-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Account Size (₹)</label>
          <input type="number" value={accountSizeVal} onChange={(e) => setAccountSizeVal(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-sm font-bold text-slate-900 dark:text-white" />
        </div>
        <div className="space-y-1.5 lg:col-span-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Risk Per Trade (%)</label>
          <input type="number" step="0.1" value={riskPercentVal} onChange={(e) => setRiskPercentVal(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-sm font-bold text-slate-900 dark:text-white" />
        </div>
        <div className="space-y-1.5 lg:col-span-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Entry Price</label>
          <input type="number" value={entryVal} onChange={(e) => setEntryVal(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-sm font-bold text-blue-600 dark:text-blue-400" />
        </div>
        <div className="space-y-1.5 lg:col-span-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Stop Loss</label>
          <input type="number" value={slVal} onChange={(e) => setSlVal(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-sm font-bold text-rose-600 dark:text-rose-400" />
        </div>
        <div className="space-y-1.5 lg:col-span-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Target Price</label>
          <input type="number" value={targetVal} onChange={(e) => setTargetVal(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="space-y-1.5 lg:col-span-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Lot Size</label>
          <input type="number" value={lotSizeVal} onChange={(e) => setLotSizeVal(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-sm font-bold text-slate-900 dark:text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-850">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Allowed Risk Amount</span>
          <span className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-1 block">₹{results.maxRiskAmt.toLocaleString()}</span>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-850 shadow-inner border-l-4 border-l-indigo-500">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Lots to Trade</span>
          <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 block">{results.lotsToTrade} <span className="text-xs font-semibold text-slate-500 ml-1">LOTS</span></span>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-850">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Capital Required</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">₹{results.capitalRequired.toLocaleString()}</span>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-850">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Risk / Reward</span>
          <span className={`text-sm font-bold mt-1 block ${results.rrRatio >= 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
            1 : {results.rrRatio.toFixed(2)}
          </span>
        </div>
      </div>

      {results.isOverSize && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg flex items-center gap-3">
          <AlertTriangle className="text-amber-500 min-w-[20px]" size={20} />
          <div>
            <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400">Position Size Warning</h4>
            <p className="text-[11px] text-amber-600 dark:text-amber-500 mt-0.5 font-medium">
              This position requires {results.positionSizePercent.toFixed(1)}% of your account size. Trading with a position size greater than 5% per trade increases blowout risk.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
