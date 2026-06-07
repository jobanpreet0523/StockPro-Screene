import React, { useEffect, useState } from 'react';
import { Search, TrendingUp, Cpu, LayoutDashboard, Landmark, ShieldCheck } from 'lucide-react';
import { Stock, IndexData } from '../types';

interface HeaderProps {
  indices: IndexData[];
  stocks: Stock[];
  activeTab: 'screener' | 'fo';
  setActiveTab: (tab: 'screener' | 'fo') => void;
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [prevPrices, setPrevPrices] = useState<Record<string, number>>({});
  const [flashStates, setFlashStates] = useState<Record<string, 'up' | 'down' | null>>({});

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
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md" id="app_header">
      {/* Ticker Marquee Bar */}
      <div className="bg-black/40 border-b border-slate-850 py-1.5 px-4 overflow-hidden text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold uppercase tracking-wider text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Feed
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
                    className={`inline-flex items-center gap-1.5 cursor-pointer hover:bg-slate-800 px-2 py-0.5 rounded transition-all duration-300 ${
                      flash === 'up'
                        ? 'bg-emerald-950/80 text-emerald-300 scale-105 border border-emerald-500/30'
                        : flash === 'down'
                        ? 'bg-rose-950/80 text-rose-300 scale-105 border border-rose-500/30'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="font-mono font-medium text-[11px] text-white">
                      {st.symbol.replace('.NS', '')}
                    </span>
                    <span className="font-mono text-xs">{formatPrice(st.price)}</span>
                    <span className={`text-[10px] font-mono font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
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
              <span className="font-sans font-extrabold text-lg tracking-tight text-white">
                Stock<span className="text-emerald-400">Pro</span>
              </span>
              <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-800/40 uppercase">
                Screener
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Advanced F&O & Market Dynamics Engine</p>
          </div>
        </div>

        {/* Global Stock Search */}
        <div className="relative w-full md:w-80" id="search_container">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
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
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white placeholder-slate-400 font-medium transition"
          />
          {showDropdown && searchTerm && (
            <div className="absolute left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
              {searchResults.length > 0 ? (
                searchResults.map(s => (
                  <button
                    key={s.symbol}
                    onMouseDown={() => {
                      onSelectStock(s.symbol);
                      setSearchTerm('');
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-750 flex items-center justify-between border-b border-slate-750 last:border-0 transition"
                  >
                    <div>
                      <span className="font-mono text-sm font-bold block text-white">
                        {s.symbol}
                      </span>
                      <span className="text-xs text-slate-400 block">{s.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-sans text-xs block text-slate-200">
                        {formatPrice(s.price)}
                      </span>
                      <span className={`text-[10px] font-mono ${s.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {s.change >= 0 ? '+' : ''}{s.changePercent}%
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-slate-400 text-center font-mono">
                  No matching instruments found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dashboard Tabs & Status */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <nav className="flex bg-slate-950 p-1.5 rounded-lg border border-slate-800/50" id="main_navigation">
            <button
              onClick={() => setActiveTab('screener')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-200 ${
                activeTab === 'screener'
                  ? 'bg-slate-800 text-white shadow shadow-black/80 font-bold border border-slate-700/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard size={14} />
              Screener
            </button>
            <button
              onClick={() => setActiveTab('fo')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-205 ${
                activeTab === 'fo'
                  ? 'bg-slate-800 text-white shadow shadow-black/80 font-bold border border-slate-700/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu size={14} />
              F&O Analytics
            </button>
          </nav>

          <div className="hidden lg:flex items-center gap-2 py-1.5 px-3 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-[11px] text-emerald-400 font-medium">
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
