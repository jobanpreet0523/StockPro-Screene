import { useState } from 'react';
import ProSetupPanel from './ProSetupPanel';
export default function ProDataExplorer() {
  const [symbol,setSymbol]=useState('');
  const sections=['Company overview','Financials','Ratios','Valuation','Dividends','Shareholding','Earnings','News'];
  return <div><h1 className="text-2xl font-black">Data Explorer</h1><label className="mt-5 flex max-w-lg gap-2"><input value={symbol} onChange={(e)=>setSymbol(e.target.value.toUpperCase())} placeholder="Enter NSE symbol" className="min-w-0 flex-1 border border-slate-300 bg-white px-3 py-2"/><button type="button" className="bg-slate-950 px-4 py-2 text-sm font-bold text-white">Load</button></label><div className="mt-5 grid gap-3 md:grid-cols-2">{sections.map((name)=><ProSetupPanel key={name} title={name} message={symbol ? `Fundamentals provider setup is required for ${symbol}.` : 'Select a symbol. No company data is prefilled.'}/>)}</div></div>;
}
