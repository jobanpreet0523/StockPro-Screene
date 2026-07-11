import { useMemo, useState } from 'react';
export default function ProCharts() {
  const [symbol,setSymbol]=useState('NIFTY');
  const [timeframe,setTimeframe]=useState('1D');
  const src=useMemo(()=>`https://s.tradingview.com/widgetembed/?symbol=NSE%3A${encodeURIComponent(symbol)}&interval=${timeframe === '1D' ? 'D' : timeframe === '1W' ? 'W' : 'M'}&theme=light`,[symbol,timeframe]);
  return <div><h1 className="text-2xl font-black">Charts</h1><div className="mt-4 flex flex-wrap gap-2"><input value={symbol} onChange={(e)=>setSymbol(e.target.value.toUpperCase())} aria-label="Chart symbol" className="border border-slate-300 bg-white px-3 py-2"/><select value={timeframe} onChange={(e)=>setTimeframe(e.target.value)} className="border border-slate-300 bg-white px-3 py-2">{['1D','1W','1M','3M','6M','12M'].map((v)=><option key={v}>{v}</option>)}</select></div><div className="mt-4 aspect-[16/9] min-h-[360px] overflow-hidden border border-slate-200 bg-white"><iframe title={`TradingView chart for ${symbol}`} src={src} className="h-full w-full" loading="lazy"/></div><p className="mt-3 text-xs font-semibold text-slate-500">Third-party chart availability is independent of StockPro. Chart failure does not create substitute prices.</p></div>;
}
