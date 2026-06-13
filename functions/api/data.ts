// Cloudflare Worker Function: /api/data
// General data endpoint for the live-data.js and other legacy callers
// Fetches live index + option chain data combined

interface Env {}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const underlying = url.searchParams.get('underlying') || 'NIFTY';

  // Map to Yahoo symbols
  const yahooSymbolMap: Record<string, string> = {
    'NIFTY': '^NSEI', 'BANKNIFTY': '^NSEBANK', 'FINNIFTY': '^NSEFN',
  };
  const yahooSym = yahooSymbolMap[underlying.toUpperCase()] || underlying;

  try {
    // Fetch spot price from Yahoo
    const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSym}?interval=1d&range=5d`;
    const res = await fetch(chartUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) throw new Error('Yahoo chart API failed');

    const json: any = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;

    if (meta) {
      const price = meta.regularMarketPrice;
      const prevClose = meta.previousClose || price;
      const change = price - prevClose;
      const changePercent = prevClose ? (change / prevClose) * 100 : 0;

      // Also try to fetch option chain from NSE
      let optionData = null;
      try {
        const chainRes = await fetch(`https://stockpro-screener.jobanpreet0523.workers.dev/api/option-chain/${underlying.toUpperCase()}`, {
          headers: { 'Accept': 'application/json' },
        });
        if (chainRes.ok) {
          const chainJson: any = await chainRes.json();
          if (chainJson?.data) optionData = chainJson.data;
        }
      } catch (e) {
        // Non-critical
      }

      return new Response(JSON.stringify({
        status: 'ok',
        underlying,
        spotPrice: price,
        spot: price,
        change,
        changePercent,
        previousClose: prevClose,
        pcr: optionData?.pcr || 1.0,
        maxPain: optionData?.maxPain || Math.round(price / 50) * 50,
        totalCallOi: optionData?.totalCallOi || 0,
        totalPutOi: optionData?.totalPutOi || 0,
        expiryDate: optionData?.expiryDate || '',
        options: optionData?.options || [],
        source: 'live_yahoo_nse',
        timestamp: Date.now(),
      }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' },
      });
    }

    throw new Error('No meta data from Yahoo');
  } catch (err: any) {
    // Fallback
    const defaultSpots: Record<string, number> = {
      'NIFTY': 24892.50, 'BANKNIFTY': 52341.20, 'FINNIFTY': 21450.00,
    };
    const spot = defaultSpots[underlying.toUpperCase()] || 24000;

    return new Response(JSON.stringify({
      status: 'ok',
      underlying,
      spotPrice: spot,
      spot: spot,
      change: 0,
      changePercent: 0,
      pcr: 1.0,
      maxPain: Math.round(spot / 50) * 50,
      source: 'static_fallback',
      timestamp: Date.now(),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
