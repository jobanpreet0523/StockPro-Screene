// Cloudflare Pages Function: /api/option-chain/*
// Fetches real option chain data from NSE India API (server-side, with cookie handling)

interface Env {}

// NSE cookie cache
let cookieCache: { cookies: string; expiry: number } = { cookies: '', expiry: 0 };

async function getNseCookies(): Promise<string> {
  const now = Date.now();
  if (cookieCache.cookies && cookieCache.expiry > now) {
    return cookieCache.cookies;
  }

  try {
    const homeRes = await fetch('https://www.nseindia.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    const setCookies = homeRes.headers.getAll?.('set-cookie') || [];
    const rawCookie = homeRes.headers.get('set-cookie') || '';

    // Parse cookies
    let cookies = '';
    if (setCookies.length > 0) {
      cookies = setCookies.map((c: string) => c.split(';')[0]).join('; ');
    } else if (rawCookie) {
      cookies = rawCookie.split(',').map((c: string) => c.split(';')[0].trim()).join('; ');
    }

    cookieCache = { cookies, expiry: now + 5 * 60 * 1000 }; // Cache for 5 min
    return cookies;
  } catch (e) {
    return '';
  }
}

async function fetchNseOptionChain(symbol: string): Promise<any | null> {
  try {
    const cookies = await getNseCookies();
    const url = `https://www.nseindia.com/api/option-chain-indices?symbol=${encodeURIComponent(symbol)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.nseindia.com/',
        'Cookie': cookies,
      },
    });

    if (!response.ok) return null;
    const text = await response.text();
    if (!text.trim().startsWith('{')) return null;
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

function parseNseOptionChain(nseData: any, symbol: string) {
  if (!nseData || !nseData.records || !nseData.records.data) return null;

  const spotPrice = nseData.records.underlyingValue;
  const timestamp = nseData.records.timestamp;
  const rawOptions = nseData.records.data;

  // Use nearest expiry
  const activeExpiry = nseData.records.expiryDates?.[0] || '';
  const filteredOptions = activeExpiry
    ? rawOptions.filter((o: any) => o.expiryDate === activeExpiry)
    : rawOptions;

  let totalCallOi = 0;
  let totalPutOi = 0;

  const options = filteredOptions.map((item: any) => {
    const ce = item.CE || {};
    const pe = item.PE || {};
    const callOi = ce.openInterest || 0;
    const putOi = pe.openInterest || 0;
    totalCallOi += callOi;
    totalPutOi += putOi;

    const strikePrice = item.strikePrice;
    const zCall = (spotPrice - strikePrice) / (spotPrice * Math.max(0.01, (ce.impliedVolatility || 14) / 100));
    const callDelta = Number((1 / (1 + Math.exp(-zCall))).toFixed(2));
    const putDelta = Number((callDelta - 1).toFixed(2));

    return {
      strikePrice,
      callLtp: ce.lastPrice || 0,
      callChange: ce.change || ce.pchange || 0,
      callVol: ce.totalTradedVolume || 0,
      callOi: callOi,
      callOiChg: ce.changeinOpenInterest || 0,
      callIv: ce.impliedVolatility || 0,
      callDelta,
      putLtp: pe.lastPrice || 0,
      putChange: pe.change || pe.pchange || 0,
      putVol: pe.totalTradedVolume || 0,
      putOi: putOi,
      putOiChg: pe.changeinOpenInterest || 0,
      putIv: pe.impliedVolatility || 0,
      putDelta,
    };
  });

  // Max pain calculation
  let maxPain = spotPrice;
  if (options.length > 0) {
    let minPain = Infinity;
    options.forEach(target => {
      let pain = 0;
      options.forEach(opt => {
        if (target.strikePrice > opt.strikePrice) {
          pain += (target.strikePrice - opt.strikePrice) * opt.callOi;
        }
        if (target.strikePrice < opt.strikePrice) {
          pain += (opt.strikePrice - target.strikePrice) * opt.putOi;
        }
      });
      if (pain < minPain) { minPain = pain; maxPain = target.strikePrice; }
    });
  }

  return {
    symbol,
    spotPrice,
    pcr: totalCallOi > 0 ? Number((totalPutOi / totalCallOi).toFixed(2)) : 1.0,
    totalCallOi,
    totalPutOi,
    maxPain,
    expiryDate: activeExpiry || 'Current',
    timestamp,
    options,
  };
}

// Fallback: generate a reasonable option chain from spot price
function generateFallbackChain(symbol: string, spotPrice: number) {
  const isNifty = symbol === 'NIFTY' || symbol === '^NSEI';
  const isBankNifty = symbol === 'BANKNIFTY' || symbol === '^NSEBANK';
  const step = isBankNifty ? 100 : 50;
  const atm = Math.round(spotPrice / step) * step;
  const numStrikes = 10;
  const options: any[] = [];
  let totalCallOi = 0, totalPutOi = 0;

  for (let i = -numStrikes; i <= numStrikes; i++) {
    const strike = atm + i * step;
    const d = Math.abs((strike - atm) / atm);
    const callIntrinsic = Math.max(0, spotPrice - strike);
    const putIntrinsic = Math.max(0, strike - spotPrice);
    const timeVal = spotPrice * 0.035 * Math.exp(-d * 6);
    const callLtp = Number((callIntrinsic + timeVal + Math.random() * 2).toFixed(2));
    const putLtp = Number((putIntrinsic + timeVal + Math.random() * 2).toFixed(2));
    const callOi = Math.round(80000 * Math.exp(-d * 4) * (strike > spotPrice ? 1.3 : 0.6) * (1 + Math.random() * 0.2));
    const putOi = Math.round(90000 * Math.exp(-d * 4) * (strike < spotPrice ? 1.4 : 0.5) * (1 + Math.random() * 0.2));
    totalCallOi += callOi;
    totalPutOi += putOi;

    options.push({
      strikePrice: strike,
      callLtp, callChange: Number(((Math.random() - 0.45) * 12).toFixed(2)),
      callVol: Math.round(callOi * (1.3 + Math.random())),
      callOi, callOiChg: Math.round((Math.random() - 0.3) * callOi * 0.12),
      callIv: Number((14 + d * 55 + Math.random() * 2).toFixed(2)),
      callDelta: Number((1 / (1 + Math.exp(-(spotPrice - strike) / (spotPrice * 0.08)))).toFixed(2)),
      putLtp, putChange: Number(((Math.random() - 0.55) * 12).toFixed(2)),
      putVol: Math.round(putOi * (1.1 + Math.random())),
      putOi, putOiChg: Math.round((Math.random() - 0.4) * putOi * 0.1),
      putIv: Number((15 + d * 65 + Math.random() * 2).toFixed(2)),
      putDelta: Number(((1 / (1 + Math.exp(-(spotPrice - strike) / (spotPrice * 0.08)))) - 1).toFixed(2)),
    });
  }

  return {
    symbol,
    spotPrice,
    pcr: totalCallOi > 0 ? Number((totalPutOi / totalCallOi).toFixed(2)) : 1.0,
    totalCallOi,
    totalPutOi,
    maxPain: atm,
    expiryDate: 'Current',
    source: 'fallback_generated',
    options,
  };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const symbol = pathParts[2] || url.searchParams.get('symbol') || 'NIFTY';

  const underlyingMap: Record<string, string> = {
    'NIFTY': 'NIFTY', '^NSEI': 'NIFTY', 'NIFTY50': 'NIFTY',
    'BANKNIFTY': 'BANKNIFTY', '^NSEBANK': 'BANKNIFTY',
    'FINNIFTY': 'FINNIFTY', '^NSEFN': 'FINNIFTY',
  };
  const targetSymbol = underlyingMap[symbol.toUpperCase()] || symbol.toUpperCase();

  // Try NSE API first
  try {
    const nseData = await fetchNseOptionChain(targetSymbol);
    const parsed = parseNseOptionChain(nseData, targetSymbol);
    if (parsed && parsed.options.length > 0) {
      return new Response(JSON.stringify({
        status: 'ok',
        symbol: targetSymbol,
        data: parsed,
        source: 'real_nse',
        timestamp: parsed.timestamp,
      }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' },
      });
    }
  } catch (e) {
    // Continue to fallback
  }

  // Fallback: Get spot price from Yahoo Finance and generate chain
  try {
    const yahooSymbolMap: Record<string, string> = {
      'NIFTY': '^NSEI', 'BANKNIFTY': '^NSEBANK', 'FINNIFTY': '^NSEFN',
    };
    const yahooSym = yahooSymbolMap[targetSymbol] || targetSymbol;
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSym}?interval=1d&range=1d`;

    const res = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (res.ok) {
      const json: any = await res.json();
      const meta = json?.chart?.result?.[0]?.meta;
      if (meta?.regularMarketPrice) {
        const spotPrice = meta.regularMarketPrice;
        const chain = generateFallbackChain(targetSymbol, spotPrice);
        return new Response(JSON.stringify({
          status: 'ok',
          symbol: targetSymbol,
          data: chain,
          source: 'yahoo_spot_fallback',
        }), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
        });
      }
    }
  } catch (e) {
    // Continue
  }

  // Absolute fallback with hardcoded spot
  const defaultSpotMap: Record<string, number> = {
    'NIFTY': 24892.50, 'BANKNIFTY': 52341.20, 'FINNIFTY': 21450.00,
  };
  const spot = defaultSpotMap[targetSymbol] || 24000;
  const chain = generateFallbackChain(targetSymbol, spot);

  return new Response(JSON.stringify({
    status: 'ok',
    symbol: targetSymbol,
    data: chain,
    source: 'static_fallback',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
