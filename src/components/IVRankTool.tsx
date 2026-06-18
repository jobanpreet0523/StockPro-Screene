import React, { useState, useMemo } from 'react';
import { Activity, Info } from 'lucide-react';

export default function IVRankTool() {
  const [currentIVValue, setCurrentIVValue] = useState<string>('14.5');
  const [highIVValue, setHighIVValue] = useState<string>('25.0');
  const [lowIVValue, setLowIVValue] = useState<string>('10.0');

  const currentIV = Number(currentIVValue) || 0;
  const highIV = Number(highIVValue) || 0;
  const lowIV = Number(lowIVValue) || 0;

  const ivRank = useMemo(() => {
    if (highIV === lowIV) return 0;
    const rank = ((currentIV - lowIV) / (highIV - lowIV)) * 100;
    return Math.max(0, Math.min(100, rank)); // Clamp between 0 and 100
  }, [currentIV, highIV, lowIV]);

  const interpretation = useMemo(() => {
    if (ivRank <= 25) {
      return { text: 'IV Cheap - Good time to Buy Options', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-400/10', border: 'border-emerald-200 dark:border-emerald-500/20' };
    } else if (ivRank < 75) {
      return { text: 'IV Normal', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-400/10', border: 'border-amber-200 dark:border-amber-500/20' };
    } else {
      return { text: 'IV Expensive - Good time to Sell Options', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-400/10', border: 'border-rose-200 dark:border-rose-500/20' };
    }
  }, [ivRank]);

  const presets = [
    { label: 'NIFTY', curr: '14.2', high: '24.5', low: '10.5' },
    { label: 'BANKNIFTY', curr: '18.5', high: '32.0', low: '12.0' },
    { label: 'RELIANCE', curr: '21.0', high: '45.0', low: '16.0' },
    { label: 'HDFCBANK', curr: '15.5', high: '35.0', low: '12.5' },
  ];

  const handlePreset = (preset: typeof presets[0]) => {
    setCurrentIVValue(preset.curr);
    setHighIVValue(preset.high);
    setLowIVValue(preset.low);
  };

  const Gauge = ({ value, colorClass }: { value: number, colorClass: string }) => {
    const radius = 80;
    const strokeWidth = 16;
    const circumference = Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;
    
    // Convert color class to an actual hex roughly matching Tailwind
    let strokeColor = '#f59e0b'; // amber
    if (value <= 25) strokeColor = '#10b981'; // emerald
    if (value >= 75) strokeColor = '#e11d48'; // rose

    return (
      <div className="relative flex justify-center items-end" style={{ height: '120px' }}>
        <svg width="200" height="110" viewBox="0 0 200 110" className="mx-auto block">
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="dark:stroke-slate-800"
          />
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute bottom-0 text-center flex flex-col items-center">
          <span className={`text-3xl font-black font-mono ${colorClass}`}>{(value ?? 0).toFixed(1)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity size={18} className="text-blue-500" />
          IV Rank Indicator
        </h3>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="font-semibold text-slate-500 uppercase flex items-center mr-2 text-[10px]">Presets:</span>
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => handlePreset(p)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold transition"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-center">
        <div className="space-y-4 lg:col-span-1">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Current IV (%)</label>
            <input type="number" step="0.1" value={currentIVValue} onChange={(e) => setCurrentIVValue(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm text-slate-900 dark:text-white font-bold" />
          </div>
          <div className="space-y-1.5 flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">52W Low (%)</label>
              <input type="number" step="0.1" value={lowIVValue} onChange={(e) => setLowIVValue(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm text-slate-900 dark:text-white font-bold text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">52W High (%)</label>
              <input type="number" step="0.1" value={highIVValue} onChange={(e) => setHighIVValue(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm text-slate-900 dark:text-white font-bold text-rose-600 dark:text-rose-400" />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center lg:col-span-1">
          <Gauge value={ivRank} colorClass={interpretation.color} />
          <span className="text-[10px] uppercase font-bold text-slate-400 mt-2 tracking-wider">IV Rank Score</span>
        </div>

        <div className={`p-4 rounded-xl border ${interpretation.border} ${interpretation.bg} flex flex-col justify-center h-full min-h-[140px] items-center text-center lg:col-span-1`}>
            <Info size={24} className={`mb-2 ${interpretation.color}`} />
            <h4 className={`text-base font-bold ${interpretation.color}`}>{interpretation.text}</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-2 max-w-xs leading-relaxed">
              IV Rank measures current Implied Volatility against its yearly range. Helps determine strategy selection.
            </p>
        </div>
      </div>
    </div>
  );
}
