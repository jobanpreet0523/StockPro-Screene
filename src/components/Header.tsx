import React, { useEffect, useState } from 'react';
import { Search, TrendingUp, LayoutDashboard, ChevronDown, Sun, Moon, LogIn, LogOut, ExternalLink, Zap, Newspaper, Flame, SlidersHorizontal, ShieldCheck, Cpu } from 'lucide-react';
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

type Tab = HeaderProps['activeTab'];

const toolTabs: Array<{ tab: Tab; label: string; icon: React.ElementType }> = [
  { tab: 'fo', label: 'Option Chain', icon: Cpu },
  { tab: 'signals', label: 'Signals', icon: Zap },
  { tab: 'chartink', label: 'Scanner', icon: SlidersHorizontal },
  { tab: 'heatmap', label: 'Heatmap', icon: Flame },
  { tab: 'news', label: 'News', icon: Newspaper },
  { tab: 'pricing', label: 'Pricing', icon: ShieldCheck },
];

export default function Header({ indices, stocks, activeTab, setActiveTab, searchTerm, setSearchTerm, onSelectStock }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, loginWithGoogle, logout } = useAuth();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [marketStatus, setMarketStatus] = useState(() => getMarketStatus());

  useEffect(() => {
    const interval = setInterval(() => setMarketStatus(getMarketStatus()), 30000);
    return () => clearInterval(interval);
  }, []);

  const searchResults = stocks.filter((s) =>
    s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  const formatPrice = (val: number) => {
    const v = val ?? 0;
    return v >= 1000 ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Number(v || 0).toFixed(2);
  };

  const selectTab = (tab: Tab) => {
    setActiveTab(tab);
    setShowTools(false);
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white sticky top-0 z-50 shadow-md transition-all duration-300" id="app_header">
      <div className="bg-slate-50 dark:bg-black/40 border-b border-slate-150 dark:border-slate-850 py-1.5 px-4 overflow-hidden text-[11px] sm:text-xs transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center gap-4 whitespace-nowrap">
          <div className="flex items-center gap-2 shrink-0" title="Free public mode uses 15-minute delayed market data.">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]" style={{ color: marketStatus.color }}>
              <span className={`w-2 h-2 rounded-full ${marketStatus.isOpen ? 'animate-pulse' : ''}`} style={{ backgroundColor: marketStatus.color }} />
              {marketStatus.label}
            </div>
            <span className="text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded border leading-none font-mono" style={{ color: marketStatus.color, borderColor: `${marketStatus.color}40`, backgroundColor: `${marketStatus.color}15` }}>
              15-MIN DELAY
            </span>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <div className="flex items-center gap-8 animate-marquee whitespace-nowrap min-w-max">
              {[...indices, ...indices].map((item, i) => {
                const isPositive = item.change >= 0;
                return (
                  <span key={`${item.symbol}-${i}`} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                    <span className="font-mono font-medium text-[11px] text-slate-900 dark:text-white">{item.name}</span>
                    <span className="font-mono text-xs text-slate-700 dark:text-slate-200">{formatPrice(item.price)}</span>
                    <span className={`text-[10px] font-mono font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{isPositive ? '+' : ''}{item.changePercent}%</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-emerald-500 p-2 rounded-lg text-slate-950 shadow-inner"><TrendingUp size={24} className="stroke-[2.5]" /></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">Stock<span className="text-emerald-500 dark:text-emerald-400 font-extrabold">Pro</span></span>
              <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40 uppercase">Screener</span>
            </div>
            {user ? <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Welcome back, {user.displayName?.split(' ')[0]}</p> : <p className="text-[10px] text-slate-500 dark:text-slate-400">15-minute delayed analytics</p>}
          </div>
        </div>

        <div className="relative w-full lg:max-w-md" id="search_container">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-400"><Search size={16} /></div>
          <input
            type="text"
            placeholder="Search stocks by name or symbol..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setShowSearch(true); }}
            onFocus={() => setShowSearch(true)}
            onBlur={() => setTimeout(() => setShowSearch(false), 200)}
            className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-900 dark:text-white placeholder-slate-450 dark:placeholder-slate-400 font-medium transition duration-300"
          />
          {showSearch && searchTerm && (
            <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
              {searchResults.length > 0 ? searchResults.map((s) => (
                <button key={s.symbol} onMouseDown={() => { onSelectStock(s.symbol); setSearchTerm(''); setShowSearch(false); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center justify-between border-b border-slate-100 dark:border-slate-750 last:border-0 transition">
                  <div><span className="font-mono text-sm font-bold block text-slate-900 dark:text-white">{s.symbol}</span><span className="text-xs text-slate-500 dark:text-slate-400 block">{s.name}</span></div>
                  <span className="font-sans text-xs text-slate-800 dark:text-slate-200">{formatPrice(s.price)}</span>
                </button>
              )) : <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 text-center font-mono">No matching instruments found</div>}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => selectTab('screener')} className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'screener' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700' : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-300'}`}>
            <LayoutDashboard size={14} /> Screener
          </button>

          <div className="relative">
            <button onClick={() => setShowTools((value) => !value)} className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
              Tools <ChevronDown size={12} />
            </button>
            {showTools && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-950 z-[60]">
                {toolTabs.map(({ tab, label, icon: Icon }) => (
                  <button key={tab} onClick={() => selectTab(tab)} className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold transition ${activeTab === tab ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'}`}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => navigate('/connect-broker')} className="hidden sm:flex bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition items-center gap-1.5 shadow-sm"><LogIn size={13} /> Setup</button>
          <button onClick={toggleTheme} className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition" aria-label="Toggle theme">{theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}</button>
          <button onClick={() => navigate('/')} className="hidden xl:flex bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition items-center gap-1.5 shadow-sm">Landing <ExternalLink size={12} /></button>
          {user ? <button onClick={logout} className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5"><LogOut size={13} /> Logout</button> : <button onClick={loginWithGoogle} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"><LogIn size={13} /> Login</button>}
        </div>
      </div>
    </header>
  );
}
