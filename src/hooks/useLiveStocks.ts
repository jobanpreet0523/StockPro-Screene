import { useState, useEffect } from 'react';
import { Stock } from '../types';
import { INITIAL_STOCKS } from '../data';

export function useLiveStocks() {
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveStocks = async () => {
    try {
      setLoading(true);
      const symbolsList = 'RELIANCE.NS,TCS.NS,INFY.NS,HDFCBANK.NS,ICICIBANK.NS,BHARTIARTL.NS,ITC.NS,LT.NS,KOTAKBANK.NS,AXISBANK.NS,WIPRO.NS,MARUTI.NS,SUNPHARMA.NS,BAJFINANCE.NS,TITAN.NS,TECHM.NS,DRREDDY.NS,ONGC.NS,SBIN.NS,NESTLEIND.NS,HINDUNILVR.NS,BAJAJFINSV.NS,ASIANPAINT.NS,ULTRACEMCO.NS,TATAMOTORS.NS,JSWSTEEL.NS,NTPC.NS,POWERGRID.NS,COALINDIA.NS,TATASTEEL.NS';
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsList}`;
      const proxies = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
      ];

      let quotes: any[] | null = null;
      for (const proxy of proxies) {
        try {
          const res = await fetch(proxy, { signal: AbortSignal.timeout(8000) });
          if (!res.ok) continue;
          const raw = await res.json();
          const content = raw.contents ?? raw;
          const parsed = typeof content === 'string' ? JSON.parse(content) : content;
          const result = parsed?.quoteResponse?.result;
          if (result?.length) {
            quotes = result;
            break;
          }
        } catch {
          continue;
        }
      }

      if (!quotes?.length) throw new Error('All proxies failed or returned empty quotes');

      const liveData: Stock[] = quotes.map((q: any) => ({
        symbol: q.symbol,
        name: q.shortName || q.longName || q.symbol.replace('.NS', ''),
        price: q.regularMarketPrice || 0,
        change: q.regularMarketChange || 0,
        changePercent: q.regularMarketChangePercent || 0,
        volume: q.regularMarketVolume || 0,
        marketCap: q.marketCap || 0,
        peRatio: q.trailingPE || 0,
        rsi: 50, // mock fallback
        dividendYield: q.trailingAnnualDividendYield ? q.trailingAnnualDividendYield * 100 : 0,
        sector: 'Unknown',
        open: q.regularMarketOpen || 0,
        high: q.regularMarketDayHigh || 0,
        low: q.regularMarketDayLow || 0,
        close: q.regularMarketPreviousClose || 0,
        exchange: 'NSE',
        isFoEnabled: true
      }));

      setStocks(liveData);
      setError(null);
    } catch (err: any) {
      console.error('fetchLiveStocks error:', err);
      setError(err.message || 'Failed to fetch live data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStocks();
    const interval = setInterval(fetchLiveStocks, 60000);
    return () => clearInterval(interval);
  }, []);

  return { stocks, loading, error, retry: fetchLiveStocks };
}
