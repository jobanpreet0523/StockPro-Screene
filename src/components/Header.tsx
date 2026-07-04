import React, { useEffect, useState } from 'react';
import { Search, TrendingUp, Cpu, LayoutDashboard, Landmark, ShieldCheck, Compass, ExternalLink, Sun, Moon, Newspaper, LogIn, LogOut, BookOpen, SlidersHorizontal, ChevronDown, FolderHeart, Globe, Settings2, Calculator, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Stock, IndexData } from '../types';
import { useTheme } from './ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getMarketStatus } from '../utils/marketStatus';

interface HeaderProps {
  indices: IndexData[];
  stocks: Stock[];
  activeTab: 'screener' | 'chartink' | 'fo' | 'deals' | 'news' | 'pricing' | 'blog' | 'us' | 'strategy-builder' | 'greeks-calculator' | 'risk-calculator' | 'heatmap' | 'fii-dii' | 'signals';
  setActiveTab: (tab: 'screener' | 'chartink' | 'fo' | 'deals' | 'news' | 'pricing' | 'blog' | 'us' | 'strategy-builder' | 'greeks-calculator' | 'risk-calculator' | 'heatmap' | 'fii-dii' | 'signals') => void;
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
  const { user, loginWithGoogle, logout, isPro } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [prevPrices, setPrevPrices] = useState<Record<string, number>>({});
  const [flashStates, setFlashStates] = useState<Record<string, 'up' | 'down' | null>>({});
  const [marketStatus, setMarketStatus] = useState(() => getMarketStatus());
  const [savedScannersList, setSavedScannersList] = useState<Record<string, { conditions: any[]; createdAt: string }>>({});
  const [showScannersDropdown, setShowScannersDropdown] = useState(false);

