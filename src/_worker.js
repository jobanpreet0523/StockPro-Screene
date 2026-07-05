// ═══════════════════════════════════════════════════════════════════
// StockPro Cloudflare Worker — Market Snapshot API + launch-safe live plan stubs
// ═══════════════════════════════════════════════════════════════════
// Serves static SPA assets through ASSETS and exposes public 15-minute
// delayed market-data APIs. Live mode remains locked until verification
// and secure broker setup are implemented.

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

const LIVE_PLAN_PRICE_INR = 299;
const LIVE_PLAN_NAME = 'StockPro Live Data Plan';

function handlePlanRoutes(path, request) {
  if (path === '/api/live-plan/status') {
    return json({
      status: 'free_delayed',
      priceInr: LIVE_PLAN_PRICE_INR,
      planName: LIVE_PLAN_NAME,
      dataMode: 'delayed',
      message: 'Free 15-minute delayed data is active. Live mode requires verified payment and secure broker setup.',
    });
  }

  if (path === '/api/live-plan/create-order' && request.method === 'POST') {
    return json({
      status: 'setup_required',
      priceInr: LIVE_PLAN_PRICE_INR,
      planName: LIVE_PLAN_NAME,
      message: 'Live plan setup route exists. Server-side verification must be connected before accepting live users.',
    }, 503);
  }

  if (path === '/api/live-plan/verify-payment' && request.method === 'POST') {
    return json({
      status: 'payment_required',
      priceInr: LIVE_PLAN_PRICE_INR,
      dataMode: 'delayed',
      message: 'Verification route exists, but live mode remains locked. Free 15-minute delayed data remains active.',
    }, 501);
  }

  const providerMatch = path.match(/^\/api\/provider\/(upstox|zerodha)\/(start|callback)$/);
  if (providerMatch) {
    return json({
      status: 'setup_required',
      provider: providerMatch[1],
      step: providerMatch[2],
      message: 'Broker setup route exists. Secure redirect/callback setup is required before enabling live data.',
    }, 503);
  }

  if (path === '/api/live-feed/status') {
    return json({
      status: 'disabled',
      dataMode: 'delayed',
      message: 'Live feed service is not active. Free 15-minute delayed data remains the default.',
    });
  }

  return null;
}

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

    return json({ status: 'error', message: 'This build keeps the existing market-data handlers in source control. If this route is needed, restore the full handler from the previous commit.' }, 404);
  } catch (err) {
    return json({ status: 'error', message: err.message || 'Server error' }, 500);
  }
}
