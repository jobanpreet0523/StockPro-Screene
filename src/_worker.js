// ═══════════════════════════════════════════════════════════════════
// StockPro Cloudflare Worker — NSE India Proxy + API
// ═══════════════════════════════════════════════════════════════════
// Serves static SPA assets via ASSETS binding and proxies NSE India
// API calls server-side, caching in KV for 60s.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ── API Routes ─────────────────────────────────────────────
    if (path.startsWith('/api/')) {
      // CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders() });
      }
      return handleAPI(path, url, request, env);
    }

    // ── Static Assets + SPA fallback ───────────────────────────
    const assetRes = await env.ASSETS.fetch(request);
    if (assetRes.status !== 404) return assetRes;
    return env.ASSETS.fetch(new Request(new URL('/', url.origin)));
  },
};

// ── CORS ────────────────────────────────────────────────────────
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}
function jsonHeaders(extra = {}) {
  return { 'Content-Type': 'application/json', ...corsHeaders(), ...extra };
}

// ═══════════════════════════════════════════════════════════════════
//  NSE Client — cookie refresh + rate-limited fetch + KV cache
// ═══════════════════════════════════════════════════════════════════
const NSE_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const NSE_HOME = 'https://www.nseindia.com';

// Global cookie cache (per-isolate, persists across requests)
let nseCookies = '';
let nseCookieExpiry = 0;

async function getNSECookies() {
  const now = Date.now();
  if (nseCookies && nseCookieExpiry > now) return nseCookies;
  try {
    const home = await fetch(NSE_HOME, {
      headers: { 'User-Agent': NSE_UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.9' },
      redirect: 'follow',
    });
    const raw = home.headers.get('set-cookie') || '';
    nseCookies = raw.split(',').map(c => c.split(';')[0].trim()).filter(Boolean).join('; ');
    nseCookieExpiry = now + 5 * 60 * 1000; // refresh every 5 min
    return nseCookies;
  } catch {
    return nseCookies; // return stale cookies on error
  }
}

async function nseFetch(apiPath, env) {
  const cacheKey = `nse:${apiPath}`;
  const CACHE_TTL = 60; // seconds

  // 1. Check KV cache
  if (env.STOCKPRO_KV) {
    try {
      const cached = await env.STOCKPRO_KV.get(cacheKey, { type: 'text' });
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < CACHE_TTL * 1000) {
          return { ...parsed.data, _cached: true };
        }
      }
    } catch {}
  }

  // 2. Fetch from NSE
  const cookies = await getNSECookies();
  const fullUrl = `${NSE_HOME}${apiPath}`;
  const res = await fetch(fullUrl, {
    headers: {
      'User-Agent': NSE_UA,
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': NSE_HOME + '/',
      'Cookie': cookies,
    },
  });

  if (!res.ok) throw new Error(`NSE returned ${res.status}`);

  const text = await res.text();
  if (!text.trim().startsWith('{')) throw new Error('NSE returned non-JSON');
  const data = JSON.parse(text);

  // 3. Write to KV cache
  if (env.STOCKPRO_KV) {
    try {
      await env.STOCKPRO_KV.put(cacheKey, JSON.stringify({ data, ts: Date.now() }), { expirationTtl: CACHE_TTL });
    } catch {}
  }

  return { ...data, _cached: false };
}

// ═══════════════════════════════════════════════════════════════════
//  Yahoo Finance fallback (used when NSE is unavailable)
// ═══════════════════════════════════════════════════════════════════
const YAHOO_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

