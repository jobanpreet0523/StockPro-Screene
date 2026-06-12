// TradingView uses ticker-based symbols (e.g. NSE:RELIANCE, NASDAQ:AAPL),
// not numeric BSE scrip codes, so we map each symbol to its exchange-prefixed ticker.
const US_NASDAQ = new Set([
  'AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'NFLX', 'AMD', 'INTC',
]);

export const getTVSymbol = (s: string) => {
  const sym = s.toUpperCase().replace('.NS', '').replace('.BO', '');
  if (US_NASDAQ.has(sym)) return `NASDAQ:${sym}`;
  return `NSE:${sym}`;
};
