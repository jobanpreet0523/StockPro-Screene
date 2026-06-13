import React, { useMemo, useState } from 'react';
import { useOptionChain, NSEOptionChainResponse } from '../../hooks/useOptionChain';
import { useOptionChainStore } from '../../store/optionChainStore';
import ExpirySelector from './ExpirySelector';
import PCRBadge from './PCRBadge';
import { fmtINR, fmtPct, fmtLakhCrore } from '../../utils/formatters';
import { calcMaxPain, calcATMStrike, getStrikeStep, isITMCall, isITMPut, isATM } from '../../utils/calculations';
import { SkeletonTable } from '../SkeletonLoader';
import PriceFlash from '../PriceFlash';

interface ParsedRow {
  strikePrice: number;
  expiryDate: string;
  callLtp: number; callChange: number; callVol: number; callOi: number; callOiChg: number; callIv: number;
  callBidQty: number; callBidPrice: number; callAskQty: number; callAskPrice: number;
  putLtp: number; putChange: number; putVol: number; putOi: number; putOiChg: number; putIv: number;
  putBidQty: number; putBidPrice: number; putAskQty: number; putAskPrice: number;
}

function parseChainData(data: NSEOptionChainResponse, expiry: string): ParsedRow[] {
  const records = data?.data?.records;
  if (!records?.data) return [];

  const filtered = expiry ? records.data.filter(d => d.expiryDate === expiry) : records.data;

  return filtered.map(d => {
    const ce = d.CE || {};
    const pe = d.PE || {};
    return {
      strikePrice: d.strikePrice,
      expiryDate: d.expiryDate,
      callLtp: ce.lastPrice || 0, callChange: ce.change || 0, callVol: ce.totalTradedVolume || 0,
      callOi: ce.openInterest || 0, callOiChg: ce.changeinOpenInterest || 0, callIv: ce.impliedVolatility || 0,
      callBidQty: ce.bidQty || 0, callBidPrice: ce.bidprice || 0, callAskQty: ce.askQty || 0, callAskPrice: ce.askPrice || 0,
      putLtp: pe.lastPrice || 0, putChange: pe.change || 0, putVol: pe.totalTradedVolume || 0,
      putOi: pe.openInterest || 0, putOiChg: pe.changeinOpenInterest || 0, putIv: pe.impliedVolatility || 0,
      putBidQty: pe.bidQty || 0, putBidPrice: pe.bidprice || 0, putAskQty: pe.askQty || 0, putAskPrice: pe.askPrice || 0,
    };
  });
}

