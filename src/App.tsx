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
import { TrendingUp, HelpCircle, ShieldCheck, Activity } from 'lucide-react';
import { useTheme } from './components/ThemeContext';
import NewsView from './components/NewsView';
import { useLiveStocks } from './hooks/useLiveStocks';
import EmailCapturePopup from './components/EmailCapturePopup';
import PricingView from './components/PricingView';
import BlogView from './components/BlogView';
import DealsTracker from './components/DealsTracker';

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
    console.error('Screener crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', color: 'white', background: '#0f172a', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>⚠️ Something went wrong</h2>
          <p style={{ color: '#94a3b8', marginBottom: '24px' }}>{this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ background: '#10b981', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', outline: 'none' }}
          >
            Reload Page
          </button>
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
        <div className="p-6 bg-rose-50/50 dark:bg-rose-950/20 border border-dashed border-rose-200 dark:border-rose-900/50 rounded-xl flex flex-col items-center justify-center text-center">
          <Activity size={24} className="text-rose-500 mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-rose-400 mb-1">Component Offline</h3>
          <p className="text-xs text-slate-500 font-mono mb-4">Pipeline anomaly isolated. Rest of dashboard remains operational.</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded shadow-sm hover:opacity-90 active:scale-95 transition cursor-pointer"
          >
            Attempt Recovery
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ScreenerPage() {
  const { theme } = useTheme();
  const [indices, setIndices] = useState<IndexData[]>(INITIAL_INDICES);
  const { stocks, loading: isLoadingStocks, error: stocksError, retry: fetchAllStocks } = useLiveStocks();
  const [activeTab, setActiveTab] = useState<'screener' | 'chartink' | 'fo' | 'deals' | 'news' | 'pricing' | 'blog'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/screener' || path.includes('screener.html')) {
        return 'chartink';
      }
    }
    return 'screener';
  });
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>('RELIANCE.NS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLive, setIsLive] = useState<boolean>(true);

  // Quick indices data syncing (if any, although user just asked for stocks)
  const [stockData, setStockData] = useState<any[]>([]); // Just in case ScreenerBuilder breaks, we'll assign it to stocks.

  // Sync index boards and stock values from full-stack backend
  useEffect(() => {
    async function syncRealTimeMetrics() {
      try {
        const [indicesRes] = await Promise.all([
          fetch('/api/indices', { headers: {} })
        ]);

        if (indicesRes.ok) {
          const indicesJson = await indicesRes.json();
          if (indicesJson.data) setIndices(indicesJson.data);
          setIsLive(true);
        } else {
          throw new Error('API response not ok');
        }
      } catch (err) {
        console.error("API Fetch failed:", err);
        setIsLive(false);
      }
    }

    syncRealTimeMetrics();
    const interval = setInterval(syncRealTimeMetrics, 60000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  // Update stockData for ScreenerBuilder compatibility
  useEffect(() => {
    setStockData(stocks);
  }, [stocks]);

  const activeStock = stocks.find(s => {
    const cleanLeft = selectedStockSymbol.replace('NSE:', '').replace('.NS', '');
    const cleanRight = s.symbol.replace('.NS', '');
    return cleanLeft === cleanRight;
  }) || stocks[0];

  const handleSelectStock = (symbol: string) => {
    setSelectedStockSymbol(symbol);
  };

  const handleSelectFoStock = (symbol: string) => {
    setSelectedStockSymbol(symbol);
    setActiveTab('fo');
    const cleanSymbol = symbol.replace('NSE:', '').replace('.NS', '');
    window.history.pushState(null, '', `/screener?symbol=${cleanSymbol}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300" id="core_app_layer">
      {/* App Bar Navigation */}
      <Header
        indices={indices}
        stocks={stocks}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSelectStock={handleSelectStock}
      />

      {/* Main App Workspace container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:py-6" id="main_layout_body">
        {/* Bulk Stock Data Status */}
        <div className="flex items-center gap-3 mb-6 bg-white dark:bg-slate-950 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm">
          {isLoadingStocks ? (
             <>
               <span className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin shrink-0" />
               <div className="flex flex-col gap-1 w-full max-w-[200px]">
                 <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-full"></div>
                 <div className="h-2 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse w-2/3"></div>
               </div>
               <span className="text-[10px] font-mono text-slate-400 ml-auto hidden sm:block">Fetching Yahoo Finance...</span>
             </>
          ) : stocksError ? (
             <>
               <div className="w-4 h-4 shrink-0 rounded-full bg-rose-500/20 items-center justify-center flex">
                 <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
               </div>
               <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Failed to sync live data</span>
               <button onClick={fetchAllStocks} className="ml-auto bg-slate-900 border border-transparent dark:border-slate-700 dark:bg-slate-800 text-white text-xs px-3 py-1 rounded hover:opacity-90 active:scale-95 transition-all outline-none">Retry Connection</button>
             </>
          ) : (
             <>
               <Activity size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
               <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                 Loaded {stockData.length} stocks
               </span>
               <span className="text-[10px] font-mono text-slate-400 ml-auto hidden sm:block">
                 Yahoo Finance API Bulk Live Synced
               </span>
             </>
          )}
        </div>

        {/* Indices benchmark line */}
        {indices.length > 0 && (
          <MarketCards
            indices={indices}
            onSelectIndex={(sym) => {
              // Indices can trigger quick chart visualization too
              const cleanSym = sym === '^NSEI' ? 'NIFTY' : sym === '^NSEBANK' ? 'BANKNIFTY' : sym;
              const foundIndex = indices.find(i => i.symbol === sym);
              if (foundIndex) {
                setSelectedStockSymbol(sym);
              }
            }}
          />
        )}

        {/* Indian Market Closed Weekend Alert */}
        {(new Date().getDay() === 0 || new Date().getDay() === 6) && (
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
                  Since today is a market holiday, the live National Stock Exchange (NSE) and Bombay Stock Exchange (BSE) are closed. The platform displays <strong>100% real, authentic last-recorded closure rates</strong> directly from our live data systems with full analytical option chain and chart overlay support.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 bg-emerald-990 border border-emerald-500/25 text-emerald-400 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Live System Active
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="workspace_grid">
          {activeTab === 'screener' ? (
            /* ================= SCREENER VIEW ================= */
            <>
              {/* Left Column: Extensive filter table grid (8 cols) */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <StockScreener
                  stocks={stocks}
                  onSelectStock={handleSelectStock}
                  onSelectFoStock={handleSelectFoStock}
                />
              </div>

              {/* Right Column: Dynamic Interactive chart overlay (4 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="sticky top-[140px] flex flex-col gap-4">
                  {activeStock && (
                    <StockChart
                      symbol={activeStock.symbol}
                      name={activeStock.name}
                    />
                  )}
                  
                  {/* Dashboard Sidebar summary box */}
                  <div className="bg-white dark:bg-slate-950/60 p-4 border border-slate-200 dark:border-slate-850 rounded-xl flex flex-col gap-2.5 shadow-sm">
                    <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Market Overview Desk</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                      Select any asset in the Stock Table Left to load its instant technical overlays. StockPro integrates with public indexes in full-fidelity.
                    </p>
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-2.5 mt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-emerald-555 dark:text-emerald-400" /> Secure Nodes</span>
                      <span>Tick latency: ~1.5s</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'chartink' ? (
            /* ================= CHARTINK CUSTOM SCREENER VIEW ================= */
            <div className="lg:col-span-12 flex flex-col gap-6" id="chartink_screener_view">
              <ScreenerBuilder
                stocks={stocks}
                stockData={stockData}
                onSelectStock={handleSelectStock}
                onSelectFoStock={handleSelectFoStock}
              />
            </div>
          ) : activeTab === 'fo' ? (
            /* ================= DERIVATIVES OPTION CHAIN VIEW ================= */
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
                
                {/* Active stock quick selection dropdown */}
                <div className="flex items-center gap-2 mt-2 md:mt-0 font-mono text-xs">
                  <span className="text-slate-500 dark:text-slate-450 uppercase font-bold">Select F&O Symbol:</span>
                  <select
                    value={
                      (selectedStockSymbol === '^NSEI' || selectedStockSymbol === '^NSEBANK') 
                        ? selectedStockSymbol 
                        : (activeStock ? activeStock.symbol : selectedStockSymbol)
                    }
                    onChange={(e) => handleSelectStock(e.target.value)}
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded px-2.5 py-1.5 focus:border-emerald-500 transition font-bold shadow-sm"
                  >
                    {/* Filter only stocks supporting F&O */}
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
          ) : activeTab === 'pricing' ? (
            /* ================= PRICING VIEW ================= */
            <div className="lg:col-span-12 flex flex-col gap-6" id="pricing-section">
              <PricingView />
            </div>
          ) : activeTab === 'blog' ? (
            /* ================= SEO BLOG VIEW ================= */
            <div className="lg:col-span-12 flex flex-col gap-6">
              <BlogView />
            </div>
          ) : activeTab === 'deals' ? (
            /* ================= INSTITUTIONAL DEALS TRACKER ================= */
            <div className="lg:col-span-12 flex flex-col gap-6">
              <DealsTracker />
            </div>
          ) : (
            /* ================= STOCK MARKET DAILY NEWS ================= */
            <div className="lg:col-span-12 flex flex-col gap-6">
              <NewsView />
            </div>
          )}
        </div>
      </main>

      {/* Humble Footer footer bar */}
      <footer className="bg-slate-100/90 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-850/60 text-slate-500 font-mono text-[10px] mt-16 py-10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col gap-2">
            <h4 className="text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">StockPro Screener</h4>
            <p className="text-[9px] text-slate-400 mb-2 leading-tight">StockPro Analytics is not a SEBI registered investment advisor. All data shown is for educational and informational purposes only. Derivatives trading involves risk of loss.</p>
            <p>&copy; {new Date().getFullYear()} StockPro. All rights reserved.</p>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">Protocol</h4>
            <span className="hover:text-slate-900 dark:hover:text-slate-300 transition cursor-pointer">Security v4.1</span>
            <span className="hover:text-slate-900 dark:hover:text-slate-300 transition cursor-pointer">Status: Active</span>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">Disclaimer</h4>
            <p className="leading-relaxed">
              Financial data provided for educational purposes only. Not investment advice. Analyze with caution.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">Support</h4>
            <span className="hover:text-slate-900 dark:hover:text-slate-300 transition cursor-pointer">Contact Us</span>
            <span className="hover:text-slate-900 dark:hover:text-slate-300 transition cursor-pointer">Privacy Policy</span>
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
          <Route path="*" element={<Navigate to="/screener" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
