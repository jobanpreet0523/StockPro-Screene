import React, { useEffect, useState } from 'react';
import { Search, TrendingUp, Cpu, LayoutDashboard, Landmark, ShieldCheck, Compass, ExternalLink, Sun, Moon, Newspaper } from 'lucide-react';
import { Stock, IndexData } from '../types';
import { useTheme } from './ThemeContext';

interface HeaderProps {
  indices: IndexData[];
  stocks: Stock[];
  activeTab: 'screener' | 'fo' | 'news';
  setActiveTab: (tab: 'screener' | 'fo' | 'news') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSelectStock: (symbol: string) => void;
}

export default function Header({
  indices,
  stocks,
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  onSelectStock
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const [prevPrices, setPrevPrices] = useState<Record<string, number>>({});
  const [flashStates, setFlashStates] = useState<Record<string, 'up' | 'down' | null>>({});
  const [marketStatus, setMarketStatus] = useState<{
    isOpen: boolean;
    statusText: string;
    isWeekend: boolean;
  }>({ isOpen: false, statusText: 'Checking Status...', isWeekend: false });

  // Monitor stock/index exchange session in IST
  useEffect(() => {
    const checkMarketStatus = () => {
      const now = new Date();
      // UTC to IST (+5:30)
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const ist = new Date(utc + (3600000 * 5.5));
      
      const day = ist.getDay(); // 0: Sunday, 6: Saturday
      const hours = ist.getHours();
      const minutes = ist.getMinutes();
      const totalMinutes = hours * 60 + minutes;
      
      const marketOpenMinutes = 9 * 60 + 15;  // 9:15 AM
      const marketCloseMinutes = 15 * 60 + 30; // 3:30 PM
      
      const isWeekend = (day === 0 || day === 6);
      const isWithinHours = totalMinutes >= marketOpenMinutes && totalMinutes < marketCloseMinutes;
      
      if (isWeekend) {
        setMarketStatus({
          isOpen: false,
          statusText: 'Market Closed (Weekend)',
          isWeekend: true
        });
      } else if (!isWithinHours) {
        setMarketStatus({
          isOpen: false,
          statusText: totalMinutes < marketOpenMinutes ? 'Market Closed (Pre-Open)' : 'Market Closed (After Hours)',
          isWeekend: false
        });
      } else {
        setMarketStatus({
          isOpen: true,
          statusText: 'Market Open (Live)',
          isWeekend: false
        });
      }
    };
    
    checkMarketStatus();
    const intervalId = setInterval(checkMarketStatus, 10000);
    return () => clearInterval(intervalId);
  }, []);

  // Detect price changes and trigger green/red visual flashes
  useEffect(() => {
    const newFlashes: Record<string, 'up' | 'down' | null> = {};
    let changed = false;

    stocks.forEach(s => {
      const prev = prevPrices[s.symbol];
      if (prev !== undefined && prev !== s.price) {
        newFlashes[s.symbol] = s.price > prev ? 'up' : 'down';
        changed = true;
      }
    });

    if (changed) {
      setFlashStates(prev => ({ ...prev, ...newFlashes }));
      setPrevPrices(stocks.reduce((acc, s) => ({ ...acc, [s.symbol]: s.price }), {}));
      
      const timer = setTimeout(() => {
        setFlashStates({});
      }, 700);
      return () => clearTimeout(timer);
    } else if (Object.keys(prevPrices).length === 0 && stocks.length > 0) {
      setPrevPrices(stocks.reduce((acc, s) => ({ ...acc, [s.symbol]: s.price }), {}));
    }
  }, [stocks, prevPrices]);

  // Filtering dropdown searches
  const searchResults = stocks.filter(
    s =>
      s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  const formatPrice = (val: number) => {
    return val >= 1000 ? val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : val.toFixed(2);
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white sticky top-0 z-50 shadow-md transition-all duration-300" id="app_header">
      {/* Ticker Marquee Bar */}
      <div className="bg-slate-50 dark:bg-black/40 border-b border-slate-150 dark:border-slate-850 py-1.5 px-4 overflow-hidden text-xs transition-all duration-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex flex-wrap items-center gap-2" title="Simulated data for demonstration">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-amber-600 dark:text-amber-400">
              <span className="w-2 h-2 rounded-full animate-pulse bg-amber-500" />
              DEMO FEED ACTIVE — Connect API for live data
            </div>
            <span className="text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded border leading-none font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25">
              DEMO MODE
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-450 hidden md:inline font-medium">
              — Simulated data for demonstration
            </span>
          </div>
          <div className="flex-1 overflow-hidden ml-6 relative">
            <div className="flex items-center gap-8 animate-marquee whitespace-nowrap min-w-max">
              {[...stocks, ...stocks].map((st, i) => {
                const flash = flashStates[st.symbol];
                const isPositive = st.change >= 0;
                return (
                  <span
                    key={`${st.symbol}-${i}`}
                    onClick={() => {
                      onSelectStock(st.symbol);
                      setSearchTerm('');
                    }}
                    className={`inline-flex items-center gap-1.5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 px-2 py-0.5 rounded transition-all duration-300 ${
                      flash === 'up'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 scale-105 border border-emerald-500/30'
                        : flash === 'down'
                        ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 scale-105 border border-rose-500/30'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-mono font-medium text-[11px] text-slate-900 dark:text-white">
                      {st.symbol.replace('.NS', '')}
                    </span>
                    <span className="font-mono text-xs text-slate-705 dark:text-slate-200">{formatPrice(st.price)}</span>
                    <span className={`text-[10px] font-mono font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {isPositive ? '+' : ''}{st.changePercent}%
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-lg text-slate-950 shadow-inner">
            <TrendingUp size={24} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                Stock<span className="text-emerald-500 dark:text-emerald-400 font-extrabold">Pro</span>
              </span>
              <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40 uppercase">
                Screener
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Advanced F&O & Market Dynamics Engine</p>
          </div>
        </div>

        {/* Global Stock Search */}
        <div className="relative w-full md:w-80" id="search_container">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search stocks by name or symbol..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-900 dark:text-white placeholder-slate-450 dark:placeholder-slate-400 font-medium transition duration-300"
          />
          {showDropdown && searchTerm && (
            <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
              {searchResults.length > 0 ? (
                searchResults.map(s => (
                  <button
                    key={s.symbol}
                    onMouseDown={() => {
                      onSelectStock(s.symbol);
                      setSearchTerm('');
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center justify-between border-b border-slate-100 dark:border-slate-750 last:border-0 transition"
                  >
                    <div>
                      <span className="font-mono text-sm font-bold block text-slate-900 dark:text-white">
                        {s.symbol}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">{s.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-sans text-xs block text-slate-800 dark:text-slate-200">
                        {formatPrice(s.price)}
                      </span>
                      <span className={`text-[10px] font-mono ${s.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {s.change >= 0 ? '+' : ''}{s.changePercent}%
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 text-center font-mono">
                  No matching instruments found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dashboard Tabs, Theme Switcher & Status */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <nav className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-200 dark:border-slate-850" id="main_navigation">
            <button
              onClick={() => setActiveTab('screener')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                activeTab === 'screener'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm dark:shadow border border-slate-200 dark:border-slate-700/45 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard size={14} />
              Screener
            </button>
            <button
              onClick={() => setActiveTab('fo')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-205 cursor-pointer ${
                activeTab === 'fo'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm dark:shadow border border-slate-200 dark:border-slate-700/45 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Cpu size={14} />
              F&O Analytics
            </button>
            <button
              onClick={() => setActiveTab('news')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-205 cursor-pointer ${
                activeTab === 'news'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm dark:shadow border border-slate-200 dark:border-slate-700/45 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Newspaper size={14} />
              STOCK MARKET DAILY NEWS
            </button>
          </nav>

          {/* Premium Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 rounded-lg border cursor-pointer hover:scale-105 active:scale-95 transition-all text-slate-600 dark:text-amber-400 hover:text-slate-900 dark:hover:text-yellow-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-750 shadow-sm"
            title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
            id="theme_toggle_btn"
          >
            {theme === 'light' ? (
              <Moon size={15} className="text-slate-600" />
            ) : (
              <Sun size={15} className="text-amber-400 fill-amber-300" />
            )}
          </button>

          {/* Premium Light-mode Landing Page jump button */}
          <a
            href="/landing"
            title="Open Crisp Light Mode Landing Page"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-extrabold tracking-wide bg-blue-600 hover:bg-blue-700 text-white shadow shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Compass size={14} />
            <span>F&O Landing (Light)</span>
            <ExternalLink size={11} className="opacity-80" />
          </a>

          <div className="hidden lg:flex items-center gap-2 py-1.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck size={13} />
            Secure API
          </div>
        </div>
      </div>
      
      {/* Visual Ticker Keyframe Styles */}
      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee 25s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        .bg-slate-750 {
          background-color: #212d4a;
        }
      `}</style>
    </header>
  );
}