  useEffect(() => {
    const loadScanners = () => {
      try {
        const stored = localStorage.getItem('savedScanners');
        setSavedScannersList(stored ? JSON.parse(stored) : {});
      } catch (e) {}
    };
    loadScanners();
    window.addEventListener('stockpro_scanners_updated', loadScanners);
    window.addEventListener('storage', loadScanners);
    return () => {
      window.removeEventListener('stockpro_scanners_updated', loadScanners);
      window.removeEventListener('storage', loadScanners);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMarketStatus(getMarketStatus());
    }, 30000);
    return () => clearInterval(interval);
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

    indices.forEach(idx => {
      const prev = prevPrices[idx.symbol];
      if (prev !== undefined && prev !== idx.price) {
        newFlashes[idx.symbol] = idx.price > prev ? 'up' : 'down';
        changed = true;
      }
    });

    if (changed) {
      setFlashStates(prev => ({ ...prev, ...newFlashes }));

      const currentPrices: Record<string, number> = {};
      stocks.forEach(s => { currentPrices[s.symbol] = s.price; });
      indices.forEach(idx => { currentPrices[idx.symbol] = idx.price; });

      setPrevPrices(currentPrices);

      const timer = setTimeout(() => {
        setFlashStates({});
      }, 700);
      return () => clearTimeout(timer);
    } else if (Object.keys(prevPrices).length === 0 && (stocks.length > 0 || indices.length > 0)) {
      const currentPrices: Record<string, number> = {};
      stocks.forEach(s => { currentPrices[s.symbol] = s.price; });
      indices.forEach(idx => { currentPrices[idx.symbol] = idx.price; });
      setPrevPrices(currentPrices);
    }
  }, [stocks, prevPrices]);

  // Filtering dropdown searches
  const searchResults = stocks.filter(
    s =>
      s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  const formatPrice = (val: number) => {
    const v = val ?? 0;
    return v >= 1000 ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (typeof v === 'number' ? v.toFixed(2) : Number(v || 0).toFixed(2));
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white sticky top-0 z-50 shadow-md transition-all duration-300" id="app_header">
      {/* Ticker Marquee Bar */}
      <div className="bg-slate-50 dark:bg-black/40 border-b border-slate-150 dark:border-slate-850 py-1.5 px-4 overflow-x-auto sm:overflow-hidden text-[11px] sm:text-xs transition-all duration-300">
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-4 sm:flex-row sm:items-center sm:gap-1.5 whitespace-nowrap">
          <div className="flex items-center gap-2" title="Live data fetched from Yahoo Finance">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]" style={{ color: marketStatus.color }}>
              <span className={`w-2 h-2 rounded-full ${marketStatus.isOpen ? 'animate-pulse' : ''}`} style={{ backgroundColor: marketStatus.color }} />
              {marketStatus.label}
            </div>
            <span className="text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded border leading-none font-mono" style={{ color: marketStatus.color, borderColor: `${marketStatus.color}40`, backgroundColor: `${marketStatus.color}15` }}>
              YAHOO
            </span>
          </div>
          <div className="flex-1 overflow-hidden ml-6 relative">
            <div className="flex items-center gap-8 animate-marquee whitespace-nowrap min-w-max">
              {[...indices, ...indices].map((st, i) => {
                const flash = flashStates[st.symbol];
                const isPositive = st.change >= 0;
                return (
                  <span
                    key={`${st.symbol}-${i}`}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded transition-all duration-300 ${
                      flash === 'up'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 scale-105 border border-emerald-500/30'
                        : flash === 'down'
                        ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 scale-105 border border-rose-500/30'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-mono font-medium text-[11px] text-slate-900 dark:text-white">
                      {st.name}
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
            {user ? (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Welcome back, {user.displayName?.split(' ')[0]}</p>
            ) : (
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Advanced F&O & Market Dynamics Engine</p>
            )}
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
              onClick={() => setActiveTab('chartink')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                activeTab === 'chartink'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm dark:shadow border border-slate-200 dark:border-slate-700/45 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <SlidersHorizontal size={14} />
              Doji Scanner
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
              onClick={() => setActiveTab('us')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-205 cursor-pointer ${
                activeTab === 'us'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm dark:shadow border border-slate-200 dark:border-slate-700/45 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe size={14} className="text-blue-500" />
              US Markets
            </button>
            <button
              onClick={() => setActiveTab('strategy-builder')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-205 cursor-pointer ${
                activeTab === 'strategy-builder'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm dark:shadow border border-slate-200 dark:border-slate-700/45 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings2 size={14} className="text-emerald-500" />
              Strategy Builder
            </button>
            <button
              onClick={() => setActiveTab('greeks-calculator')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-205 cursor-pointer ${
                activeTab === 'greeks-calculator'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm dark:shadow border border-slate-200 dark:border-slate-700/45 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calculator size={14} className="text-purple-500" />
              Options Greeks
            </button>
            <button
              onClick={() => setActiveTab('risk-calculator')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-205 cursor-pointer ${
                activeTab === 'risk-calculator'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm dark:shadow border border-slate-200 dark:border-slate-700/45 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck size={14} className="text-indigo-500" />
              Risk Calc
            </button>
            <button
              onClick={() => setActiveTab('heatmap')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-205 cursor-pointer ${
                activeTab === 'heatmap'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm dark:shadow border border-slate-200 dark:border-slate-700/45 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard size={14} className="text-emerald-500" />
              Heatmap
            </button>
            <button onClick={() => setActiveTab('fii-dii')} className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-205 cursor-pointer ${activeTab === 'fii-dii' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm dark:shadow border border-slate-200 dark:border-slate-700/45 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><Globe size={14} className="text-indigo-500" /> FII/DII Data</button>
            <button onClick={() => setActiveTab('signals')} className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-205 cursor-pointer ${activeTab === 'signals' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm dark:shadow border border-slate-200 dark:border-slate-700/45 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><Zap size={14} className="text-emerald-500" /> Signals</button>
            <button onClick={() => setActiveTab('deals')} className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-205 cursor-pointer ${activeTab === 'deals' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm dark:shadow border border-slate-200 dark:border-slate-700/45 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><Landmark size={14} className="text-emerald-500" /> Bulk & Block Deals</button>
            <button onClick={() => setActiveTab('news')} className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-205 cursor-pointer ${activeTab === 'news' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm dark:shadow border border-slate-200 dark:border-slate-700/45 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><Newspaper size={14} className="text-slate-500" /> STOCK MARKET DAILY NEWS</button>
            <button onClick={() => setActiveTab('pricing')} className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-205 cursor-pointer ${activeTab === 'pricing' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm dark:shadow border border-slate-200 dark:border-slate-700/45 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Pricing</button>
            <button onClick={() => setActiveTab('blog')} className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-205 cursor-pointer ${activeTab === 'blog' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm dark:shadow border border-slate-200 dark:border-slate-700/45 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><BookOpen size={14} className="text-slate-500" /> F&O Strategic Blog</button>
            <div className="relative">
              <button onClick={() => setShowScannersDropdown(!showScannersDropdown)} className="flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-205 cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <FolderHeart size={14} className="text-emerald-500" /> My Scanners <ChevronDown size={12} />
              </button>
            </div>
          </nav>

          <button
            onClick={toggleTheme}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
          </button>

          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            F&O Landing (Light) <ExternalLink size={12} />
          </button>

          <button
            onClick={() => setShowApiModal(true)}
            className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <ShieldCheck size={14} /> Secure API
          </button>

          {user ? (
            <button onClick={logout} className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition" title="Logout">
              <LogOut size={16} />
            </button>
          ) : (
            <button onClick={loginWithGoogle} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition" title="Login with Google">
              <LogIn size={16} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
