import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MarketCards from './components/MarketCards';
import StockScreener from './components/StockScreener';
import ScreenerBuilder from './components/ScreenerBuilder';
import StockChart from './components/StockChart';
import OptionChainView from './components/OptionChainView';
import { Stock, IndexData } from './types';
import { INITIAL_INDICES, INITIAL_STOCKS } from './data';
import { TrendingUp, HelpCircle, ShieldCheck, Activity } from 'lucide-react';
import { useTheme } from './components/ThemeContext';
import NewsView from './components/NewsView';
import EmailCapturePopup from './components/EmailCapturePopup';
import PricingView from './components/PricingView';
import BlogView from './components/BlogView';

export default function App() {
  const { theme } = useTheme();
  const [indices, setIndices] = useState<IndexData[]>(INITIAL_INDICES);
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS);
  const [activeTab, setActiveTab] = useState<'screener' | 'chartink' | 'fo' | 'news' | 'pricing' | 'blog'>(() => {
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

  // Yahoo API bulk loading state
  const [stockData, setStockData] = useState<any[]>([]);
  const [isLoadingStocks, setIsLoadingStocks] = useState<boolean>(true);

  // Sync index boards and stock values from full-stack backend

  useEffect(() => {
    async function syncRealTimeMetrics() {
      try {
        const [indicesRes, stocksRes] = await Promise.all([
          fetch('/api/indices', { headers: {} }),
          fetch('/api/stocks', { headers: {} })
        ]);

        if (indicesRes.ok && stocksRes.ok) {
          const indicesJson = await indicesRes.json();
          const stocksJson = await stocksRes.json();
          
          if (indicesJson.data) setIndices(indicesJson.data);
          if (stocksJson.data) setStocks(stocksJson.data);
          
          setIsLive(true);
        } else {
          throw new Error('API response not ok');
        }
      } catch (err) {
        console.error("API Fetch failed:", err);
        setIsLive(false);
        // Retain existing state to prevent disruption on minor network blips
      }
    }

    // Run first sync immediately
    syncRealTimeMetrics();

    // High frequency pulling interval corresponding to Express background ticks (1.5s)
    const interval = setInterval(syncRealTimeMetrics, 1500);
    return () => clearInterval(interval);
  }, []);

  // Fetch real NSE bulk stock data via proxy using Yahoo batch API
  const fetchAllStocks = async () => {
    setIsLoadingStocks(true);
    const symbols = "TCS.NS,INFY.NS,RELIANCE.NS,HDFCBANK.NS,ICICIBANK.NS,WIPRO.NS,AXISBANK.NS,KOTAKBANK.NS,LT.NS,BAJFINANCE.NS,MARUTI.NS,ASIANPAINT.NS,HINDUNILVR.NS,TITAN.NS,ULTRACEMCO.NS,NESTLEIND.NS,TECHM.NS,SUNPHARMA.NS,DRREDDY.NS,ONGC.NS,NTPC.NS,POWERGRID.NS,COALINDIA.NS,JSWSTEEL.NS,TATASTEEL.NS,TATAMOTORS.NS,BAJAJFINSV.NS,SBILIFE.NS,HDFCLIFE.NS,ADANIENT.NS,ADANIPORTS.NS,DIVISLAB.NS,CIPLA.NS,EICHERMOT.NS,HEROMOTOCO.NS,BRITANNIA.NS,GRASIM.NS,HINDALCO.NS,INDUSINDBK.NS,M%26M.NS,BPCL.NS,IOC.NS,SHREECEM.NS,TATACONSUM.NS,UPL.NS,VEDL.NS,APOLLOHOSP.NS,BAJAJ-AUTO.NS,SBIN.NS,ITC.NS";
    
    try {
      const res = await fetch(`/api/yahoo-batch?symbols=${symbols}`);
      if (!res.ok) throw new Error('Yahoo proxy batch network response error');
      const data = await res.json();
      
      const mappedData = data.map((item: any) => ({
        symbol: item.symbol,
        shortName: item.shortName,
        regularMarketPrice: item.regularMarketPrice,
        regularMarketChangePercent: item.regularMarketChangePercent,
        regularMarketVolume: item.regularMarketVolume,
        marketCap: item.marketCap,
        trailingPE: item.trailingPE,
        fiftyTwoWeekHigh: item.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: item.fiftyTwoWeekLow
      }));
      setStockData(mappedData);
    } catch(err) {
      console.error('Error fetching Yahoo Finance bulk data:', err);
    } finally {
      setIsLoadingStocks(false);
    }
  };

  useEffect(() => {
    fetchAllStocks();
    const interval = setInterval(fetchAllStocks, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

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
               <span className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider">Fetching live NSE stock data from Yahoo Finance...</span>
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
                <OptionChainView
                  symbol={activeStock.symbol}
                />
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