function OIBar({ oi, maxOi }: { oi: number; maxOi: number }) {
  if (!maxOi || !oi) return <div className="w-16 h-1.5 bg-slate-800 rounded-full" />;
  const pct = Math.min(100, (oi / maxOi) * 100);
  return (
    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div className="h-full bg-emerald-500/60 rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function OptionChainTable() {
  const { data, isLoading, error, data: rawData } = useOptionChain();
  const { selectedIndex, selectedExpiry, setSelectedExpiry } = useOptionChainStore();
  const [strikeRange, setStrikeRange] = useState(10); // +/- strikes from ATM

  const records = data?.data?.records;
  const spot = records?.underlyingValue || 0;
  const step = getStrikeStep(selectedIndex);
  const atmStrike = calcATMStrike(spot, step);
  const expiryDates = records?.expiryDates || [];

  const activeExpiry = selectedExpiry || expiryDates[0] || '';
  const rows = useMemo(() => parseChainData(data!, activeExpiry), [data, activeExpiry]);

  const { maxPainStrike } = useMemo(() => calcMaxPain(rows), [rows]);
  const totalCallOI = rows.reduce((s, r) => s + r.callOi, 0);
  const totalPutOI = rows.reduce((s, r) => s + r.putOi, 0);
  const maxOi = Math.max(...rows.map(r => Math.max(r.callOi, r.putOi)), 1);

  // Slice around ATM
  const atmIdx = rows.findIndex(r => r.strikePrice === atmStrike);
  const start = Math.max(0, atmIdx - strikeRange);
  const end = Math.min(rows.length, atmIdx + strikeRange + 1);
  const visibleRows = atmIdx >= 0 ? rows.slice(start, end) : rows;

  const changeColor = (v: number) => v > 0 ? 'text-emerald-400' : v < 0 ? 'text-red-400' : 'text-slate-400';

  if (isLoading) return <SkeletonTable rows={21} cols={13} />;
  if (error) return <div className="text-red-400 p-4">Failed to load option chain: {error.message}</div>;

  return (
    <div className="flex flex-col gap-3">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ExpirySelector />
        <div className="flex items-center gap-3">
          {/* Expiry dropdown */}
          {expiryDates.length > 0 && (
            <select
              value={activeExpiry}
              onChange={e => setSelectedExpiry(e.target.value)}
              className="bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 focus:border-emerald-500"
            >
              {expiryDates.map(exp => (
                <option key={exp} value={exp}>{exp}</option>
              ))}
            </select>
          )}
          <PCRBadge totalPutOI={totalPutOI} totalCallOI={totalCallOI} />
          <div className="text-xs text-slate-400">
            Max Pain: <span className="text-amber-400 font-bold">₹{fmtINR(maxPainStrike)}</span>
          </div>
          <div className="text-xs text-slate-400">
            Spot: <span className="text-white font-bold">₹{fmtINR(spot)}</span>
          </div>
        </div>
      </div>

      {/* Range slider */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span>Range:</span>
        <input type="range" min={5} max={25} value={strikeRange} onChange={e => setStrikeRange(+e.target.value)}
          className="w-32 accent-emerald-500" />
        <span>±{strikeRange} strikes</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-[11px] font-mono">
          <thead>
            <tr className="bg-slate-900 text-slate-400 sticky top-0">
              {/* CALLS */}
              <th colSpan={8} className="text-center text-emerald-400 py-1.5 border-b border-slate-700 text-xs font-bold">CALLS</th>
              {/* STRIKE */}
              <th className="px-2 py-1.5 border-b border-slate-700 bg-slate-950 text-amber-400 text-xs font-bold">STRIKE</th>
              {/* PUTS */}
              <th colSpan={8} className="text-center text-red-400 py-1.5 border-b border-slate-700 text-xs font-bold">PUTS</th>
            </tr>
            <tr className="bg-slate-900/80 text-slate-500 text-[10px]">
              <th className="px-1.5 py-1">OI</th>
              <th className="px-1.5 py-1">Chg OI</th>
              <th className="px-1.5 py-1">Vol</th>
              <th className="px-1.5 py-1">IV</th>
              <th className="px-1.5 py-1">LTP</th>
              <th className="px-1.5 py-1">Chg</th>
              <th className="px-1.5 py-1">Bid</th>
              <th className="px-1.5 py-1">Ask</th>
              <th className="px-2 py-1 bg-slate-950 text-amber-400 font-bold"></th>
              <th className="px-1.5 py-1">Bid</th>
              <th className="px-1.5 py-1">Ask</th>
              <th className="px-1.5 py-1">LTP</th>
              <th className="px-1.5 py-1">Chg</th>
              <th className="px-1.5 py-1">IV</th>
              <th className="px-1.5 py-1">Vol</th>
              <th className="px-1.5 py-1">Chg OI</th>
              <th className="px-1.5 py-1">OI</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const isAtm = isATM(row.strikePrice, spot, step);
              const isItmCall = isITMCall(row.strikePrice, spot);
              const isItmPut = isITMPut(row.strikePrice, spot);
              const callBg = isItmCall ? 'bg-blue-500/5' : '';
              const putBg = isItmPut ? 'bg-amber-500/5' : '';
              const atmGlow = isAtm ? 'bg-amber-500/10 ring-1 ring-amber-500/30' : '';

              return (
                <tr key={row.strikePrice} className={`${isAtm ? 'bg-amber-500/5' : 'hover:bg-slate-800/50'} transition-colors`}>
                  {/* CALLS */}
                  <td className={`px-1.5 py-1 text-right ${callBg}`}>
                    <div className="flex flex-col items-end">
                      <span className="text-slate-300">{fmtLakhCrore(row.callOi)}</span>
                      <OIBar oi={row.callOi} maxOi={maxOi} />
                    </div>
                  </td>
                  <td className={`px-1.5 py-1 text-right ${callBg} ${changeColor(row.callOiChg)}`}>{fmtLakhCrore(row.callOiChg)}</td>
                  <td className={`px-1.5 py-1 text-right ${callBg} text-slate-300`}>{fmtLakhCrore(row.callVol)}</td>
                  <td className={`px-1.5 py-1 text-right ${callBg} text-slate-500`}>{row.callIv.toFixed(1)}%</td>
                  <td className={`px-1.5 py-1 text-right ${callBg} text-white font-semibold`}>
                    <PriceFlash value={row.callLtp} formatter={fmtINR} />
                  </td>
                  <td className={`px-1.5 py-1 text-right ${callBg} ${changeColor(row.callChange)}`}>{row.callChange.toFixed(2)}</td>
                  <td className={`px-1.5 py-1 text-right ${callBg} text-slate-400`}>{row.callBidQty || '—'}</td>
                  <td className={`px-1.5 py-1 text-right ${callBg} text-slate-400`}>{row.callBidPrice ? row.callBidPrice.toFixed(2) : '—'}</td>

                  {/* STRIKE */}
                  <td className={`px-3 py-1.5 text-center font-bold ${atmGlow} ${isAtm ? 'text-amber-400 text-sm' : 'text-white'}`}>
                    {fmtINRWhole(row.strikePrice)}
                    {isAtm && <span className="ml-1 text-[8px] text-amber-400 font-bold">ATM</span>}
                  </td>

                  {/* PUTS */}
                  <td className={`px-1.5 py-1 text-left ${putBg} text-slate-400`}>{row.putBidPrice ? row.putBidPrice.toFixed(2) : '—'}</td>
                  <td className={`px-1.5 py-1 text-left ${putBg} text-slate-400`}>{row.putBidQty || '—'}</td>
                  <td className={`px-1.5 py-1 text-left ${putBg} text-white font-semibold`}>
                    <PriceFlash value={row.putLtp} formatter={fmtINR} />
                  </td>
                  <td className={`px-1.5 py-1 text-left ${putBg} ${changeColor(row.putChange)}`}>{row.putChange.toFixed(2)}</td>
                  <td className={`px-1.5 py-1 text-left ${putBg} text-slate-500`}>{row.putIv.toFixed(1)}%</td>
                  <td className={`px-1.5 py-1 text-left ${putBg} text-slate-300`}>{fmtLakhCrore(row.putVol)}</td>
                  <td className={`px-1.5 py-1 text-left ${putBg} ${changeColor(row.putOiChg)}`}>{fmtLakhCrore(row.putOiChg)}</td>
                  <td className={`px-1.5 py-1 text-left ${putBg}`}>
                    <div className="flex flex-col">
                      <span className="text-slate-300">{fmtLakhCrore(row.putOi)}</span>
                      <OIBar oi={row.putOi} maxOi={maxOi} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function fmtINRWhole(n: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}
