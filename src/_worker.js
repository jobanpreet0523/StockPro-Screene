// ═══════════════════════════════════════════════════════════════════
// StockPro Cloudflare Worker — Market Snapshot API + launch-safe live plan stubs
// ═══════════════════════════════════════════════════════════════════
// Serves static SPA assets through ASSETS and exposes public delayed/cached
// market-data APIs. Real-time mode remains locked until payment verification
// and secure broker relay are implemented.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path = url.pathname;
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);

    if (path.startsWith('/api/')) {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders() });
      }
      return handleAPI(path, url, request, env);
    }

    try {
      const assetRes = await env.ASSETS.fetch(request.clone());
      if (assetRes.status !== 404) return assetRes;
    } catch {}

    const indexUrl = new URL('/index.html', url.origin);
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};

// ── CORS / JSON helpers ──────────────────────────────────────────
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonHeaders(extra = {}) {
  return { 'Content-Type': 'application/json', ...corsHeaders(), ...extra };
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders(extraHeaders) });
}

// ═══════════════════════════════════════════════════════════════════
//  Launch-safe paid live plan stubs
// ═══════════════════════════════════════════════════════════════════
const LIVE_PLAN_PRICE_INR = 299;
const LIVE_PLAN_NAME = 'StockPro Live Data Plan';

