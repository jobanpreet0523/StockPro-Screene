import React, { useMemo, useState } from 'react';
import { Calculator, Cpu, Percent, Clock, HelpCircle } from 'lucide-react';

function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const scaled = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * scaled);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-(scaled * scaled));
  return 0.5 * (1 + sign * y);
}

function blackScholes(S: number, K: number, days: number, rPercent: number, ivPercent: number, type: 'call' | 'put') {
  const safeS = Math.max(S, 1);
  const safeK = Math.max(K, 1);
  const t = Math.max(days, 1) / 365;
  const sigma = Math.max(ivPercent, 0.1) / 100;
  const r = rPercent / 100;
  const d1 = (Math.log(safeS / safeK) + (r + sigma * sigma / 2) * t) / (sigma * Math.sqrt(t));
  const d2 = d1 - sigma * Math.sqrt(t);
  const theoreticalPrice = type === 'call'
    ? safeS * normalCDF(d1) - safeK * Math.exp(-r * t) * normalCDF(d2)
    : safeK * Math.exp(-r * t) * normalCDF(-d2) - safeS * normalCDF(-d1);
  const delta = type === 'call' ? normalCDF(d1) : normalCDF(d1) - 1;
  const gamma = Math.exp(-d1 * d1 / 2) / (safeS * sigma * Math.sqrt(2 * Math.PI * t));
  const theta = (-(safeS * sigma * Math.exp(-d1 * d1 / 2)) / (2 * Math.sqrt(2 * Math.PI * t)) - (type === 'call' ? 1 : -1) * r * safeK * Math.exp(-r * t) * normalCDF(type === 'call' ? d2 : -d2)) / 365;
  const vega = safeS * Math.sqrt(t) * Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI) / 100;
  const rho = type === 'call' ? safeK * t * Math.exp(-r * t) * normalCDF(d2) / 100 : -safeK * t * Math.exp(-r * t) * normalCDF(-d2) / 100;
  return { theoreticalPrice, delta, gamma, theta, vega, rho };
}

