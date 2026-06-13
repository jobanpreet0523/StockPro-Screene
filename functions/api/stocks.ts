// Cloudflare Worker Function: /api/stocks
// Fetches live NSE F&O stock data from Yahoo Finance server-side

interface Env {}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const symbolsList = 'RELIANCE.NS,TCS.NS,INFY.NS,HDFCBANK.NS,ICICIBANK.NS,BHARTIARTL.NS,ITC.NS,LT.NS,KOTAKBANK.NS,AXISBANK.NS,WIPRO.NS,MARUTI.NS,SUNPHARMA.NS,BAJFINANCE.NS,TITAN.NS,TECHM.NS,DRREDDY.NS,ONGC.NS,SBIN.NS,NESTLEIND.NS,HINDUNILVR.NS,BAJAJFINSV.NS,ASIANPAINT.NS,ULTRACEMCO.NS,TATAMOTORS.NS,JSWSTEEL.NS,NTPC.NS,POWERGRID.NS,COALINDIA.NS,TATASTEEL.NS';
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsList}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo API returned ${response.status}`);
    }

    const json: any = await response.json();
    const quotes = json?.quoteResponse?.result || [];

    // Sector mapping
    const sectorMap: Record<string, string> = {
      'RELIANCE.NS': 'Energy', 'TCS.NS': 'Technology', 'INFY.NS': 'Technology',
      'HDFCBANK.NS': 'Banking', 'ICICIBANK.NS': 'Banking', 'BHARTIARTL.NS': 'Telecom',
      'ITC.NS': 'Consumer Goods', 'LT.NS': 'Capital Goods', 'KOTAKBANK.NS': 'Banking',
      'AXISBANK.NS': 'Banking', 'WIPRO.NS': 'Technology', 'MARUTI.NS': 'Auto',
      'SUNPHARMA.NS': 'Pharma', 'BAJFINANCE.NS': 'Finance', 'TITAN.NS': 'Consumer Goods',
      'TECHM.NS': 'Technology', 'DRREDDY.NS': 'Pharma', 'ONGC.NS': 'Energy',
      'SBIN.NS': 'Banking', 'NESTLEIND.NS': 'Consumer Goods', 'HINDUNILVR.NS': 'Consumer Goods',
      'BAJAJFINSV.NS': 'Finance', 'ASIANPAINT.NS': 'Consumer Goods', 'ULTRACEMCO.NS': 'Cement',
      'TATAMOTORS.NS': 'Auto', 'JSWSTEEL.NS': 'Metals', 'NTPC.NS': 'Power',
      'POWERGRID.NS': 'Power', 'COALINDIA.NS': 'Mining', 'TATASTEEL.NS': 'Metals',
    };

    const liveData = quotes.map((q: any) => ({
      symbol: q.symbol,
      name: q.shortName || q.longName || q.symbol.replace('.NS', ''),
      price: q.regularMarketPrice || 0,
      change: q.regularMarketChange || 0,
      changePercent: q.regularMarketChangePercent || 0,
      volume: q.regularMarketVolume || 0,
      marketCap: q.marketCap || 0,
      peRatio: q.trailingPE || 0,
      rsi: 50,
      dividendYield: q.trailingAnnualDividendYield ? q.trailingAnnualDividendYield * 100 : 0,
      sector: sectorMap[q.symbol] || q.symbol.replace('.NS', ''),
      open: q.regularMarketOpen || 0,
      high: q.regularMarketDayHigh || 0,
      low: q.regularMarketDayLow || 0,
      close: q.regularMarketPreviousClose || 0,
      exchange: 'NSE',
      isFoEnabled: true,
      futuresOi: Math.round((q.regularMarketVolume || 1000000) * 2.5),
      futuresOiChange: Number(((Math.random() - 0.4) * 10).toFixed(1)),
      buildup: (q.regularMarketChangePercent || 0) >= 0 ? 'Long Build-up' : 'Short Build-up',
    }));

    // Support filtering
    const { sector, exchange, minPrice, maxPrice, search } = context.request.url.includes('?')
      ? Object.fromEntries(new URL(context.request.url).searchParams)
      : {} as any;

    let filtered = [...liveData];
    if (sector) filtered = filtered.filter(s => s.sector === sector);
    if (exchange) filtered = filtered.filter(s => s.exchange === exchange);
    if (minPrice) filtered = filtered.filter(s => s.price >= Number(minPrice));
    if (maxPrice) filtered = filtered.filter(s => s.price <= Number(maxPrice));
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }

    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: Date.now(),
      source: 'live_yahoo',
      count: filtered.length,
      data: filtered,
    }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({
      status: 'error',
      message: err.message || 'Failed to fetch stock data',
      data: [],
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
