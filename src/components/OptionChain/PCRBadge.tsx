import React from 'react';
import { calcPCR } from '../../utils/calculations';

interface PCRBadgeProps {
  totalPutOI: number;
  totalCallOI: number;
}

export default function PCRBadge({ totalPutOI, totalCallOI }: PCRBadgeProps) {
  const pcr = calcPCR(totalPutOI, totalCallOI);
  const color = pcr > 1.2 ? 'text-emerald-400' : pcr < 0.8 ? 'text-red-400' : 'text-amber-400';
  const bg = pcr > 1.2 ? 'bg-emerald-500/10 border-emerald-500/30' : pcr < 0.8 ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30';
  const sentiment = pcr > 1.2 ? 'Bullish' : pcr < 0.8 ? 'Bearish' : 'Neutral';

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${bg}`}>
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PCR</span>
      <span className={`text-lg font-black ${color}`}>{pcr.toFixed(2)}</span>
      <span className={`text-[10px] font-bold ${color}`}>{sentiment}</span>
    </div>
  );
}