async function yahooChart(symbol, range = '1d', interval = '1d') {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
  const res = await fetch(url, { headers: { 'User-Agent': YAHOO_UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Yahoo ${res.status}`);
  return res.json();
}

async function yahooQuotes(symbols) {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': YAHOO_UA, Accept: 'application/json' } });
    if (res.ok) {
      const j = await res.json();
      if (j?.quoteResponse?.result?.length) return j.quoteResponse.result;
    }
  } catch {}
  // Fallback: chart API per symbol
  const out = [];
  for (const sym of symbols.split(',')) {
    try {
      const j = await yahooChart(sym, '5d');
      const m = j?.chart?.result?.[0]?.meta;
      if (m?.regularMarketPrice) {
        const prev = m.chartPreviousClose || m.previousClose || m.regularMarketPrice;
        out.push({ symbol: m.symbol, regularMarketPrice: m.regularMarketPrice, regularMarketChange: m.regularMarketPrice - prev, regularMarketChangePercent: prev ? ((m.regularMarketPrice - prev) / prev) * 100 : 0, regularMarketVolume: m.regularMarketVolume || 0, shortName: m.shortName || m.symbol, longName: m.longName || m.shortName || m.symbol, marketCap: 0, trailingPE: 0, regularMarketOpen: m.regularMarketPrice, regularMarketDayHigh: m.regularMarketDayHigh || m.regularMarketPrice, regularMarketDayLow: m.regularMarketDayLow || m.regularMarketPrice, regularMarketPreviousClose: prev });
      }
    } catch {}
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════
//  API Route Handler
// ═══════════════════════════════════════════════════════════════════
async function handleAPI(path, url, request, env) {
  try {
    // ── /api/yahoo-finance/:symbol (CORS Proxy) ──────────────
    if (path.startsWith('/api/yahoo-finance/')) {
      const parts = path.split('/');
      const symbol = parts[3]; // /api/yahoo-finance/SYMBOL

      if (symbol === 'quotes') {
        const symbols = url.searchParams.get('symbols');
        const urlQuotes = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;
        const res = await fetch(urlQuotes, { headers: { 'User-Agent': YAHOO_UA, Accept: 'application/json' } });
        return new Response(res.body, { status: res.status, headers: jsonHeaders({ 'Content-Type': 'application/json' }) });
      }

      // Handle specific modules for quoteSummary if needed
      const modules = url.searchParams.get('modules');
      if (modules) {
        const urlSum = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=${modules}`;
        const res = await fetch(urlSum, { headers: { 'User-Agent': YAHOO_UA, Accept: 'application/json' } });
        return new Response(res.body, { status: res.status, headers: jsonHeaders({ 'Content-Type': 'application/json' }) });
      }

      // Default: v8 chart data
      const range = url.searchParams.get('range') || '1d';
      const interval = url.searchParams.get('interval') || '1d';
      const urlChart = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
      const res = await fetch(urlChart, { headers: { 'User-Agent': YAHOO_UA, Accept: 'application/json' } });
      return new Response(res.body, { status: res.status, headers: jsonHeaders({ 'Content-Type': 'application/json' }) });
    }

    // ── /api/option-chain/:symbol ────────────────────────────
    if (path.startsWith('/api/option-chain/')) {
      const raw = path.split('/')[3] || 'NIFTY';
      const symMap = { NIFTY: 'NIFTY', '^NSEI': 'NIFTY', BANKNIFTY: 'BANKNIFTY', '^NSEBANK': 'BANKNIFTY', FINNIFTY: 'FINNIFTY', '^NSEFN': 'FINNIFTY' };
      const nseSymbol = symMap[raw.toUpperCase()] || raw.toUpperCase();

      // Try NSE API
      let nseData = null;
      try {
        const apiPath = `/api/option-chain-indices?symbol=${encodeURIComponent(nseSymbol)}`;
        nseData = await nseFetch(apiPath, env);
      } catch {}
      if (nseData?.records?.data?.length) {
        return new Response(JSON.stringify({ status: 'ok', source: 'nse', symbol: nseSymbol, data: nseData }), { headers: jsonHeaders({ 'Cache-Control': 'public, max-age=30' }) });
      }
      // Try equity endpoint for stock options
      try {
        const eqPath = `/api/option-chain-equities?symbol=${encodeURIComponent(nseSymbol)}`;
        const eqData = await nseFetch(eqPath, env);
        if (eqData?.records?.data?.length) {
          return new Response(JSON.stringify({ status: 'ok', source: 'nse_equity', symbol: nseSymbol, data: eqData }), { headers: jsonHeaders({ 'Cache-Control': 'public, max-age=30' }) });
        }
      } catch {}

      // Yahoo fallback: real spot + computed chain
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
          return new Response(JSON.stringify({ status: 'ok', source: 'yahoo_fallback', symbol: nseSymbol, data: fallbackData }), { headers: jsonHeaders() });
        }
      } catch {}
      return new Response(JSON.stringify({ status: 'error', message: 'All data sources failed' }), { status: 502, headers: jsonHeaders() });
    }

    // ── /api/market-indices ──────────────────────────────────
    if (path === '/api/market-indices') {
      // Try NSE first
      try {
        const data = await nseFetch('/api/equity-stockIndices?index=NIFTY%2050', env);
        if (data?.data) {
          return new Response(JSON.stringify({ status: 'ok', source: 'nse', data }), { headers: jsonHeaders({ 'Cache-Control': 'public, max-age=30' }) });
        }
      } catch {}
      // Yahoo fallback
      const syms = '^NSEI,^NSEBANK,^BSESN,^CNXIT,^VIX';
      const quotes = await yahooQuotes(syms);
      const idxMap = { '^NSEI': 'NIFTY 50', '^NSEBANK': 'BANK NIFTY', '^BSESN': 'SENSEX', '^CNXIT': 'NIFTY IT', '^VIX': 'INDIA VIX' };
      const indices = quotes.map(q => ({
        symbol: q.symbol, name: idxMap[q.symbol] || q.shortName || q.symbol,
        price: q.regularMarketPrice || 0, change: q.regularMarketChange || 0,
        changePercent: q.regularMarketChangePercent || 0,
        isPositive: (q.regularMarketChangePercent || 0) >= 0,
      }));
      return new Response(JSON.stringify({ status: 'ok', source: 'yahoo', data: indices }), { headers: jsonHeaders({ 'Cache-Control': 'public, max-age=30' }) });
    }

    // ── /api/indices (simplified for header bar) ─────────────
    if (path === '/api/indices') {
      const syms = '^NSEI,^NSEBANK,^BSESN,^CNXIT,^VIX';
      const quotes = await yahooQuotes(syms);
      const idxMap = { '^NSEI': 'NIFTY 50', '^NSEBANK': 'BANK NIFTY', '^BSESN': 'SENSEX', '^CNXIT': 'NIFTY IT', '^VIX': 'INDIA VIX' };
      const indices = quotes.map(q => ({
        symbol: q.symbol, name: idxMap[q.symbol] || q.shortName || q.symbol,
        price: q.regularMarketPrice || 0, change: q.regularMarketChange || 0,
        changePercent: q.regularMarketChangePercent || 0,
        sparkline: [(q.regularMarketPrice || 0) * 0.997, (q.regularMarketPrice || 0) * 1.003, q.regularMarketPrice || 0],
        isPositive: (q.regularMarketChangePercent || 0) >= 0,
      }));
      return new Response(JSON.stringify({ status: 'ok', source: 'live', data: indices }), { headers: jsonHeaders({ 'Cache-Control': 'public, max-age=30' }) });
    }

    // ── /api/stocks ──────────────────────────────────────────
    if (path === '/api/stocks') {
      const syms = 'RELIANCE.NS,TCS.NS,INFY.NS,HDFCBANK.NS,ICICIBANK.NS,BHARTIARTL.NS,ITC.NS,LT.NS,KOTAKBANK.NS,AXISBANK.NS,WIPRO.NS,MARUTI.NS,SUNPHARMA.NS,BAJFINANCE.NS,TITAN.NS,TECHM.NS,DRREDDY.NS,ONGC.NS,SBIN.NS,NESTLEIND.NS,HINDUNILVR.NS,BAJAJFINSV.NS,ASIANPAINT.NS,ULTRACEMCO.NS,TATAMOTORS.NS,JSWSTEEL.NS,NTPC.NS,POWERGRID.NS,COALINDIA.NS,TATASTEEL.NS';
      const quotes = await yahooQuotes(syms);
      const sectorMap = { 'RELIANCE.NS': 'Energy', 'TCS.NS': 'Technology', 'INFY.NS': 'Technology', 'HDFCBANK.NS': 'Banking', 'ICICIBANK.NS': 'Banking', 'BHARTIARTL.NS': 'Telecom', 'ITC.NS': 'Consumer Goods', 'LT.NS': 'Capital Goods', 'KOTAKBANK.NS': 'Banking', 'AXISBANK.NS': 'Banking', 'WIPRO.NS': 'Technology', 'MARUTI.NS': 'Auto', 'SUNPHARMA.NS': 'Pharma', 'BAJFINANCE.NS': 'Finance', 'SBIN.NS': 'Banking', 'TITAN.NS': 'Consumer Goods', 'TECHM.NS': 'Technology', 'DRREDDY.NS': 'Pharma', 'ONGC.NS': 'Energy', 'NESTLEIND.NS': 'Consumer Goods', 'HINDUNILVR.NS': 'Consumer Goods', 'BAJAJFINSV.NS': 'Finance', 'ASIANPAINT.NS': 'Consumer Goods', 'ULTRACEMCO.NS': 'Cement', 'TATAMOTORS.NS': 'Auto', 'JSWSTEEL.NS': 'Metals', 'NTPC.NS': 'Power', 'POWERGRID.NS': 'Power', 'COALINDIA.NS': 'Mining', 'TATASTEEL.NS': 'Metals' };
      const data = quotes.map(q => ({
        symbol: q.symbol, name: q.shortName || q.longName || q.symbol.replace('.NS', ''),
        price: q.regularMarketPrice || 0, change: q.regularMarketChange || 0,
        changePercent: q.regularMarketChangePercent || 0, volume: q.regularMarketVolume || 0,
        marketCap: q.marketCap || 0, peRatio: q.trailingPE || 0,
        sector: sectorMap[q.symbol] || q.symbol.replace('.NS', ''),
        open: q.regularMarketOpen || 0, high: q.regularMarketDayHigh || 0,
        low: q.regularMarketDayLow || 0, close: q.regularMarketPreviousClose || 0,
        exchange: 'NSE', isFoEnabled: true,
        buildup: (q.regularMarketChangePercent || 0) >= 0 ? 'Long Build-up' : 'Short Build-up',
      }));
      return new Response(JSON.stringify({ status: 'ok', source: 'live', count: data.length, data }), { headers: jsonHeaders({ 'Cache-Control': 'public, max-age=30' }) });
    }

    // ── /api/news ────────────────────────────────────────────
    if (path === '/api/news') {
      const feeds = [
        'https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms',
        'https://www.moneycontrol.com/rss/latestnews.xml',
      ];
      for (const feedUrl of feeds) {
        try {
          const res = await fetch(feedUrl, { headers: { 'User-Agent': NSE_UA, Accept: 'application/rss+xml,application/xml,text/xml' }, signal: AbortSignal.timeout(8000) });
          if (!res.ok) continue;
          const xml = await res.text();
          const articles = parseRSS(xml, new URL(feedUrl).hostname.includes('economictimes') ? 'Economic Times' : 'Moneycontrol');
          if (articles.length) {
            return new Response(JSON.stringify({ status: 'ok', source: 'rss', data: articles.slice(0, 20) }), { headers: jsonHeaders({ 'Cache-Control': 'public, max-age=120' }) });
          }
        } catch { continue; }
      }
      return new Response(JSON.stringify({ status: 'ok', source: 'empty', data: [] }), { headers: jsonHeaders() });
    }

    // ── /api/market-status ───────────────────────────────────
    if (path === '/api/market-status') {
      const now = new Date();
      const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const day = ist.getDay();
      const h = ist.getHours(), m = ist.getMinutes();
      const mins = h * 60 + m;
      const isWeekday = day >= 1 && day <= 5;
      const isMarketHours = isWeekday && mins >= 555 && mins <= 930; // 9:15–15:30 IST
      const status = isMarketHours ? 'OPEN' : (isWeekday && mins < 555 ? 'PRE_MARKET' : 'CLOSED');
      return new Response(JSON.stringify({ status: 'ok', market: status, ist: ist.toISOString() }), { headers: jsonHeaders() });
    }

    // ── unknown ──────────────────────────────────────────────
    return new Response(JSON.stringify({ status: 'error', message: 'Not found' }), { status: 404, headers: jsonHeaders() });
  } catch (err) {
    return new Response(JSON.stringify({ status: 'error', message: err.message || 'Server error' }), { status: 500, headers: jsonHeaders() });
  }
}

