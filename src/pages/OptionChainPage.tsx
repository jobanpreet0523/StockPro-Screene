import React from 'react';
import OptionChainTable from '../components/OptionChain/OptionChainTable';
import { useOptionChain } from '../hooks/useOptionChain';
import { useOptionChainStore } from '../store/optionChainStore';
import { fmtINR, fmtLakhCrore, fmtPct } from '../utils/formatters';
import { useMarketStatus } from '../hooks/useMarketStatus';

export default function OptionChainPage() {
  const { data, isLoading } = useOptionChain();
  const { selectedIndex } = useOptionChainStore();
  const { data: statusData } = useMarketStatus();
  const records = data?.data?.records;
  const spot = records?.underlyingValue || 0;
  const source = data?.source || '';

  return (
    <div className="max-w-[1920px] mx-auto px-4 py-4">
      {/* Page title & spot info */}
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            {selectedIndex} Option Chain
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {statusData?.market === 'OPEN' ? 'Market is LIVE — data refreshes every 5s' : 'Market closed — showing last session data'}
            {source && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-slate-800 rounded font-mono">{source}</span>}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-black text-white">₹{fmtINR(spot)}</div>
            <div className="text-xs text-slate-400">{selectedIndex} Spot</div>
          </div>
        </div>
      </div>

      {/* Option Chain Table */}
      <OptionChainTable />
    </div>
  );
}
