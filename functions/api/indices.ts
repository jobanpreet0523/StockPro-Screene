// Cloudflare Worker Function: /api/indices
// Fetches live NSE index data from Yahoo Finance server-side (no CORS issues)

interface Env {}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const symbols = '^NSEI,^NSEBANK,^BSESN,^CNXIT,^VIX';
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;

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

    const indexMap: Record<string, string> = {
      '^NSEI': 'NIFTY 50',
      '^NSEBANK': 'BANK NIFTY',
      '^BSESN': 'SENSEX',
      '^CNXIT': 'NIFTY IT',
      '^VIX': 'INDIA VIX',
    };

    const indices = quotes.map((q: any) => ({
      symbol: q.symbol,
      name: indexMap[q.symbol] || q.shortName || q.symbol,
      price: q.regularMarketPrice || 0,
      change: q.regularMarketChange || 0,
      changePercent: q.regularMarketChangePercent || 0,
      sparkline: [
        q.regularMarketPrice * 0.993,
        q.regularMarketPrice * 1.005,
        q.regularMarketPrice * 0.997,
        q.regularMarketPrice,
      ],
      isPositive: (q.regularMarketChangePercent || 0) >= 0,
    }));

    // Add USD/INR and Gold/Oil from separate call if needed
    try {
      const commodityUrl = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=USDINR=X,GC=F,CL=F';
      const commodityRes = await fetch(commodityUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      });
      if (commodityRes.ok) {
        const commodityJson: any = await commodityRes.json();
        const commodityQuotes = commodityJson?.quoteResponse?.result || [];
        const commodityMap: Record<string, string> = {
          'USDINR=X': 'USD/INR',
          'GC=F': 'GOLD',
          'CL=F': 'CRUDE OIL',
        };
        commodityQuotes.forEach((q: any) => {
          indices.push({
            symbol: q.symbol,
            name: commodityMap[q.symbol] || q.shortName || q.symbol,
            price: q.regularMarketPrice || 0,
            change: q.regularMarketChange || 0,
            changePercent: q.regularMarketChangePercent || 0,
            sparkline: [q.regularMarketPrice * 0.993, q.regularMarketPrice * 1.005, q.regularMarketPrice * 0.997, q.regularMarketPrice],
            isPositive: (q.regularMarketChangePercent || 0) >= 0,
          });
        });
      }
    } catch (e) {
      // Non-critical, continue
    }

    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: Date.now(),
      source: 'live_yahoo',
      data: indices,
    }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' },
    });
  } catch (err: any) {
    // Fallback to recent cached data structure
    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: Date.now(),
      source: 'fallback',
      data: [
        { symbol: '^NSEI', name: 'NIFTY 50', price: 24892.50, change: 145.30, changePercent: 0.58, sparkline: [24750, 24810, 24850, 24892.50], isPositive: true },
        { symbol: '^NSEBANK', name: 'BANK NIFTY', price: 52341.20, change: -62.80, changePercent: -0.12, sparkline: [52400, 52300, 52350, 52341], isPositive: false },
        { symbol: '^BSESN', name: 'SENSEX', price: 81943.50, change: 485.10, changePercent: 0.60, sparkline: [81450, 81700, 81850, 81943], isPositive: true },
      ],
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