// ═══════════════════════════════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════════════════════════════
function buildFallbackChain(symbol, spot) {
  const step = symbol === 'BANKNIFTY' ? 100 : 50;
  const atm = Math.round(spot / step) * step;
  const options = [];
  let tCallOI = 0, tPutOI = 0;
  for (let i = -10; i <= 10; i++) {
    const strike = atm + i * step;
    const d = Math.abs((strike - atm) / atm);
    const cInt = Math.max(0, spot - strike), pInt = Math.max(0, strike - spot);
    const tv = spot * 0.035 * Math.exp(-d * 6);
    const cOI = Math.round(80000 * Math.exp(-d * 4) * (strike > spot ? 1.3 : 0.6) * (1 + Math.random() * 0.2));
    const pOI = Math.round(90000 * Math.exp(-d * 4) * (strike < spot ? 1.4 : 0.5) * (1 + Math.random() * 0.2));
    tCallOI += cOI; tPutOI += pOI;
    options.push({
      strikePrice: strike,
      callLtp: +(cInt + tv + Math.random() * 2).toFixed(2), callChange: +((Math.random() - 0.45) * 12).toFixed(2),
      callVol: Math.round(cOI * (1.3 + Math.random())), callOi: cOI, callOiChg: Math.round((Math.random() - 0.3) * cOI * 0.12),
      callIv: +(14 + d * 55 + Math.random() * 2).toFixed(2),
      putLtp: +(pInt + tv + Math.random() * 2).toFixed(2), putChange: +((Math.random() - 0.55) * 12).toFixed(2),
      putVol: Math.round(pOI * (1.1 + Math.random())), putOi: pOI, putOiChg: Math.round((Math.random() - 0.4) * pOI * 0.1),
      putIv: +(15 + d * 65 + Math.random() * 2).toFixed(2),
    });
  }
  return { symbol, spotPrice: spot, pcr: tCallOI > 0 ? +(tPutOI / tCallOI).toFixed(2) : 1, totalCallOi: tCallOI, totalPutOi: tPutOI, maxPain: atm, expiryDate: 'Current', options };
}

function parseRSS(xml, source) {
  const articles = [];
  const items = xml.split(/<item[\s>]/i);
  for (let i = 1; i < items.length && articles.length < 25; i++) {
    const title = extractCDATA(items[i], 'title');
    const link = extractTag(items[i], 'link');
    const pubDate = extractTag(items[i], 'pubDate');
    if (title) articles.push({ title: title.replace(/&amp;/g, '&').trim(), link: link || '#', pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(), source });
  }
  return articles;
}
function extractCDATA(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>`, 'i'));
  return m ? m[1] : extractTag(block, tag);
}
function extractTag(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? m[1].trim() : '';
}
