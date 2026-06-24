import React, { useEffect, useState } from 'react';
import { Activity, Search, TrendingUp, Cpu, LayoutDashboard, Landmark, Compass, ExternalLink, Sun, Moon, Newspaper, LogIn, LogOut, BookOpen, SlidersHorizontal, ChevronDown, FolderHeart, Globe, Settings2, Calculator, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Stock, IndexData } from '../types';
import { useTheme } from './ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getMarketStatus } from '../utils/marketStatus';

interface HeaderProps {
  indices: IndexData[];
  stocks: Stock[];
  activeTab: 'screener' | 'chartink' | 'fo' | 'deals' | 'news' | 'blog' | 'us' | 'strategy-builder' | 'greeks-calculator' | 'risk-calculator' | 'heatmap' | 'fii-dii' | 'signals';
  setActiveTab: (tab: 'screener' | 'chartink' | 'fo' | 'deals' | 'news' | 'blog' | 'us' | 'strategy-builder' | 'greeks-calculator' | 'risk-calculator' | 'heatmap' | 'fii-dii' | 'signals') => void;
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
  const { user, loginWithGoogle, logout } = useAuth();
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
      const timer = setTimeout(() => setFlashStates({}), 700);
      return () => clearTimeout(timer);
    } else if (Object.keys(prevPrices).length === 0 && (stocks.length > 0 || indices.length > 0)) {
      const currentPrices: Record<string, number> = {};
      stocks.forEach(s => { currentPrices[s.symbol] = s.price; });
      indices.forEach(idx => { currentPrices[idx.symbol] = idx.price; });
      setPrevPrices(currentPrices);
    }
  }, [stocks, indices, prevPrices]);

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
      <div className="bg-slate-50 dark:bg-black/40 border-b border-slate-150 dark:border-slate-850 py-1.5 px-4 overflow-x-auto sm:overflow-hidden text-[11px] sm:text-xs transition-all duration-300">
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-4 sm:flex-row sm:items-center sm:gap-1.5 whitespace-nowrap">
          <div className="flex items-center gap-2">
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
                      flash === 'up' ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 scale-105 border border-emerald-500/30' : flash === 'down' ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 scale-105 border border-rose-500/30' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-mono font-medium text-[11px] text-slate-900 dark:text-white">{st.name}</span>
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

      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
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
                      <span className="font-mono text-sm font-bold block text-slate-900 dark:text-white">{s.symbol}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">{s.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-sans text-xs block text-slate-800 dark:text-slate-200">{formatPrice(s.price)}</span>
                      <span className={`text-[10px] font-mono ${s.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {s.change >= 0 ? '+' : ''}{s.changePercent}%
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 text-center font-mono">No matching instruments found</div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <nav className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 overflow-x-auto" id="main_navigation">
            {[
              { id: 'screener', icon: <LayoutDashboard size={14} />, label: 'Screener' },
              { id: 'chartink', icon: <SlidersHorizontal size={14} />, label: 'Scanner' },
              { id: 'fo', icon: <Cpu size={14} />, label: 'F&O' },
              { id: 'us', icon: <Globe size={14} className="text-blue-500" />, label: 'US' },
              { id: 'strategy-builder', icon: <Settings2 size={14} className="text-emerald-500" />, label: 'Builder' },
              { id: 'greeks-calculator', icon: <Calculator size={14} className="text-purple-500" />, label: 'Greeks' },
              { id: 'risk-calculator', icon: <Activity size={14} className="text-indigo-500" />, label: 'Risk' },
              { id: 'heatmap', icon: <LayoutDashboard size={14} className="text-emerald-500" />, label: 'Heatmap' },
              { id: 'fii-dii', icon: <Globe size={14} className="text-indigo-500" />, label: 'FII/DII' },
              { id: 'signals', icon: <Zap size={14} className="text-emerald-500" />, label: 'Signals' },
              { id: 'deals', icon: <Landmark size={14} className="text-emerald-500" />, label: 'Deals' },
              { id: 'news', icon: <Newspaper size={14} />, label: 'News' },
              { id: 'blog', icon: <BookOpen size={14} />, label: 'Blog' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700/45'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}

            <div className="relative">
              <button
                onMouseEnter={() => setShowScannersDropdown(true)}
                onClick={() => setShowScannersDropdown(prev => !prev)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-bold text-slate-500 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white"
              >
                <FolderHeart size={14} className="text-emerald-500" />
                <ChevronDown size={10} className="opacity-70" />
              </button>
              {showScannersDropdown && (
                <div onMouseLeave={() => setShowScannersDropdown(false)} className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1.5 z-[100] animate-fadeIn">
                  <div className="px-3 py-1 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Saved Scanners</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {Object.keys(savedScannersList).length > 0 ? Object.entries(savedScannersList).map(([name, item]) => (
                      <button
                        key={name}
                        onClick={() => {
                          const encoded = ((item as any).conditions || []).map((cond: any) => {
                            const ind = cond.indicator === 'change%' ? 'change' : cond.indicator;
                            if (cond.condition === 'Within 2%') return `${ind}`;
                            const op = cond.condition === 'Greater than' ? '>' : '<';
                            return `${ind}${op}${cond.value}`;
                          }).join('|');
                          setShowScannersDropdown(false);
                          navigate(`/scanner?c=${encodeURIComponent(encoded)}`);
                          window.dispatchEvent(new Event('stockpro_scanners_updated'));
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 hover:text-slate-950 dark:hover:text-white transition flex items-center justify-between group"
                      >
                        <span className="truncate pr-2">{name}</span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 italic font-mono uppercase group-hover:text-emerald-500">Run</span>
                      </button>
                    )) : <div className="px-3 py-4 text-center text-[10px] text-slate-400">No saved scanners</div>}
                  </div>
                </div>
              )}
            </div>
          </nav>

          <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 rounded-lg border cursor-pointer hover:scale-105 transition-all text-slate-600 dark:text-amber-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-750 shadow-sm"
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} className="fill-amber-300" />}
          </button>

          <a href="/landing" className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow shadow-blue-500/10 active:scale-[0.98] transition-all">
            <Compass size={14} />
            <span>F&O Landing</span>
          </a>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 pr-3 shadow-sm">
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="avatar" className="w-6 h-6 rounded-md" />
                <button onClick={logout} className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-600 transition" title="Log Out">
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <button onClick={loginWithGoogle} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition">
                <LogIn size={15} />
                Login
              </button>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes marquee { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-50%, 0, 0); } }
        .animate-marquee { display: inline-flex; animation: marquee 25s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
      `}</style>
    </header>
  );
}
