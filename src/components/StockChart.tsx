import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeContext';
import { TrendingUp, Clock } from 'lucide-react';
import { getTVSymbol } from '../utils/tradingView';

interface StockChartProps {
  symbol: string;
  name: string;
}

const INTERVALS = [
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '1H', value: '60' },
  { label: 'D', value: 'D' },
  { label: 'W', value: 'W' },
];

export default function StockChart({ symbol, name }: StockChartProps) {
  const { theme } = useTheme();
  const [interval, setIntervalVal] = useState<string>('D');

  const mappedSymbol = React.useMemo(() => {
    let target = symbol || 'RELIANCE';
    
    // Clean up symbol to get the core symbol name
    let cleanSymbol = target;
    if (cleanSymbol.includes(':')) {
      cleanSymbol = cleanSymbol.split(':')[1];
    }
    if (cleanSymbol.endsWith('.NS')) {
      cleanSymbol = cleanSymbol.replace('.NS', '');
    }
    if (cleanSymbol.endsWith('.BO')) {
      cleanSymbol = cleanSymbol.replace('.BO', '');
    }
    
    // Check if it matches index symbols or US indexes
    if (target === '^NSEI' || cleanSymbol === 'NIFTY') return 'NSE:NIFTY';
    if (target === '^NSEBANK' || cleanSymbol === 'BANKNIFTY') return 'NSE:BANKNIFTY';
    if (target === '^BSESN' || cleanSymbol === 'SENSEX') return 'BSE:SENSEX';
    if (target === '^IXIC') return 'NASDAQ:IXIC';
    
    return getTVSymbol(cleanSymbol);
  }, [symbol]);

  const iframeSrc = React.useMemo(() => {
    const params = new URLSearchParams({
      symbol: mappedSymbol,
      interval: interval,
      theme: theme === 'dark' ? 'dark' : 'light',
      style: '1', // 1 indicates candle representation
      timezone: 'Asia/Kolkata',
      locale: 'en',
      enable_publishing: 'false',
      hide_side_toolbar: 'false',
      allow_symbol_change: 'true',
    });
    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [mappedSymbol, interval, theme]);

  return (
    <div className="bg-white dark:bg-slate-950 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl mb-6 flex flex-col transition-all duration-300" id="chart_section">
      {/* Chart Headers and controls */}
      <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-850">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold font-mono tracking-tight text-slate-900 dark:text-white bg-slate-105 dark:bg-slate-900/60 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
              {mappedSymbol}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[180px] sm:max-w-[220px]" title={name}>
              {name}
            </span>
          </div>
        </div>

        {/* Dynamic Interval toggles */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800/80">
          <Clock size={11} className="text-slate-400 ml-1.5 mr-0.5" />
          {INTERVALS.map((item) => (
            <button
              key={item.value}
              onClick={() => setIntervalVal(item.value)}
              className={`text-[10px] font-bold font-mono px-2 py-1 rounded transition duration-150 cursor-pointer ${
                interval === item.value
                  ? 'bg-indigo-650 dark:bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* TradingView Container - Embed direct iframe */}
      <div className="w-full h-[500px] rounded-lg overflow-hidden border border-slate-250 dark:border-slate-850 bg-slate-50 dark:bg-slate-900" id="tradingview-widget-container">
        <iframe
          key={iframeSrc}
          src={iframeSrc}
          title={`TradingView chart for ${mappedSymbol}`}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}
