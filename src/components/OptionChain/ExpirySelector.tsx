import React from 'react';
import { useOptionChainStore, IndexSymbol } from '../../store/optionChainStore';

const INDICES: { key: IndexSymbol; label: string }[] = [
  { key: 'NIFTY', label: 'NIFTY 50' },
  { key: 'BANKNIFTY', label: 'BANK NIFTY' },
  { key: 'FINNIFTY', label: 'FINNIFTY' },
];

export default function ExpirySelector() {
  const { selectedIndex, setSelectedIndex, selectedExpiry, setSelectedExpiry } = useOptionChainStore();

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Index tabs */}
      <div className="flex bg-slate-800 rounded-lg p-0.5">
        {INDICES.map(idx => (
          <button
            key={idx.key}
            onClick={() => setSelectedIndex(idx.key)}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
              selectedIndex === idx.key
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {idx.label}
          </button>
        ))}
      </div>
    </div>
  );
}
