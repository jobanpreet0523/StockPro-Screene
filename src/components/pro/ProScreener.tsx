import { useState } from 'react';
import ProSetupPanel from './ProSetupPanel';
export default function ProScreener() {
  const [filters,setFilters]=useState({price:'',volume:'',sector:'',pe:'',roe:'',roce:'',rsi:'',ma:'50',oi:'',pcr:''});
  return <div><h1 className="text-2xl font-black">Pro Screener</h1><p className="mt-1 text-sm font-semibold text-slate-600">Configure filters locally, then run against a licensed provider when available.</p><div className="mt-5 grid gap-3 border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(filters).map(([key,value]) => <label key={key} className="grid gap-1 text-xs font-bold uppercase text-slate-500">{key}<input value={value} onChange={(e)=>setFilters((f)=>({...f,[key]:e.target.value}))} className="border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-950"/></label>)}</div><div className="mt-4"><ProSetupPanel title="Screener provider setup required" message="No rows are fabricated while fundamentals, technical, and derivatives providers are unavailable." /></div></div>;
}
