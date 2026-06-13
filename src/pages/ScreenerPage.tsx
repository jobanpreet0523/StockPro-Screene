import React from 'react';
import FilterPanel from '../components/Screener/FilterPanel';
import ResultsTable from '../components/Screener/ResultsTable';

export default function ScreenerPage() {
  return (
    <div className="max-w-[1920px] mx-auto px-4 py-4">
      <div className="mb-4">
        <h1 className="text-2xl font-black text-white">Stock Screener</h1>
        <p className="text-xs text-slate-400 mt-0.5">Filter NSE F&O stocks by technical criteria</p>
      </div>
      <div className="flex gap-4">
        {/* Sidebar filters */}
        <div className="w-64 shrink-0 hidden lg:block">
          <FilterPanel />
        </div>
        {/* Results */}
        <div className="flex-1 min-w-0">
          <ResultsTable />
        </div>
      </div>
    </div>
  );
}
