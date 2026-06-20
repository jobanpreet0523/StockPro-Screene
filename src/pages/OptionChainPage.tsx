import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSeoTags } from '../hooks/useSeoTags';
import { Activity } from 'lucide-react';
import OptionChainView from '../components/OptionChainView';
import SectionErrorBoundary from '../components/SectionErrorBoundary';
import { useDashboard } from '../components/Layout';

export default function OptionChainPage() {
  useSeoTags({
    title: "Live Option Chain Analysis | NIFTY & BANKNIFTY",
    description: "Dynamic Greek calculations, Max Pain, and Multi-strike OI analysis for NSE indices and equities."
  });
  const { stocks, selectedStockSymbol, setSelectedStockSymbol, activeStock, handleSelectStock } = useDashboard();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const symbolParam = searchParams.get('symbol');
    if (symbolParam) {
      const match = stocks.find(s => s.symbol.replace('.NS', '') === symbolParam.toUpperCase());
      setSelectedStockSymbol(match ? match.symbol : symbolParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, stocks.length]);

  const isIndex = selectedStockSymbol === '^NSEI' || selectedStockSymbol === '^NSEBANK';
  const selectValue = isIndex ? selectedStockSymbol : activeStock ? activeStock.symbol : selectedStockSymbol;

  return (
    <div className="lg:col-span-12 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-baseline md:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-850 pb-4">
        <div>
          <h1 className="text-xl font-sans font-black flex items-center gap-2 text-slate-900 dark:text-white">
            <Activity size={20} className="text-emerald-555 dark:text-emerald-400 animate-pulse" />
            F&O Analytics derivatives command
          </h1>
          <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
            Analyzing active instrument option chains centered around the current spot index values
          </p>
        </div>

        <div className="flex items-center gap-2 mt-2 md:mt-0 font-mono text-xs">
          <span className="text-slate-500 dark:text-slate-450 uppercase font-bold">Select F&O Symbol:</span>
          <select
            value={selectValue}
            onChange={(e) => handleSelectStock(e.target.value)}
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded px-2.5 py-1.5 focus:border-emerald-500 transition font-bold shadow-sm"
          >
            <option value="^NSEI">NIFTY 50 Index</option>
            <option value="^NSEBANK">BANK NIFTY Index</option>
            {stocks.filter(s => s.isFoEnabled).map(s => (
              <option key={s.symbol} value={s.symbol}>{s.symbol.replace('.NS', '')}</option>
            ))}
          </select>
        </div>
      </div>

      {activeStock && (
        <SectionErrorBoundary>
          <OptionChainView
            symbol={activeStock.symbol}
            currentPrice={activeStock.price}
            stockName={activeStock.name}
          />
        </SectionErrorBoundary>
      )}
    </div>
  );
}
