import React, { useEffect } from 'react';

interface StockChartProps {
  symbol: string;
  name: string;
}

// Helper function to map internal symbols to TradingView format
function getTradingViewSymbol(symbol: string): string {
  // Remove .NS suffix if present
  const cleanSymbol = symbol.replace('.NS', '').toUpperCase();
  
  // Map Indian indices to TradingView format
  if (symbol === '^NSEI' || cleanSymbol === 'NIFTY') {
    return 'NSE:NIFTY';
  }
  if (symbol === '^NSEBANK' || cleanSymbol === 'BANKNIFTY') {
    return 'NSE:BANKNIFTY';
  }
  if (symbol === '^BSESN' || cleanSymbol === 'SENSEX') {
    return 'BOM:SENSEX';
  }
  if (symbol === '^IXIC' || cleanSymbol === 'NASDAQ') {
    return 'NASDAQ:IXIC';
  }
  if (symbol === '^NSEFN' || cleanSymbol === 'FINNIFTY') {
    return 'NSE:FINNIFTY';
  }
  
  // For Indian stocks on NSE, prepend NSE:
  // Check if it's a known Indian stock (has .NS or is in our Indian stock list)
  if (symbol.includes('.NS') || ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'LT', 'ITC', 'HINDUNILVR', 'SBIN', 'BHARTIARTL'].includes(cleanSymbol)) {
    return `NSE:${cleanSymbol}`;
  }
  
  // For BSE stocks (5-digit codes)
  if (/^\d{5,6}$/.test(cleanSymbol)) {
    return `BSE:${cleanSymbol}`;
  }
  
  // For US stocks, they usually work as-is or with exchange prefix
  // Common US exchanges
  if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'].includes(cleanSymbol)) {
    return `NASDAQ:${cleanSymbol}`;
  }
  
  // Default fallback - try NSE first for unknown symbols
  return `NSE:${cleanSymbol}`;
}

export default function StockChart({ symbol, name }: StockChartProps) {
  const tvSymbol = getTradingViewSymbol(symbol);
  
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
      "symbol": tvSymbol,
      "interval": "D",
      "timezone": "Asia/Kolkata",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "allow_symbol_change": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com"
    });
    container.appendChild(script);
  }, [tvSymbol]);

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
