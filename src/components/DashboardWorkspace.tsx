import { Suspense, useMemo, useState } from 'react';
import { Activity } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import DataSourceBadge from './DataSourceBadge';
import MarketCards from './MarketCards';
import { useLiveStocks } from '../hooks/useLiveStocks';
import { useMarketIndices } from '../hooks/useMarketIndices';
import { getMarketDataStatus } from '../core/marketData';
import { TAB_TO_PATH, type DashboardContext, type DashboardTab } from './dashboardContext';

const PATH_TO_TAB: Record<string, DashboardTab> = Object.entries(TAB_TO_PATH).reduce(
  (paths, [tab, path]) => ({ ...paths, [path]: tab as DashboardTab }),
  {},
);

export default function DashboardWorkspace() {
  const location = useLocation();
  const navigate = useNavigate();
  const { indices } = useMarketIndices();
  const { stocks, loading: isLoadingStocks, error: stocksError, providerStatus, retry: retryStocks } = useLiveStocks();
  const [selectedStockSymbol, setSelectedStockSymbol] = useState('RELIANCE.NS');
  const activeTab = PATH_TO_TAB[location.pathname] || 'screener';
  const marketDataStatus = useMemo(
    () => getMarketDataStatus(Boolean(stocksError), providerStatus),
    [stocksError, providerStatus],
  );
  const activeStock = useMemo(() => stocks.find((stock) => {
    const selected = selectedStockSymbol.replace('NSE:', '').replace('.NS', '');
    return selected === stock.symbol.replace('.NS', '');
  }) || stocks[0], [selectedStockSymbol, stocks]);

  const context: DashboardContext = {
    stocks,
    indices,
    stockData: stocks,
    isLoadingStocks,
    stocksError,
    retryStocks,
    selectedStockSymbol,
    setSelectedStockSymbol,
    activeStock,
    handleSelectStock: setSelectedStockSymbol,
    handleSelectFoStock: (symbol) => {
      setSelectedStockSymbol(symbol);
      navigate(`${TAB_TO_PATH.fo}?symbol=${symbol.replace('NSE:', '').replace('.NS', '')}`);
    },
    marketDataStatus,
  };

  return (
    <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 p-4 md:py-6" id="main_layout_body">
      <div className="mb-6 flex min-h-12 flex-wrap items-center gap-3 border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
        {isLoadingStocks ? (
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Checking authorized market provider...</span>
        ) : stocksError ? (
          <>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Market data refresh delayed</span>
            <DataSourceBadge status={marketDataStatus} compact />
            <button onClick={retryStocks} className="ml-auto bg-slate-950 px-3 py-1 text-xs font-bold text-white dark:bg-white dark:text-slate-950">Retry</button>
          </>
        ) : (
          <>
            <Activity size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Loaded {stocks.length} stocks</span>
            <DataSourceBadge status={marketDataStatus} compact />
          </>
        )}
      </div>

      {indices.length > 0 && <MarketCards indices={indices} onSelectIndex={setSelectedStockSymbol} />}

      <AnimatePresence mode="wait">
        <motion.div key={location.pathname} className="grid grid-cols-1 gap-6 lg:grid-cols-12" id="workspace_grid">
          <Suspense fallback={<div className="min-h-[360px] w-full" aria-label="Loading workspace" />}>
            <Outlet context={context} />
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}