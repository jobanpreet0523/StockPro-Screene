import React from 'react';
import { useMarketStatus } from '../hooks/useMarketStatus';
import { useMarketIndices, IndexQuote } from '../hooks/useMarketIndices';
import { formatIST } from '../utils/marketHours';
import { fmtINR, fmtPct } from '../utils/formatters';

export default function Header() {
  const { data: statusData } = useMarketStatus();
  const { data: indicesData } = useMarketIndices();
  const marketStatus = statusData?.market || 'CLOSED';
  const indices: IndexQuote[] = indicesData?.data || [];

  const statusColor = marketStatus === 'OPEN' ? 'bg-emerald-500' : marketStatus === 'PRE_MARKET' ? 'bg-amber-500' : 'bg-red-500';
  const statusLabel = marketStatus === 'OPEN' ? '● LIVE' : marketStatus === 'PRE_MARKET' ? '● PRE-MARKET' : '● MARKET CLOSED';

  return (
    <header className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800">
      <div className="max-w-[1920px] mx-auto flex items-center gap-4 px-4 py-2">
        {/* Brand */}
        <a href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-white text-sm">S</div>
          <span className="font-black text-white text-lg hidden sm:block">StockPro</span>
        </a>

        {/* Status pill */}
        <span className={`${statusColor} text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider`}>
          {statusLabel}
        </span>

        {/* Index tickers */}
        <div className="flex-1 flex items-center gap-4 overflow-x-auto scrollbar-hide">
          {indices.map(idx => (
            <div key={idx.symbol} className="flex items-center gap-1.5 text-xs whitespace-nowrap shrink-0">
              <span className="text-slate-400 font-medium">{idx.name}</span>
              <span className="text-white font-bold">{fmtINR(idx.price)}</span>
              <span className={idx.isPositive ? 'text-emerald-400' : 'text-red-400'}>{fmtPct(idx.changePercent)}</span>
            </div>
          ))}
        </div>

        {/* Timestamp */}
        <span className="text-slate-500 text-[10px] font-mono whitespace-nowrap hidden md:block">
          {formatIST()} IST
        </span>
      </div>
    </header>
  );
}