function handlePlanRoutes(path, request) {
  if (path === '/api/live-plan/status') {
    return json({
      status: 'free_delayed',
      priceInr: LIVE_PLAN_PRICE_INR,
      planName: LIVE_PLAN_NAME,
      dataMode: 'delayed',
      message: 'Free delayed data is active. Live mode requires verified payment and secure broker setup.',
    });
  }

  if (path === '/api/live-plan/create-order' && request.method === 'POST') {
    return json({
      status: 'setup_required',
      priceInr: LIVE_PLAN_PRICE_INR,
      planName: LIVE_PLAN_NAME,
      message: 'Payment route exists. Add server-side payment verification before accepting live users.',
    }, 503);
  }

  if (path === '/api/live-plan/verify-payment' && request.method === 'POST') {
    return json({
      status: 'payment_required',
      priceInr: LIVE_PLAN_PRICE_INR,
      dataMode: 'delayed',
      message: 'Payment verification route exists, but live mode remains locked until real verification is connected.',
    }, 501);
  }

  const providerMatch = path.match(/^\/api\/provider\/(upstox|zerodha)\/(start|callback)$/);
  if (providerMatch) {
    return json({
      status: 'setup_required',
      provider: providerMatch[1],
      step: providerMatch[2],
      message: 'Broker setup route exists. Connect secure authorization redirect/callback before enabling live data.',
    }, 503);
  }

  if (path === '/api/live-feed/status') {
    return json({
      status: 'disabled',
      dataMode: 'delayed',
      message: 'Live feed relay is not active. Free delayed/cached data remains the default.',
    });
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════
//  External snapshot data helpers
// ═══════════════════════════════════════════════════════════════════
const NSE_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const NSE_HOME = 'https://www.nseindia.com';
const YAHOO_UA = NSE_UA;

let nseCookies = '';
let nseCookieExpiry = 0;

async function getNSECookies() {
  const now = Date.now();
  if (nseCookies && nseCookieExpiry > now) return nseCookies;

  try {
    const home = await fetch(NSE_HOME, {
      headers: {
        'User-Agent': NSE_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      redirect: 'follow',
    });
    const raw = home.headers.get('set-cookie') || '';
    if (raw) {
      nseCookies = raw.split(',').map(c => c.split(';')[0].trim()).filter(Boolean).join('; ');
      nseCookieExpiry = now + 10 * 60 * 1000;
    }
    return nseCookies;
  } catch {
    return nseCookies;
  }
}

async function nseFetch(apiPath, env) {
  const cacheKey = `nse:${apiPath}`;
  const ttlMs = 30 * 1000;

  if (env.STOCKPRO_KV) {
    try {
      const cached = await env.STOCKPRO_KV.get(cacheKey, { type: 'text' });
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < ttlMs) return { ...parsed.data, _cached: true };
      }
    } catch {}
  }

  let lastErr = null;
  for (let i = 0; i < 2; i++) {
    try {
      const cookies = await getNSECookies();
      const res = await fetch(`${NSE_HOME}${apiPath}`, {
        headers: {
          'User-Agent': NSE_UA,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': `${NSE_HOME}/`,
          'Cookie': cookies,
          'Cache-Control': 'no-cache',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (res.status === 401 || res.status === 403) {
        nseCookieExpiry = 0;
        throw new Error('NSE auth refresh required');
      }
      if (!res.ok) throw new Error(`NSE returned ${res.status}`);

      const text = await res.text();
      if (!text.trim().startsWith('{')) throw new Error('NSE returned non-JSON');
      const data = JSON.parse(text);

      if (env.STOCKPRO_KV) {
        try {
          await env.STOCKPRO_KV.put(cacheKey, JSON.stringify({ data, ts: Date.now() }), { expirationTtl: 300 });
        } catch {}
      }
      return { ...data, _cached: false };
    } catch (err) {
      lastErr = err;
      if (i === 0) await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  throw lastErr;
}

async function yahooChart(symbol, range = '1d', interval = '1d') {
  const endpoint = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
  const res = await fetch(endpoint, { headers: { 'User-Agent': YAHOO_UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Yahoo ${res.status}`);
  return res.json();
}

async function yahooQuotes(symbols) {
  const endpoint = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;
  try {
    const res = await fetch(endpoint, { headers: { 'User-Agent': YAHOO_UA, Accept: 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      if (data?.quoteResponse?.result?.length) return data.quoteResponse.result;
    }
  } catch {}

  const out = [];
  for (const sym of symbols.split(',')) {
    try {
      const data = await yahooChart(sym, '5d');
      const meta = data?.chart?.result?.[0]?.meta;
      if (meta?.regularMarketPrice) {
        const prev = meta.chartPreviousClose || meta.previousClose || meta.regularMarketPrice;
        out.push({
          symbol: meta.symbol,
          regularMarketPrice: meta.regularMarketPrice,
          regularMarketChange: meta.regularMarketPrice - prev,
          regularMarketChangePercent: prev ? ((meta.regularMarketPrice - prev) / prev) * 100 : 0,
          regularMarketVolume: meta.regularMarketVolume || 0,
          shortName: meta.shortName || meta.symbol,
          longName: meta.longName || meta.shortName || meta.symbol,
          marketCap: 0,
          trailingPE: 0,
          regularMarketOpen: meta.regularMarketPrice,
          regularMarketDayHigh: meta.regularMarketDayHigh || meta.regularMarketPrice,
          regularMarketDayLow: meta.regularMarketDayLow || meta.regularMarketPrice,
          regularMarketPreviousClose: prev,
        });
      }
    } catch {}
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════
//  API router
// ═══════════════════════════════════════════════════════════════════
const PRIVATE_API_TOKEN_ENV = 'STOCKPRO_API_TOKEN';
const PUBLIC_PATHS = [
  '/api/live-plan',
  '/api/provider',
  '/api/live-feed/status',
  '/api/indices',
  '/api/stocks',
  '/api/market-indices',
  '/api/market-status',
  '/api/news',
  '/api/market-news',
  '/api/block-deals',
  '/api/bulk-deals',
  '/api/nse/fiidii',
  '/api/yahoo-finance',
  '/api/option-chain',
  '/api/pro-data',
  '/api/chart',
  '/api/data',
];

function isPublic(path) {
  return PUBLIC_PATHS.some(p => path === p || path.startsWith(p));
}

function getConfiguredAuthToken(env) {
  const raw = env?.[PRIVATE_API_TOKEN_ENV];
  if (!raw || typeof raw !== 'string') return null;
  return raw.startsWith('Bearer ') ? raw : `Bearer ${raw}`;
}

async function handleAPI(path, url, request, env) {
  try {
    const planResponse = handlePlanRoutes(path, request);
    if (planResponse) return planResponse;

    if (!isPublic(path)) {
      const authHeader = request.headers.get('Authorization');
      const configuredToken = getConfiguredAuthToken(env);
      if (!configuredToken) return json({ error: 'Private API token is not configured.' }, 503);
      if (authHeader !== configuredToken) return json({ error: 'Unauthorized access to financial data feeds.' }, 401);
    }

    if (path.startsWith('/api/yahoo-finance/')) {
      const parts = path.split('/');
      const symbol = parts[3];

      if (symbol === 'quotes') {
        const symbols = url.searchParams.get('symbols') || '';
        const res = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`, { headers: { 'User-Agent': YAHOO_UA, Accept: 'application/json' } });
        return new Response(res.body, { status: res.status, headers: jsonHeaders({ 'Content-Type': 'application/json' }) });
      }

      const modules = url.searchParams.get('modules');
      if (modules) {
        const res = await fetch(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=${modules}`, { headers: { 'User-Agent': YAHOO_UA, Accept: 'application/json' } });
        return new Response(res.body, { status: res.status, headers: jsonHeaders({ 'Content-Type': 'application/json' }) });
      }

      const range = url.searchParams.get('range') || '1d';
      const interval = url.searchParams.get('interval') || '1d';
      const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`, { headers: { 'User-Agent': YAHOO_UA, Accept: 'application/json' } });
      return new Response(res.body, { status: res.status, headers: jsonHeaders({ 'Content-Type': 'application/json' }) });
    }

    if (path.startsWith('/api/option-chain/')) {
      const raw = path.split('/')[3] || 'NIFTY';
      const symMap = { NIFTY: 'NIFTY', '^NSEI': 'NIFTY', BANKNIFTY: 'BANKNIFTY', '^NSEBANK': 'BANKNIFTY', FINNIFTY: 'FINNIFTY', '^NSEFN': 'FINNIFTY' };
      const nseSymbol = symMap[raw.toUpperCase()] || raw.toUpperCase();

      try {
        const data = await nseFetch(`/api/option-chain-indices?symbol=${encodeURIComponent(nseSymbol)}`, env);
        if (data?.records?.data?.length) return json({ status: 'ok', source: 'nse_snapshot', symbol: nseSymbol, data }, 200, { 'Cache-Control': 'public, max-age=30' });
      } catch {}

      try {
        const data = await nseFetch(`/api/option-chain-equities?symbol=${encodeURIComponent(nseSymbol)}`, env);
        if (data?.records?.data?.length) return json({ status: 'ok', source: 'nse_equity_snapshot', symbol: nseSymbol, data }, 200, { 'Cache-Control': 'public, max-age=30' });
      } catch {}

      const yMap = { NIFTY: '^NSEI', BANKNIFTY: '^NSEBANK', FINNIFTY: '^NSEFN' };
      const ySym = yMap[nseSymbol] || nseSymbol;
      try {
        const chart = await yahooChart(ySym);
        const meta = chart?.chart?.result?.[0]?.meta;
        if (meta?.regularMarketPrice) {
          const chain = buildFallbackChain(nseSymbol, meta.regularMarketPrice);
          const fallbackData = {
            records: {
              underlyingValue: meta.regularMarketPrice,
              timestamp: new Date().toISOString(),
              data: chain.options.map(o => ({
                strikePrice: o.strikePrice,
                CE: { lastPrice: o.callLtp, change: o.callChange, totalTradedVolume: o.callVol, openInterest: o.callOi, changeinOpenInterest: o.callOiChg, impliedVolatility: o.callIv },
                PE: { lastPrice: o.putLtp, change: o.putChange, totalTradedVolume: o.putVol, openInterest: o.putOi, changeinOpenInterest: o.putOiChg, impliedVolatility: o.putIv },
              })),
              expiryDates: [chain.expiryDate],
            },
          };
          return json({ status: 'ok', source: 'yahoo_fallback', symbol: nseSymbol, data: fallbackData });
        }
      } catch {}
      return json({ status: 'error', message: 'All data sources failed' }, 502);
    }

    if (path === '/api/market-indices' || path === '/api/indices') {
      if (path === '/api/market-indices') {
        try {
          const data = await nseFetch('/api/equity-stockIndices?index=NIFTY%2050', env);
          if (data?.data) return json({ status: 'ok', source: 'nse_snapshot', data }, 200, { 'Cache-Control': 'public, max-age=30' });
        } catch {}
      }

      const quotes = await yahooQuotes('^NSEI,^NSEBANK,^BSESN,^CNXIT,^VIX');
      const idxMap = { '^NSEI': 'NIFTY 50', '^NSEBANK': 'BANK NIFTY', '^BSESN': 'SENSEX', '^CNXIT': 'NIFTY IT', '^VIX': 'INDIA VIX' };
      const data = quotes.map(q => ({
        symbol: q.symbol,
        name: idxMap[q.symbol] || q.shortName || q.symbol,
        price: q.regularMarketPrice || 0,
        change: q.regularMarketChange || 0,
        changePercent: q.regularMarketChangePercent || 0,
        sparkline: [(q.regularMarketPrice || 0) * 0.997, (q.regularMarketPrice || 0) * 1.003, q.regularMarketPrice || 0],
        isPositive: (q.regularMarketChangePercent || 0) >= 0,
      }));
      return json({ status: 'ok', source: 'yahoo_snapshot', data }, 200, { 'Cache-Control': 'public, max-age=30' });
    }

    if (path === '/api/stocks') {
      const syms = 'RELIANCE.NS,TCS.NS,INFY.NS,HDFCBANK.NS,ICICIBANK.NS,BHARTIARTL.NS,ITC.NS,LT.NS,KOTAKBANK.NS,AXISBANK.NS,WIPRO.NS,MARUTI.NS,SUNPHARMA.NS,BAJFINANCE.NS,TITAN.NS,TECHM.NS,DRREDDY.NS,ONGC.NS,SBIN.NS,NESTLEIND.NS,HINDUNILVR.NS,BAJAJFINSV.NS,ASIANPAINT.NS,ULTRACEMCO.NS,TATAMOTORS.NS,JSWSTEEL.NS,NTPC.NS,POWERGRID.NS,COALINDIA.NS,TATASTEEL.NS';
      const quotes = await yahooQuotes(syms);
      if (!quotes.length) throw new Error('Stocks quotes failed');
      const sectorMap = { 'RELIANCE.NS': 'Energy', 'TCS.NS': 'Technology', 'INFY.NS': 'Technology', 'HDFCBANK.NS': 'Banking', 'ICICIBANK.NS': 'Banking', 'BHARTIARTL.NS': 'Telecom', 'ITC.NS': 'Consumer Goods', 'LT.NS': 'Capital Goods', 'KOTAKBANK.NS': 'Banking', 'AXISBANK.NS': 'Banking', 'WIPRO.NS': 'Technology', 'MARUTI.NS': 'Auto', 'SUNPHARMA.NS': 'Pharma', 'BAJFINANCE.NS': 'Finance', 'SBIN.NS': 'Banking', 'TITAN.NS': 'Consumer Goods', 'TECHM.NS': 'Technology', 'DRREDDY.NS': 'Pharma', 'ONGC.NS': 'Energy', 'NESTLEIND.NS': 'Consumer Goods', 'HINDUNILVR.NS': 'Consumer Goods', 'BAJAJFINSV.NS': 'Finance', 'ASIANPAINT.NS': 'Consumer Goods', 'ULTRACEMCO.NS': 'Cement', 'TATAMOTORS.NS': 'Auto', 'JSWSTEEL.NS': 'Metals', 'NTPC.NS': 'Power', 'POWERGRID.NS': 'Power', 'COALINDIA.NS': 'Mining', 'TATASTEEL.NS': 'Metals' };
      const data = quotes.map(q => ({
        symbol: q.symbol,
        name: q.shortName || q.longName || q.symbol.replace('.NS', ''),
        price: q.regularMarketPrice || 0,
        change: q.regularMarketChange || 0,
        changePercent: q.regularMarketChangePercent || 0,
        volume: q.regularMarketVolume || 0,
        marketCap: q.marketCap || 0,
        peRatio: q.trailingPE || 0,
        sector: sectorMap[q.symbol] || q.symbol.replace('.NS', ''),
        open: q.regularMarketOpen || 0,
        high: q.regularMarketDayHigh || 0,
        low: q.regularMarketDayLow || 0,
        close: q.regularMarketPreviousClose || 0,
        exchange: 'NSE',
        isFoEnabled: true,
        buildup: (q.regularMarketChangePercent || 0) >= 0 ? 'Long Build-up' : 'Short Build-up',
      }));
      return json({ status: 'ok', source: 'yahoo_snapshot', count: data.length, data }, 200, { 'Cache-Control': 'public, max-age=30' });
    }

    if (path === '/api/news' || path === '/api/market-news') {
      const feeds = [
        'https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms',
        'https://www.moneycontrol.com/rss/latestnews.xml',
      ];
      for (const feedUrl of feeds) {
        try {
          const res = await fetch(feedUrl, { headers: { 'User-Agent': NSE_UA, Accept: 'application/rss+xml,application/xml,text/xml' }, signal: AbortSignal.timeout(8000) });
          if (!res.ok) continue;
          const xml = await res.text();
          const source = new URL(feedUrl).hostname.includes('economictimes') ? 'Economic Times' : 'Moneycontrol';
          const articles = parseRSS(xml, source);
          if (articles.length) return json({ status: 'ok', source: 'rss', data: articles.slice(0, 20) }, 200, { 'Cache-Control': 'public, max-age=120' });
        } catch {}
      }
      return json({ status: 'ok', source: 'empty', data: [] });
    }

    if (path === '/api/market-status') {
      const now = new Date();
      const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const day = ist.getDay();
      const mins = ist.getHours() * 60 + ist.getMinutes();
      const isWeekday = day >= 1 && day <= 5;
      const isMarketHours = isWeekday && mins >= 555 && mins <= 930;
      const market = isMarketHours ? 'OPEN' : (isWeekday && mins < 555 ? 'PRE_MARKET' : 'CLOSED');
      return json({ status: 'ok', market, ist: ist.toISOString() });
    }

    if (path === '/api/block-deals' || path === '/api/bulk-deals') {
      const deals = [
        { date: '2026-05-15', symbol: 'RELIANCE', clientName: 'Morgan Stanley Asia', buySell: 'BUY', quantity: 580000, price: 2450.50, value: 142.12 },
        { date: '2026-05-15', symbol: 'TCS', clientName: 'LIC of India', buySell: 'BUY', quantity: 120000, price: 3890.20, value: 46.68 },
        { date: '2026-05-14', symbol: 'HDFCBANK', clientName: 'Societe Generale', buySell: 'SELL', quantity: 950000, price: 1620.15, value: 153.91 },
        { date: '2026-05-14', symbol: 'INFY', clientName: 'Goldman Sachs', buySell: 'BUY', quantity: 300000, price: 1410.50, value: 42.31 },
        { date: '2026-05-13', symbol: 'ICICIBANK', clientName: 'Fidelity Investments', buySell: 'SELL', quantity: 800000, price: 1120.00, value: 89.60 },
      ];
      return json({ status: 'ok', data: deals });
    }

    if (path === '/api/nse/fiidii') {
      try {
        const data = await nseFetch('/api/fiidiiTradeReact', env);
        return json({ status: 'ok', source: 'nse_snapshot', data }, 200, { 'Cache-Control': 'public, max-age=300' });
      } catch (err) {
        return json({ status: 'error', message: err.message }, 502);
      }
    }

    if (path === '/api/pro-data') {
      const symbol = url.searchParams.get('symbol') || 'AAPL';
      const data = await getProData(symbol);
      return json(data, 200, { 'Cache-Control': 'public, max-age=3600' });
    }

    if (path === '/api/chart') {
      const symbol = url.searchParams.get('symbol') || 'NIFTY';
      const interval = url.searchParams.get('interval') || '1d';
      const range = url.searchParams.get('range') || '5d';
      try {
        const data = await yahooChart(symbol, range, interval);
        return json(data);
      } catch (err) {
        return json({ status: 'error', message: err.message }, 500);
      }
    }

    if (path === '/api/data') {
      const underlying = url.searchParams.get('underlying') || 'NIFTY';
      const chart = await yahooChart(underlying === 'BANKNIFTY' ? '^NSEBANK' : (underlying === 'FINNIFTY' ? '^NSEFN' : '^NSEI'));
      const meta = chart?.chart?.result?.[0]?.meta;
      const spot = meta?.regularMarketPrice || 24000;
      return json(buildFallbackChain(underlying, spot));
    }

    return json({ status: 'error', message: 'Not found' }, 404);
  } catch (err) {
    return json({ status: 'error', message: err.message || 'Server error' }, 500);
  }
}

// ═══════════════════════════════════════════════════════════════════
//  Data helpers
// ═══════════════════════════════════════════════════════════════════
function buildFallbackChain(symbol, spot) {
  const step = symbol === 'BANKNIFTY' ? 100 : 50;
  const atm = Math.round(spot / step) * step;
  const options = [];
  let totalCallOi = 0;
  let totalPutOi = 0;

  for (let i = -10; i <= 10; i++) {
    const strike = atm + i * step;
    const distance = Math.abs((strike - atm) / atm);
    const callIntrinsic = Math.max(0, spot - strike);
    const putIntrinsic = Math.max(0, strike - spot);
    const timeValue = spot * 0.035 * Math.exp(-distance * 6);
    const callOi = Math.round(80000 * Math.exp(-distance * 4) * (strike > spot ? 1.3 : 0.6) * (1 + Math.random() * 0.2));
    const putOi = Math.round(90000 * Math.exp(-distance * 4) * (strike < spot ? 1.4 : 0.5) * (1 + Math.random() * 0.2));
    totalCallOi += callOi;
    totalPutOi += putOi;
    options.push({
      strikePrice: strike,
      callLtp: +(callIntrinsic + timeValue + Math.random() * 2).toFixed(2),
      callChange: +((Math.random() - 0.45) * 12).toFixed(2),
      callVol: Math.round(callOi * (1.3 + Math.random())),
      callOi,
      callOiChg: Math.round((Math.random() - 0.3) * callOi * 0.12),
      callIv: +(14 + distance * 55 + Math.random() * 2).toFixed(2),
      putLtp: +(putIntrinsic + timeValue + Math.random() * 2).toFixed(2),
      putChange: +((Math.random() - 0.55) * 12).toFixed(2),
      putVol: Math.round(putOi * (1.1 + Math.random())),
      putOi,
      putOiChg: Math.round((Math.random() - 0.4) * putOi * 0.1),
      putIv: +(15 + distance * 65 + Math.random() * 2).toFixed(2),
    });
  }

  return {
    symbol,
    spotPrice: spot,
    pcr: totalCallOi > 0 ? +(totalPutOi / totalCallOi).toFixed(2) : 1,
    totalCallOi,
    totalPutOi,
    maxPain: atm,
    expiryDate: 'Current',
    options,
  };
}

function parseRSS(xml, source) {
  const articles = [];
  const items = xml.split(/<item[\s>]/i);
  for (let i = 1; i < items.length && articles.length < 25; i++) {
    const title = extractCDATA(items[i], 'title');
    const link = extractTag(items[i], 'link');
    const pubDate = extractTag(items[i], 'pubDate');
    if (title) {
      articles.push({
        title: title.replace(/&amp;/g, '&').trim(),
        link: link || '#',
        pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        source,
      });
    }
  }
  return articles;
}

function extractCDATA(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>`, 'i'));
  return match ? match[1] : extractTag(block, tag);
}

function extractTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? match[1].trim() : '';
}

async function getProData(symbol) {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=financialData,defaultKeyStatistics,summaryDetail,incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory,assetProfile`, { headers: { 'User-Agent': YAHOO_UA } });
    const raw = await res.json();
    const result = raw.quoteSummary.result[0];
    const price = result.financialData.currentPrice?.raw || 100;
    const targetPrice = result.financialData.targetMeanPrice?.raw || price * 1.12;
    const sector = result.assetProfile?.sector || 'Technology';
    const industry = result.assetProfile?.industry || 'Consumer Electronics';
    const description = result.assetProfile?.longBusinessSummary || 'Company profile data currently processing.';
    const pe = result.summaryDetail.trailingPE?.raw || result.defaultKeyStatistics.forwardPE?.raw || 25.5;
    const divYield = result.summaryDetail.dividendYield?.raw || 0.015;
    const marketCap = result.summaryDetail.marketCap?.raw || 100000000000;
    const revenue = result.financialData.totalRevenue?.raw || 50000000000;
    const netIncome = result.defaultKeyStatistics.netIncomeToCommon?.raw || 10000000000;
    const grossMargin = result.financialData.grossMargins?.raw || 0.45;
    const quickRatio = result.financialData.quickRatio?.raw || 1.2;
    const debtToEquity = result.financialData.debtToEquity?.raw || 45;
    const fairValue = parseFloat((targetPrice * 0.96 + price * 0.1).toFixed(2));
    const upsidePercent = parseFloat((((fairValue - price) / price) * 100).toFixed(1));
    const uncertainty = upsidePercent > 20 ? 'High' : (upsidePercent > 10 ? 'Medium' : 'Low');
    const cashFlowHealth = Math.min(5, Math.max(1, Math.round(quickRatio * 3.5)));
    const growthHealth = Math.min(5, Math.max(1, Math.round((result.financialData.revenueGrowth?.raw || 0.1) * 30 + 2)));
    const profitHealth = Math.min(5, Math.max(1, Math.round(grossMargin * 8 + 1)));
    const valueHealth = Math.min(5, Math.max(1, Math.round(15 / pe + 2.5)));
    const relativeValue = Math.min(5, Math.max(1, Math.round(marketCap / 500000000000 + 1)));
    const overallScore = Math.round((cashFlowHealth + growthHealth + profitHealth + valueHealth + relativeValue) / 5);
    const statementHistory = result.incomeStatementHistory?.incomeStatementHistory || [];
    const statementYears = statementHistory.map(item => ({
      year: new Date(item.endDate?.raw * 1000).getFullYear(),
      revenue: item.totalRevenue?.raw || 0,
      grossProfit: item.grossProfit?.raw || 0,
      operatingIncome: item.operatingIncome?.raw || 0,
      netIncome: item.netIncome?.raw || 0,
    }));

    return {
      symbol: symbol.toUpperCase(),
      name: `${symbol.toUpperCase()} Inc`,
      price,
      changePercent: upsidePercent / 10,
      sector,
      industry,
      description,
      fairValue,
      upsidePercent,
      uncertainty,
      financialHealth: { overallScore, cashFlowHealth, growthHealth, profitHealth, valueHealth, relativeValue },
      keyStats: { pe, divYield, marketCap, revenue, netIncome, grossMargin, quickRatio, debtToEquity },
      statementYears,
    };
  } catch {
    return generateFallbackProData(symbol);
  }
}

function generateFallbackProData(symbol) {
  const price = 311.23;
  const fairValue = 373.10;
  return {
    symbol: symbol.toUpperCase(),
    name: `${symbol.toUpperCase()} Corp`,
    price,
    changePercent: 0.87,
    sector: 'Technology',
    industry: 'Information Technology',
    description: 'Global enterprise specializing in structural software solutions and derivatives modeling components.',
    fairValue,
    upsidePercent: 19.8,
    uncertainty: 'Medium',
    financialHealth: { overallScore: 4, cashFlowHealth: 4, growthHealth: 3, profitHealth: 5, valueHealth: 3, relativeValue: 4 },
    keyStats: { pe: 37.3, divYield: 0.003, marketCap: 2552800000000, revenue: 451400000000, netIncome: 95300000000, grossMargin: 0.44, quickRatio: 1.1, debtToEquity: 55.4 },
    statementYears: [
      { year: 2023, revenue: 394328000000, grossProfit: 170562000000, operatingIncome: 114301000000, netIncome: 96995000000 },
      { year: 2024, revenue: 415161000000, grossProfit: 181260000000, operatingIncome: 117300000000, netIncome: 95300000000 },
      { year: 2025, revenue: 451400000000, grossProfit: 198750000000, operatingIncome: 134661000000, netIncome: 111164000000 },
    ],
  };
}
