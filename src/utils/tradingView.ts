// TradingView symbol mapping. Indian F&O stocks are mapped to their BSE scrip
// codes; known US tickers fall back to NASDAQ; everything else uses NSE.
const BSE_MAP: Record<string, string> = {
  RELIANCE: 'BSE:500325', TCS: 'BSE:532540', INFY: 'BSE:500209',
  HDFCBANK: 'BSE:500180', ICICIBANK: 'BSE:532174', BHARTIARTL: 'BSE:532454',
  ITC: 'BSE:500875', LT: 'BSE:500510', WIPRO: 'BSE:507685',
  AXISBANK: 'BSE:532215', KOTAKBANK: 'BSE:500247', MARUTI: 'BSE:532500',
  SUNPHARMA: 'BSE:524715', BAJFINANCE: 'BSE:500034', TITAN: 'BSE:500114',
  TECHM: 'BSE:532755', DRREDDY: 'BSE:500124', ONGC: 'BSE:500312',
  SBIN: 'BSE:500112', HINDUNILVR: 'BSE:500696', TATAMOTORS: 'BSE:500570',
  TATASTEEL: 'BSE:500470', JSWSTEEL: 'BSE:500228', NTPC: 'BSE:532555',
  POWERGRID: 'BSE:532898', COALINDIA: 'BSE:533278', BAJAJFINSV: 'BSE:532978',
  ASIANPAINT: 'BSE:500820', ULTRACEMCO: 'BSE:532538', NESTLEIND: 'BSE:500790',
};

const US_NASDAQ = new Set([
  'AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'NFLX', 'AMD', 'INTC',
]);

export const getTVSymbol = (s: string) => {
  const sym = s.toUpperCase().replace('.NS', '').replace('.BO', '');
  if (BSE_MAP[sym]) return BSE_MAP[sym];
  if (US_NASDAQ.has(sym)) return `NASDAQ:${sym}`;
  return `NSE:${sym}`;
};
