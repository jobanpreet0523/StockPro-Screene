import React from 'react';
import { useScreenerStore } from '../../store/screenerStore';

const SECTORS = ['', 'Energy', 'Technology', 'Banking', 'Telecom', 'Consumer Goods', 'Capital Goods', 'Auto', 'Pharma', 'Finance', 'Cement', 'Metals', 'Power', 'Mining'];
const INDICES = ['NIFTY 50', 'NIFTY 100', 'NIFTY 200', 'NIFTY 500', 'All NSE'] as const;
const CAPS = ['All', 'Large', 'Mid', 'Small'] as const;

export default function FilterPanel() {
  const { filters, setFilter, resetFilters } = useScreenerStore();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Filters</h3>
        <button onClick={resetFilters} className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold">Reset</button>
      </div>

      {/* Index */}
      <div>
        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Index</label>
        <select value={filters.index} onChange={e => setFilter('index', e.target.value as any)}
          className="w-full bg-slate-800 text-white text-xs px-2 py-1.5 rounded border border-slate-700 focus:border-emerald-500">
          {INDICES.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Price Range</label>
        <div className="flex gap-1">
          <input type="number" placeholder="Min" value={filters.priceMin || ''} onChange={e => setFilter('priceMin', +e.target.value || 0)}
            className="w-1/2 bg-slate-800 text-white text-xs px-2 py-1.5 rounded border border-slate-700" />
          <input type="number" placeholder="Max" value={filters.priceMax === Infinity ? '' : filters.priceMax} onChange={e => setFilter('priceMax', +e.target.value || Infinity)}
            className="w-1/2 bg-slate-800 text-white text-xs px-2 py-1.5 rounded border border-slate-700" />
        </div>
      </div>

      {/* Cap Category */}
      <div>
        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Market Cap</label>
        <div className="flex gap-1">
          {CAPS.map(c => (
            <button key={c} onClick={() => setFilter('capCategory', c)}
              className={`flex-1 text-[10px] font-bold py-1 rounded ${filters.capCategory === c ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Change % */}
      <div>
        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">% Change</label>
        <div className="flex gap-1">
          <input type="number" placeholder="Min%" value={filters.changeMin === -Infinity ? '' : filters.changeMin} onChange={e => setFilter('changeMin', +e.target.value || -Infinity)}
            className="w-1/2 bg-slate-800 text-white text-xs px-2 py-1.5 rounded border border-slate-700" />
          <input type="number" placeholder="Max%" value={filters.changeMax === Infinity ? '' : filters.changeMax} onChange={e => setFilter('changeMax', +e.target.value || Infinity)}
            className="w-1/2 bg-slate-800 text-white text-xs px-2 py-1.5 rounded border border-slate-700" />
        </div>
      </div>

      {/* Sector */}
      <div>
        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Sector</label>
        <select value={filters.sector} onChange={e => setFilter('sector', e.target.value)}
          className="w-full bg-slate-800 text-white text-xs px-2 py-1.5 rounded border border-slate-700 focus:border-emerald-500">
          {SECTORS.map(s => <option key={s} value={s}>{s || 'All Sectors'}</option>)}
        </select>
      </div>
    </div>
  );
}
