import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity } from 'lucide-react';
import OptionChainCommandPanel from '../components/OptionChainCommandPanel';
import OptionChainAnalyticsCards from '../components/OptionChainAnalyticsCards';
import OptionChainView from '../components/OptionChainView';
import SectionErrorBoundary from '../components/SectionErrorBoundary';
import { useDashboard } from '../components/Layout';

const indexMeta: Record<string, { name: string }> = {
  '^NSEI': { name: 'NIFTY 50 Index' },
  '^NSEBANK': { name: 'BANK NIFTY Index' },
  'FINNIFTY': { name: 'FINNIFTY Index' },
  'MIDCPNIFTY': { name: 'MIDCPNIFTY Index' },
};

export default function OptionChainPage() {
  const { stocks, indices, selectedStockSymbol, setSelectedStockSymbol, activeStock, handleSelectStock } = useDashboard();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const symbolParam = searchParams.get('symbol');
    if (symbolParam) {
      const normalized = symbolParam.toUpperCase();
      const indexAlias = normalized === 'NIFTY' ? '^NSEI' : normalized === 'BANKNIFTY' ? '^NSEBANK' : normalized;
      const match = stocks.find(s => s.symbol.replace('.NS', '') === normalized);
      setSelectedStockSymbol(match ? match.symbol : indexAlias);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, stocks.length]);

  const isIndex = selectedStockSymbol === '^NSEI' || selectedStockSymbol === '^NSEBANK' || selectedStockSymbol === 'FINNIFTY' || selectedStockSymbol === 'MIDCPNIFTY';
  const resolvedSymbol = isIndex ? selectedStockSymbol : activeStock?.symbol || '^NSEI';
  const selectValue = resolvedSymbol;
  const indexInfo = indexMeta[resolvedSymbol];
  const indexMarket = indices.find(i => i.symbol === resolvedSymbol || i.name.toUpperCase().includes(indexInfo?.name.split(' ')[0] || ''));
  const optionSymbol = resolvedSymbol;
  const optionPrice = isIndex ? indexMarket?.price : activeStock?.price;
  const optionName = isIndex ? (indexMarket?.name || indexInfo?.name || resolvedSymbol) : activeStock?.name || 'NIFTY 50 Index';

  return (
    <div className="lg:col-span-12 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-baseline md:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-850 pb-4">
        <div>
          <h1 className="text-xl font-sans font-black flex items-center gap-2 text-slate-900 dark:text-white">
            <Activity size={20} className="text-emerald-555 dark:text-emerald-400 animate-pulse" />
            F&O Analytics derivatives command
          </h1>
          <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
            Exchange-style option chain workspace with index filters, expiry controls, strike analytics, PCR, max pain, and strategy simulation.
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
            <option value="FINNIFTY">FINNIFTY Index</option>
            <option value="MIDCPNIFTY">MIDCPNIFTY Index</option>
            {stocks.filter(s => s.isFoEnabled).map(s => (
              <option key={s.symbol} value={s.symbol}>{s.symbol.replace('.NS', '')}</option>
            ))}
          </select>
        </div>
      </div>

      {optionSymbol && optionPrice && (
        <OptionChainCommandPanel
          stocks={stocks}
          selectedValue={selectValue}
          currentPrice={optionPrice}
          onSelectSymbol={handleSelectStock}
        />
      )}

      {optionSymbol && optionPrice && (
        <OptionChainAnalyticsCards
          selectedValue={selectValue}
          currentPrice={optionPrice}
        />
      )}

      {optionSymbol && (
        <SectionErrorBoundary>
          <OptionChainView
            symbol={optionSymbol}
            currentPrice={optionPrice}
            stockName={optionName}
          />
        </SectionErrorBoundary>
      )}
    </div>
  );
}
