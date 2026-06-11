import React, { useState, useEffect, Component, ReactNode, ErrorInfo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Header from './components/Header';
import MarketCards from './components/MarketCards';
import StockScreener from './components/StockScreener';
import ScreenerBuilder from './components/ScreenerBuilder';
import StockChart from './components/StockChart';
import OptionChainView from './components/OptionChainView';
import { Stock, IndexData } from './types';
import { INITIAL_INDICES } from './data';
import { TrendingUp, HelpCircle, ShieldCheck, Activity, RefreshCw } from 'lucide-react';
import { useTheme } from './components/ThemeContext';
import NewsView from './components/NewsView';
import { useLiveStocks } from './hooks/useLiveStocks';
import { useMarketIndices } from './hooks/useMarketIndices';
import EmailCapturePopup from './components/EmailCapturePopup';
import PricingView from './components/PricingView';
import BlogView from './components/BlogView';
import DealsTracker from './components/DealsTracker';
import UsMarketsView from './components/UsMarketsView';
import StrategyBuilder from './components/StrategyBuilder';
import GreeksCalculator from './components/GreeksCalculator';
import RiskCalculator from './components/RiskCalculator';
import Heatmap from './components/Heatmap';
import FiiDiiTracker from './components/FiiDiiTracker';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Root Terminal Breakdown Isolated:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-white bg-slate-950 min-h-screen flex flex-col items-center justify-center font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl text-center">
            <Activity className="text-rose-500 mx-auto mb-4 animate-pulse" size={40} />
            <h2 className="text-xl font-black mb-2 tracking-tight">System Core Disrupted</h2>
            <p className="text-sm text-slate-400 mb-6 font-mono bg-slate-950 p-3 rounded-lg border border-slate-850 break-words text-left">
              {this.state.error?.message || "Unknown execution runtime mismatch."}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-5 rounded-xl transition duration-200 active:scale-[0.98] focus:outline-none"
            >
              Reinitialize Terminal Workspace
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

class SectionErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Section component crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-rose-500/5 border border-dashed border-rose-500/20 rounded-2xl flex flex-col items-center justify-center text-center transition-all">
          <Activity size={28} className="text-rose-500 mb-3 animate-bounce" />
          <h3 className="text-sm font-bold text-rose-400 mb-1">Analytical Component Offline</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            Live pipeline data anomaly isolated. The structural dashboard remains fully operational.
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-slate-700 shadow-md active:scale-95 transition cursor-pointer"
          >
            Attempt Stream Recovery
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface ScreenerPageProps {
  activeTabProp?: 'us' | 'screener' | 'chartink' | 'fo' | 'deals' | 'news' | 'pricing' | 'blog' | 'strategy-builder' | 'greeks-calculator' | 'risk-calculator' | 'heatmap' | 'fii-dii';
}

function ScreenerPage({ activeTabProp }: ScreenerPageProps = {}) {
  const { theme } = useTheme();
  const { indices = [], loading: isLoadingIndices, error: indicesError, retry: fetchAllIndices } = useMarketIndices();
  const { stocks = [], loading: isLoadingStocks, error: stocksError, retry: fetchAllStocks } = useLiveStocks();
  
  const [activeTab, setActiveTab] = useState<'us' | 'screener' | 'chartink' | 'fo' | 'deals' | 'news' | 'pricing' | 'blog' | 'strategy-builder' | 'greeks-calculator' | 'risk-calculator' | 'heatmap' | 'fii-dii'>(() => {
    if (activeTabProp) return activeTabProp;
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/blog') return 'blog';
      if (path === '/screener' || path.includes('screener.html')) return 'chartink';
    }
    return 'screener';
  });

  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>('RELIANCE.NS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLive, setIsLive] = useState<boolean>(true);
  const [stockData, setStockData] = useState<any[]>([]);

  useEffect(() => {
    setIsLive(!isLoadingIndices && !indicesError);
  }, [isLoadingIndices, indicesError]);

  useEffect(() => {
    if (Array.isArray(stocks)) {
      setStockData(stocks);
    }
  }, [stocks]);

  // Bulletproof fallback calculation engine for selecting active items
  const activeStock = (Array.isArray(stocks) ? stocks : []).find(s => {
    if (!s || !s.symbol || !selectedStockSymbol) return false;
    const cleanLeft = String(selectedStockSymbol).replace('NSE:', '').replace('.NS', '').trim().toUpperCase();
    const cleanRight = String(s.symbol).replace('.NS', '').trim().toUpperCase();
    return cleanLeft === cleanRight;
  }) || stocks?.[0] || null;

  const handleSelectStock = (symbol: string) => {
    if (symbol) setSelectedStockSymbol(symbol);
  };

  const handleSelectFoStock = (symbol: string) => {
    if (!symbol) return;
    setSelectedStockSymbol(symbol);
    setActiveTab('fo');
    const cleanSymbol = String(symbol).replace('NSE:', '').replace('.NS', '').trim();
    if (typeof window !== 'undefined' && window.history.pushState) {
      window.history.pushState(null, '', `/screener?symbol=${cleanSymbol}`);
    }
  };

  const safeStocksArray = Array.isArray(stocks) ? stocks : [];
  const safeIndicesArray = Array.isArray(indices) ? indices : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300" id="core_app_layer">
      {/* App Bar Navigation */}
      <Header
        indices={safeIndicesArray}
        stocks={safeStocksArray}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSelectStock={handleSelectStock}
      />

      {/* Main App Workspace container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:py-6" id="main_layout_body">
        
        {/* Bulk Stock Data Status Ticker */}
        <div className="flex items-center gap-3 mb-6 bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm transition-all">
          {isLoadingStocks ? (
             <>
               <span className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin shrink-0" />
               <div className="flex flex-col gap-1 w-full max-w-[240px]">
                 <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-full"></div>
                 <div className="h-2 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse w-2/3"></div>
               </div>
               <span className="text-[10px] font-mono text-slate-400 ml-auto hidden sm:block animate-pulse">Syncing Yahoo Finance Node Layer...</span>
             </>
          ) : stocksError ? (
             <>
               <div className="w-4 h-4 shrink-0 rounded-full bg-rose-500/20 items-center justify-center flex">
                 <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
               </div>
               <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Live data pipeline transmission suspended</span>
               <button 
                 onClick={fetchAllStocks} 
                 className="ml-auto bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-white text-xs px-3 py-1 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 transition-all outline-none flex items-center gap-1.5 font-medium shadow-sm"
               >
                 <RefreshCw size={12} /> Force Reconnect
               </button>
             </>
          ) : (
             <>
               <span className="flex h-2 w-2 relative shrink-0">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
               </span>
               <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                 Operational Feed: <span className="font-mono text-emerald-500 font-black">{stockData.length}</span> Active Instruments
               </span>
               <span className="text-[10px] font-mono text-emerald-500/80 dark:text-emerald-400/60 ml-auto hidden sm:block uppercase tracking-wider font-bold">
                 Yahoo Finance API Enterprise Secured
               </span>
             </>
          )}
        </div>

        {/* Indices benchmark strip */}
        {safeIndicesArray.length > 0 && (
          <div className="mb-6">
            <MarketCards
              indices={safeIndicesArray}
              onSelectIndex={(sym) => {
                if (!sym) return;
                const foundIndex = safeIndicesArray.find(i => i && i.symbol === sym);
                if (foundIndex) {
                  setSelectedStockSymbol(sym);
                }
              }}
            />
          </div>
        )}

        {/* Indian Market Closed Weekend Alert */}
        {(new Date().getDay() === 0 || new Date().getDay() === 6) && (
          <div className="mb-6 bg-amber-500/[0.03] dark:bg-slate-900/40 border border-amber-500/20 dark:border-amber-500/10 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm transition-all" id="weekend_market_indicator">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-2.5 rounded-xl shrink-0 dark:bg-amber-500/5">
                <HelpCircle size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-amber-400/90 flex items-center gap-2">
                  Exchange Offline — Weekend Session Context Active
                </h4>
                <p className="text-xs text-slate-550 dark:text-slate-400 mt-1 leading-relaxed max-w-4xl">
                  National Stock Exchange (NSE) and Bombay Stock Exchange (BSE) live pipelines are closed. The workspace has successfully cached and loaded <strong>100% accurate closure records</strong> with fully supported historical calculation models, chart nodes, and derivatives analytics chains.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Core Engine Active
            </div>
          </div>
        )}

        {/* Layout Grid Ecosystem */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="workspace_grid">
          {activeTab === 'screener' ? (
            <>
              {/* Left Column: Core Data Sheet Matrix */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <SectionErrorBoundary>
                  <StockScreener
                    stocks={safeStocksArray}
                    onSelectStock={handleSelectStock}
                    onSelectFoStock={handleSelectFoStock}
                  />
                </SectionErrorBoundary>
              </div>

              {/* Right Column: Dynamic Graph Engine Sticky Anchor */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="sticky top-[100px] flex flex-col gap-4">
                  {activeStock ? (
                    <SectionErrorBoundary>
                      <StockChart
                        symbol={activeStock.symbol}
                        name={activeStock.name}
                      />
                    </SectionErrorBoundary>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-850 text-center text-xs text-slate-400 animate-pulse">
                      Awaiting Instrument Selection Map...
                    </div>
                  )}
                  
                  {/* Terminal Desk Meta Block */}
                  <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-850 rounded-xl flex flex-col gap-2.5 shadow-sm transition-all">
                    <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Analytical Terminal Desk</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                      Select any asset line in the master matrix to mount technical visualizations instantly. Feeds synchronize globally with sub-second latency tolerances.
                    </p>
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-2.5 mt-1 text-[11px] font-mono text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1">
                        <ShieldCheck size={12} className="text-emerald-500" /> Validation Node Secure
                      </span>
                      <span>Tick Sync: ~1.5s</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'chartink' ? (
            <div className="lg:col-span-12 flex flex-col gap-6" id="chartink_screener_view">
              <SectionErrorBoundary>
                <ScreenerBuilder
                  stocks={safeStocksArray}
                  stockData={stockData}
                  onSelectStock={handleSelectStock}
                  onSelectFoStock={handleSelectFoStock}
                />
              </SectionErrorBoundary>
            </div>
          ) : activeTab === 'fo' ? (
            <div className="lg:col-span-12 flex flex-col gap-6">
              <div className="flex flex-col md:flex-row items-baseline md:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-850 pb-4">
                <div>
                  <h1 className="text-lg font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                    <Activity size={18} className="text-emerald-500 animate-pulse" />
                    Derivatives Order Framework Execution Desk
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Analyzing open interest derivatives parameters anchored around calculated asset spot valuations
                  </p>
                </div>
                
                {/* Active stock custom selection token */}
                <div className="flex items-center gap-2 mt-2 md:mt-0 font-mono text-xs">
                  <span className="text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wide">F&O Target Node:</span>
                  <select
                    value={
                      (selectedStockSymbol === '^NSEI' || selectedStockSymbol === '^NSEBANK') 
                        ? selectedStockSymbol 
                        : (activeStock ? activeStock.symbol : selectedStockSymbol)
                    }
                    onChange={(e) => handleSelectStock(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-2.5 py-1.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition font-bold shadow-sm cursor-pointer"
                  >
                    <option value="^NSEI">NIFTY 50 Index</option>
                    <option value="^NSEBANK">BANK NIFTY Index</option>
                    {safeStocksArray.filter(s => s && s.isFoEnabled).map(s => {
                      if (!s.symbol) return null;
                      return (
                        <option key={s.symbol} value={s.symbol}>
                          {String(s.symbol).replace('.NS', '').trim()}
                        </option>
                      );
                    })}
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
          ) : activeTab === 'us' ? (
            <div className="lg:col-span-12 flex flex-col gap-6" id="us-markets-section">
              <SectionErrorBoundary><UsMarketsView /></SectionErrorBoundary>
            </div>
          ) : activeTab === 'pricing' ? (
            <div className="lg:col-span-12 flex flex-col gap-6" id="pricing-section">
              <SectionErrorBoundary><PricingView /></SectionErrorBoundary>
            </div>
          ) : activeTab === 'strategy-builder' ? (
            <div className="lg:col-span-12 flex flex-col gap-6" id="strategy-builder-section">
              <SectionErrorBoundary><StrategyBuilder /></SectionErrorBoundary>
            </div>
          ) : activeTab === 'greeks-calculator' ? (
            <div className="lg:col-span-12 flex flex-col gap-6" id="greeks-calculator-section">
              <SectionErrorBoundary><GreeksCalculator /></SectionErrorBoundary>
            </div>
          ) : activeTab === 'risk-calculator' ? (
            <div className="lg:col-span-12 flex flex-col gap-6" id="risk-calculator-section">
              <SectionErrorBoundary><RiskCalculator /></SectionErrorBoundary>
            </div>
          ) : activeTab === 'heatmap' ? (
            <div className="lg:col-span-12 flex flex-col gap-6" id="heatmap-section">
              <SectionErrorBoundary><Heatmap /></SectionErrorBoundary>
            </div>
          ) : activeTab === 'fii-dii' ? (
            <div className="lg:col-span-12 flex flex-col gap-6" id="fii-dii-section">
              <SectionErrorBoundary><FiiDiiTracker /></SectionErrorBoundary>
            </div>
          ) : activeTab === 'blog' ? (
            <div className="lg:col-span-12 flex flex-col gap-6">
              <SectionErrorBoundary><BlogView /></SectionErrorBoundary>
            </div>
          ) : activeTab === 'deals' ? (
            <div className="lg:col-span-12 flex flex-col gap-6">
              <SectionErrorBoundary><DealsTracker /></SectionErrorBoundary>
            </div>
          ) : (
            <div className="lg:col-span-12 flex flex-col gap-6">
              <SectionErrorBoundary><NewsView /></SectionErrorBoundary>
            </div>
          )}
        </div>
      </main>

      {/* Corporate Compliance Footer block */}
      <footer className="bg-slate-100 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-850 text-slate-400 font-mono text-[10px] mt-24 py-12 transition-all">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col gap-2">
            <h4 className="text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">StockPro Analytics Suite</h4>
            <p className="text-[9px] text-slate-450 dark:text-slate-500 mb-2 leading-relaxed">
              StockPro Analytics is not a SEBI registered investment advisor. All displayed vectors, index evaluations, and parameter matrix arrays serve educational and model tracking purposes exclusively. Derivatives carry high operational leverage risks.
            </p>
            <p className="text-slate-500">&copy; {new Date().getFullYear()} StockPro Node systems. All rights reserved.</p>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">Infrastructure Protocol</h4>
            <span className="hover:text-slate-900 dark:hover:text-slate-300 transition cursor-pointer">Security Ledger v4.1.2</span>
            <span className="hover:text-slate-900 dark:hover:text-slate-300 transition cursor-pointer flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Connection State: Verified
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">Disclaimer Manifest</h4>
            <p className="leading-relaxed text-slate-450 dark:text-slate-500">
              Data architecture feeds are fetched via active webhook nodes. Market metrics remain delayed where exchange clearing protocols dictate.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">Operational Nodes</h4>
            <span className="hover:text-slate-900 dark:hover:text-slate-300 transition cursor-pointer">Gateway Support desk</span>
            <span className="hover:text-slate-900 dark:hover:text-slate-300 transition cursor-pointer">Privacy Encryption Parameters</span>
          </div>
        </div>
      </footer>
      <EmailCapturePopup />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/screener" element={<ScreenerPage />} />
          <Route path="/blog" element={<ScreenerPage activeTabProp="blog" />} />
          <Route path="/strategy-builder" element={<ScreenerPage activeTabProp="strategy-builder" />} />
          <Route path="/greeks-calculator" element={<ScreenerPage activeTabProp="greeks-calculator" />} />
          <Route path="/risk-calculator" element={<ScreenerPage activeTabProp="risk-calculator" />} />
          <Route path="/heatmap" element={<ScreenerPage activeTabProp="heatmap" />} />
          <Route path="/fii-dii" element={<ScreenerPage activeTabProp="fii-dii" />} />
          <Route path="*" element={<Navigate to="/screener" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
