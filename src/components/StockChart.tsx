import React, { useEffect } from 'react';

interface StockChartProps {
  symbol: string;
  name: string;
}

export default function StockChart({ symbol, name }: StockChartProps) {
  useEffect(() => {
    const container = document.getElementById('tradingview-widget-container');
    if (!container) return;
    
    // Clear previous
    container.innerHTML = '';
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": symbol,
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "allow_symbol_change": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com"
    });
    container.appendChild(script);
  }, [symbol]);

  return (
    <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl mb-6 flex flex-col" id="chart_section">
      {/* Chart Headers and controls */}
      <div className="flex flex-col md:flex-row items-baseline md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-850">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold font-mono tracking-tight text-white">{symbol}</span>
            <span className="text-xs text-slate-400 font-medium truncate max-w-[200px]">{name}</span>
          </div>
        </div>
      </div>

      {/* TradingView Container */}
      <div className="w-full h-[500px]" id="tradingview-widget-container"></div>
    </div>
  );
}