export default function GreeksCalculator() {
  const [spotValue, setSpotValue] = useState('24800');
  const [strikeValue, setStrikeValue] = useState('24800');
  const [daysValue, setDaysValue] = useState('14');
  const [rateValue, setRateValue] = useState('6.5');
  const [ivValue, setIVValue] = useState('15.5');
  const [activeType, setActiveType] = useState<'Call' | 'Put'>('Call');
  const [activeExplainer, setActiveExplainer] = useState<string | null>(null);

  const S = Number(spotValue) || 0;
  const K = Number(strikeValue) || 0;
  const days = Number(daysValue) || 0;
  const r = Number(rateValue) || 0;
  const iv = Number(ivValue) || 0;

  const greeks = useMemo(() => blackScholes(S, K, days, r, iv, activeType.toLowerCase() as 'call' | 'put'), [S, K, days, r, iv, activeType]);

  const deltaCurveData = useMemo(() => {
    const baseStrike = Math.round(Math.max(S, 1) / 100) * 100;
    return Array.from({ length: 21 }, (_, index) => {
      const strike = baseStrike - 500 + index * 50;
      const call = blackScholes(S, strike, days, r, iv, 'call').delta;
      const put = blackScholes(S, strike, days, r, iv, 'put').delta;
      return { strike, call, put };
    }).filter((item) => item.strike > 0);
  }, [S, days, r, iv]);

  const spotShifts = useMemo(() => {
    return [-0.05, -0.02, -0.01, 0, 0.01, 0.02, 0.05].map((shift) => {
      const shiftedSpot = S * (1 + shift);
      const result = blackScholes(shiftedSpot, K, days, r, iv, activeType.toLowerCase() as 'call' | 'put');
      return {
        shiftLabel: shift === 0 ? 'Current' : `${shift > 0 ? '+' : ''}${(shift * 100).toFixed(0)}%`,
        shiftedSpot,
        price: result.theoreticalPrice,
        delta: result.delta,
        theta: result.theta,
      };
    });
  }, [S, K, days, r, iv, activeType]);

  const explainers: Record<string, string> = {
    Delta: 'Delta measures option price sensitivity to movement in the underlying.',
    Gamma: 'Gamma measures how quickly Delta changes as the underlying moves.',
    Theta: 'Theta estimates daily time decay in the option premium.',
    Vega: 'Vega estimates option premium sensitivity to volatility changes.',
    Rho: 'Rho estimates option sensitivity to interest-rate changes.',
  };

  return (
    <div id="greeks-calculator" className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400"><Cpu size={18} /></div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight font-sans leading-none">Options Greeks Engine</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">STABLE EDUCATIONAL CALCULATOR</p>
          </div>
        </div>
        <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold p-0.5">
          <button onClick={() => setActiveType('Call')} className={`px-4 py-1.5 rounded-md transition ${activeType === 'Call' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>Call Option</button>
          <button onClick={() => setActiveType('Put')} className={`px-4 py-1.5 rounded-md transition ${activeType === 'Put' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>Put Option</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <InputBox label="Spot Price" value={spotValue} onChange={setSpotValue} prefix="₹" />
        <InputBox label="Strike Price" value={strikeValue} onChange={setStrikeValue} prefix="₹" />
        <RangeBox icon={Clock} label="Days" value={daysValue} onChange={setDaysValue} min="1" max="90" suffix="Days" />
        <RangeBox icon={Percent} label="IV" value={ivValue} onChange={setIVValue} min="5" max="150" step="0.1" suffix="%" />
        <InputBox label="Risk Free Rate" value={rateValue} onChange={setRateValue} suffix="%" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-6">
        <GreekCard label="Delta" value={greeks.delta} decimals={3} onEnter={setActiveExplainer} onLeave={() => setActiveExplainer(null)} />
        <GreekCard label="Gamma" value={greeks.gamma} decimals={5} onEnter={setActiveExplainer} onLeave={() => setActiveExplainer(null)} />
        <GreekCard label="Theta" value={greeks.theta} decimals={2} onEnter={setActiveExplainer} onLeave={() => setActiveExplainer(null)} />
        <GreekCard label="Vega" value={greeks.vega} decimals={2} onEnter={setActiveExplainer} onLeave={() => setActiveExplainer(null)} />
        <GreekCard label="Rho" value={greeks.rho} decimals={2} onEnter={setActiveExplainer} onLeave={() => setActiveExplainer(null)} />
      </div>

      {activeExplainer && (
        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl mb-6 border-l-4 shadow-sm border-indigo-500">
          <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 font-sans tracking-wide">{activeExplainer} GUIDE</span>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-semibold leading-relaxed">{explainers[activeExplainer]}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-6">
        <div className="lg:col-span-6 border border-slate-100 dark:border-slate-800 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 font-mono uppercase tracking-wider block">Delta Profile</span>
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">Stable SVG Curve</h4>
            </div>
            <span className="text-[9px] bg-slate-150 dark:bg-slate-800 py-0.5 px-2.5 rounded font-mono font-semibold text-slate-500">ATM: {Math.round(S)}</span>
          </div>
          <DeltaSvg data={deltaCurveData} />
        </div>

        <div className="lg:col-span-6 space-y-3.5">
          <div>
            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 font-mono uppercase tracking-wider block">Stress Testing Dashboard</span>
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">Hypothetical Spot Shift Analytics</h4>
          </div>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left text-[11px] font-sans border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">
                  <th className="py-2.5 px-3">Spot Shift</th><th className="py-2.5 px-3">Spot</th><th className="py-2.5 px-3">Price</th><th className="py-2.5 px-3">Delta</th><th className="py-2.5 px-3">Theta</th>
                </tr>
              </thead>
              <tbody>
                {spotShifts.map((row) => (
                  <tr key={row.shiftLabel} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <td className="py-2.5 px-3 font-bold">{row.shiftLabel}</td>
                    <td className="py-2.5 px-3 font-mono">{row.shiftedSpot.toFixed(1)}</td>
                    <td className="py-2.5 px-3 font-mono">{row.price.toFixed(2)}</td>
                    <td className="py-2.5 px-3 font-mono">{row.delta.toFixed(3)}</td>
                    <td className="py-2.5 px-3 font-mono">{row.theta.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputBox({ label, value, onChange, prefix, suffix }: { label: string; value: string; onChange: (value: string) => void; prefix?: string; suffix?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 font-mono"><Calculator size={10} /> {label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 font-bold">{prefix}</span>}
        <input type="number" value={value} onChange={(e) => onChange(e.target.value)} className={`w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg ${prefix ? 'pl-6' : 'pl-2.5'} pr-8 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none`} />
        {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-400 font-bold">{suffix}</span>}
      </div>
    </div>
  );
}

function RangeBox({ icon: Icon, label, value, onChange, min, max, step = '1', suffix }: { icon: typeof Clock; label: string; value: string; onChange: (value: string) => void; min: string; max: string; step?: string; suffix: string }) {
  return (
    <div className="space-y-1.5 flex flex-col justify-center">
      <div className="flex items-center justify-between"><label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 font-mono"><Icon size={10} /> {label}</label><span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">{value}{suffix}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(e.target.value)} className="w-full accent-emerald-500" />
    </div>
  );
}

function GreekCard({ label, value, decimals, onEnter, onLeave }: { label: string; value: number; decimals: number; onEnter: (label: string) => void; onLeave: () => void }) {
  return (
    <div onMouseEnter={() => onEnter(label)} onMouseLeave={onLeave} className="relative group p-4 rounded-xl border border-slate-100 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-950/20 cursor-help transition duration-250 hover:shadow-md">
      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300"><span className="text-[10px] font-black tracking-widest font-mono uppercase">{label}</span><HelpCircle size={13} /></div>
      <div className="text-xl font-black text-slate-900 dark:text-white mt-1.5 font-mono">{value >= 0 ? '+' : ''}{value.toFixed(decimals)}</div>
    </div>
  );
}

function DeltaSvg({ data }: { data: Array<{ strike: number; call: number; put: number }> }) {
  const width = 560;
  const height = 220;
  const pad = 22;
  const x = (index: number) => pad + (index / Math.max(data.length - 1, 1)) * (width - pad * 2);
  const y = (value: number) => pad + ((1 - value) / 2) * (height - pad * 2);
  const points = (key: 'call' | 'put') => data.map((item, index) => `${x(index)},${y(item[key])}`).join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[420px] w-full h-[220px] rounded-lg bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
        <line x1={pad} x2={width - pad} y1={height / 2} y2={height / 2} stroke="currentColor" strokeDasharray="4 4" className="text-slate-300 dark:text-slate-700" />
        <polyline fill="none" stroke="currentColor" strokeWidth="3" points={points('call')} className="text-emerald-500" />
        <polyline fill="none" stroke="currentColor" strokeWidth="3" points={points('put')} className="text-rose-500" />
        <text x={pad} y={18} className="fill-slate-500 text-[10px]">+1</text>
        <text x={pad} y={height - 8} className="fill-slate-500 text-[10px]">-1</text>
      </svg>
    </div>
  );
}
