import React, { useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { Activity, HelpCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Header from './Header';
import MarketPulseHero from './MarketPulseHero';
import FloatingMotionDock from './FloatingMotionDock';
import MarketCards from './MarketCards';
import EmailCapturePopup from './EmailCapturePopup';
import DataSourceBadge from './DataSourceBadge';
import { useLiveStocks } from '../hooks/useLiveStocks';
import { useMarketIndices } from '../hooks/useMarketIndices';
import { getMarketDataStatus, type MarketDataStatus } from '../core/marketData';
import { Stock, IndexData } from '../types';

export type DashboardTab =
  | 'screener' | 'chartink' | 'fo' | 'deals' | 'news' | 'pricing' | 'blog'
  | 'us' | 'strategy-builder' | 'greeks-calculator' | 'risk-calculator'
  | 'heatmap' | 'fii-dii' | 'signals';

export const TAB_TO_PATH: Record<DashboardTab, string> = {
  screener: '/screener',
  chartink: '/scanner',
  fo: '/option-chain',
  us: '/us-markets',
  'strategy-builder': '/strategy-builder',
  'greeks-calculator': '/greeks-calculator',
  'risk-calculator': '/risk-calculator',
  heatmap: '/heatmap',
  'fii-dii': '/fii-dii',
  deals: '/deals',
  news: '/news',
  pricing: '/pricing',
  blog: '/blog',
  signals: '/signals',
};

const PATH_TO_TAB: Record<string, DashboardTab> = Object.entries(TAB_TO_PATH).reduce(
  (acc, [tab, path]) => {
    acc[path] = tab as DashboardTab;
    return acc;
  },
  {} as Record<string, DashboardTab>,
);

const utilityRoutes = new Set(['/connect-broker', '/privacy', '/terms', '/risk-disclosure', '/contact']);

export interface DashboardContext {
  stocks: Stock[];
  indices: IndexData[];
  stockData: Stock[];
  isLoadingStocks: boolean;
  stocksError: string | null;
  retryStocks: () => void;
  selectedStockSymbol: string;
  setSelectedStockSymbol: (s: string) => void;
  activeStock: Stock | undefined;
  handleSelectStock: (symbol: string) => void;
  handleSelectFoStock: (symbol: string) => void;
  marketDataStatus: MarketDataStatus;
}

export function useDashboard() {
  return useOutletContext<DashboardContext>();
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const { indices } = useMarketIndices();
  const { stocks, loading: isLoadingStocks, error: stocksError, retry: retryStocks } = useLiveStocks();

  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>('RELIANCE.NS');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const activeTab: DashboardTab = PATH_TO_TAB[location.pathname] || 'screener';
  const setActiveTab = (tab: DashboardTab) => navigate(TAB_TO_PATH[tab] || '/screener');
  const isUtilityRoute = utilityRoutes.has(location.pathname);
  const marketDataStatus = useMemo(() => getMarketDataStatus(Boolean(stocksError)), [stocksError, location.pathname]);

  const activeStock = useMemo(() => {
    return (
      stocks.find(s => {
        const cleanLeft = selectedStockSymbol.replace('NSE:', '').replace('.NS', '');
        const cleanRight = s.symbol.replace('.NS', '');
        return cleanLeft === cleanRight;
      }) || stocks[0]
    );
  }, [stocks, selectedStockSymbol]);

  const handleSelectStock = (symbol: string) => setSelectedStockSymbol(symbol);

  const handleSelectFoStock = (symbol: string) => {
    setSelectedStockSymbol(symbol);
    navigate(`${TAB_TO_PATH.fo}?symbol=${symbol.replace('NSE:', '').replace('.NS', '')}`);
  };

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
    handleSelectStock,
    handleSelectFoStock,
    marketDataStatus,
  };

  const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
  const footerLinkClass = 'hover:text-slate-900 dark:hover:text-slate-300 transition cursor-pointer';

  return (
    <div
      className="min-h-screen relative isolate overflow-hidden bg-slate-50/80 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300"
      id="core_app_layer"
    >
      <Header
        indices={indices}
        stocks={stocks}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSelectStock={handleSelectStock}
      />

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 md:py-6" id="main_layout_body">
        {!isUtilityRoute && (
          <>
            <MarketPulseHero
              indices={indices}
              stocks={stocks}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isLoadingStocks={isLoadingStocks}
            />

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.35 }}
              className="flex flex-wrap items-center gap-3 mb-6 bg-white/80 dark:bg-slate-950/75 backdrop-blur-xl px-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-850 shadow-sm">
              {isLoadingStocks ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin shrink-0" />
                  <div className="flex flex-col gap-1 w-full max-w-[200px]">
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-full"></div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse w-2/3"></div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 ml-auto hidden sm:block">Fetching market snapshot...</span>
                </>
              ) : stocksError ? (
                <>
                  <div className="w-4 h-4 shrink-0 rounded-full bg-rose-500/20 items-center justify-center flex">
                    <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                  </div>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Failed to sync market snapshot</span>
                  <DataSourceBadge status={marketDataStatus} compact />
                  <button
                    onClick={retryStocks}
                    className="ml-auto bg-slate-900 border border-transparent dark:border-slate-700 dark:bg-slate-800 text-white text-xs px-3 py-1 rounded hover:opacity-90 active:scale-95 transition-all outline-none"
                  >
                    Retry Connection
                  </button>
                </>
              ) : (
                <>
                  <Activity size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Loaded {stocks.length} stocks</span>
                  <DataSourceBadge status={marketDataStatus} compact />
                  <span className="text-[10px] font-mono text-slate-400 ml-auto hidden sm:block">Free mode uses delayed/cached snapshots</span>
                </>
              )}
            </motion.div>

            {indices.length > 0 && (
              <MarketCards
                indices={indices}
                onSelectIndex={(sym) => {
                  const foundIndex = indices.find(i => i.symbol === sym);
                  if (foundIndex) setSelectedStockSymbol(sym);
                }}
              />
            )}

            {isWeekend && (
              <div className="mb-6 bg-amber-500/5 dark:bg-slate-950/80 border border-amber-500/20 dark:border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm" id="weekend_market_indicator">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-2.5 rounded-lg shrink-0">
                    <HelpCircle size={18} className="text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Indian Stock Markets are Closed (Weekend Session)
                    </h4>
                    <p className="text-xs text-slate-650 dark:text-slate-400 mt-1 leading-relaxed">
                      Since today is a market holiday, the NSE/BSE trading session is closed. The platform displays the <strong>last-recorded snapshot prices</strong> with analytical option chain and chart overlay support.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16, filter: 'blur(5px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            id="workspace_grid"
          >
            <Outlet context={context} />
          </motion.div>
        </AnimatePresence>
      </main>

      {!isUtilityRoute && <FloatingMotionDock activeTab={activeTab} setActiveTab={setActiveTab} />}

      <footer className="relative z-10 bg-slate-100/90 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-850/60 text-slate-500 font-mono text-[10px] mt-16 py-10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col gap-2">
            <h4 className="text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">StockPro Screener</h4>
            <p className="text-[9px] text-slate-400 mb-2 leading-tight">StockPro Analytics is not a SEBI registered investment advisor. All data shown is for educational and informational purposes only. Derivatives trading involves risk of loss.</p>
            <p>&copy; {new Date().getFullYear()} StockPro. All rights reserved.</p>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">Protocol</h4>
            <Link to="/privacy" className={footerLinkClass}>Privacy Policy</Link>
            <Link to="/terms" className={footerLinkClass}>Terms of Use</Link>
            <Link to="/risk-disclosure" className={footerLinkClass}>Risk Disclosure</Link>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">Data Source</h4>
            <Link to="/connect-broker" className={footerLinkClass}>Connect Broker Live Mode</Link>
            <p className="leading-relaxed">Free public mode uses delayed/cached data. Broker mode is required for real-time ticks.</p>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">Support</h4>
            <Link to="/contact" className={footerLinkClass}>Contact Us</Link>
            <Link to="/privacy" className={footerLinkClass}>Privacy Policy</Link>
            <Link to="/terms" className={footerLinkClass}>Terms</Link>
          </div>
        </div>
      </footer>
      <EmailCapturePopup />
    </div>
  );
}
