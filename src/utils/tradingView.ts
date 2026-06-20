// TradingView symbol mapping. TradingView expects ticker symbols (e.g. NSE:RELIANCE),
// not numeric BSE scrip codes, so Indian stocks use the NSE: prefix; known US tickers
// fall back to NASDAQ.
const US_NASDAQ = new Set([
  'AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'NFLX', 'AMD', 'INTC',
]);

export const getTVSymbol = (s: string) => {
  if (s.includes(':')) return s; // Already has prefix
  const sym = s.toUpperCase().replace('.NS', '').replace('.BO', '');
  if (US_NASDAQ.has(sym)) return `NASDAQ:${sym}`;
  return `NSE:${sym}`;
};
