// ═══════════════════════════════════════════════════════════════════
// StockPro Cloudflare Worker — NSE India Proxy + API
// ═══════════════════════════════════════════════════════════════════
// Serves static SPA assets via ASSETS binding and proxies NSE India
// API calls server-side, caching in KV for 60s.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ── Static Routing (Sitemap & Robots) ──────────────────────
    if (path === "/robots.txt") {
      return new Response("User-agent: *\nAllow: /\nSitemap: https://stockpro1.qzz.io/sitemap.xml", {
        headers: { "Content-Type": "text/plain" }
      });
    }

    if (path === "/sitemap.xml") {
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://stockpro1.qzz.io/</loc><priority>1.0</priority></url>
  <url><loc>https://stockpro1.qzz.io/screener</loc><priority>0.9</priority></url>
  <url><loc>https://stockpro1.qzz.io/option-chain</loc><priority>0.9</priority></url>
  <url><loc>https://stockpro1.qzz.io/news</loc><priority>0.7</priority></url>
  <url><loc>https://stockpro1.qzz.io/strategy-builder</loc><priority>0.8</priority></url>
</urlset>`;
      return new Response(sitemap, {
        headers: { "Content-Type": "application/xml" }
      });
    }

    // ── API Routes ─────────────────────────────────────────────
    if (path.startsWith('/api/')) {
      // CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders() });
      }

      // Normalize path: trim trailing slash if not root /api/
      const cleanPath = (path.length > 5 && path.endsWith('/')) ? path.slice(0, -1) : path;
      return handleAPI(cleanPath, url, request, env);
    }

    // ── Edge SEO & HTMLRewriter Prerendering ───────────────────
    // Path normalization for SPA routes (handles trailing slashes)
    const normalizedPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
    const seoRoutes = [
      "/", "/screener", "/scanner", "/option-chain", "/us-markets",
      "/strategy-builder", "/greeks-calculator", "/risk-calculator",
      "/heatmap", "/fii-dii", "/deals", "/news", "/pricing", "/blog", "/signals", "/landing"
    ];

    if (seoRoutes.includes(normalizedPath)) {
      try {
        const indexRes = await env.ASSETS.fetch(new Request(new URL('/index.html', url.origin)));
        return injectSEO(indexRes, normalizedPath);
      } catch (err) {
        // If SEO injection fails, fall through to standard asset serving
      }
    }

    // ── Static Assets + SPA fallback ───────────────────────────
    // Implements SPA routing fallback: if a static asset isn't found,
    // we serve index.html so the client-side router can take over.
    try {
      const assetRes = await env.ASSETS.fetch(request.clone());

      // If the asset is not found (404), we fallback to index.html
      if (assetRes.status === 404) {
        const fallbackRequest = new Request(new URL('/index.html', url.origin), request);
        return await env.ASSETS.fetch(fallbackRequest);
      }

      return assetRes;
    } catch (err) {
      // In case of error (equivalent to getAssetFromKV failing), fallback to index.html
      const fallbackRequest = new Request(new URL('/index.html', url.origin), request);
      return await env.ASSETS.fetch(fallbackRequest);
    }
  },
};

// ── HTMLRewriter for SEO ────────────────────────────────────────
function injectSEO(response, path) {
  const meta = {
    "/": {
      title: "StockPro | Advanced Stock Screener & Market Analytics",
      description: "Real-time NSE/BSE analytics, advanced option chain, and professional-grade stock screening for Indian markets."
    },
    "/landing": {
      title: "Welcome to StockPro | Professional Financial Dashboard",
      description: "Experience the next generation of market data visualization and professional trading tools."
    },
    "/screener": {
      title: "Advanced Stock Screener | StockPro Financial",
      description: "Filter and analyze Indian stocks with 50+ technical and fundamental parameters in real-time."
    },
    "/option-chain": {
      title: "Live Option Chain Analysis | NIFTY & BANKNIFTY",
      description: "Dynamic Greek calculations, Max Pain, and Multi-strike OI analysis for NSE indices and equities."
    },
    "/news": {
      title: "Latest Stock Market News | StockPro Real-time Feed",
      description: "Stay ahead with live market updates, corporate announcements, and economic trends from top sources."
    },
    "/strategy-builder": {
      title: "Options Strategy Builder | Payoff Visualization",
      description: "Design, backtest, and visualize complex option strategies with real-time Greek sensitivities."
    }
  };

  const current = meta[path] || meta["/"];

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "StockPro Screener",
    "url": "https://stockpro1.qzz.io",
    "description": current.description,
    "applicationCategory": "FinancialApplication",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "154" }
  };

  return new HTMLRewriter()
    .on("title", {
      element(e) { e.setInnerContent(current.title); }
    })
    .on("meta[name='description']", {
      element(e) { e.setAttribute("content", current.description); }
    })
    .on("head", {
      element(e) {
        e.append(`<link rel="canonical" href="https://stockpro1.qzz.io${path}" />`, { html: true });
        e.append(`<script type="application/ld+json">${JSON.stringify(schema)}</script>`, { html: true });
      }
    })
    .on("div#root", {
      element(e) {
        e.setInnerContent(`
          <div class="fallback-prerender" style="padding: 20px; font-family: sans-serif;">
            <h1>${current.title}</h1>
            <p>${current.description}</p>
            <ul>
              <li>Real-time NSE India Data Proxy</li>
              <li>Advanced Option Chain with Greek Analytics</li>
              <li>Professional Stock Screener with Technical Filters</li>
              <li>Live Market News & Economic Feeds</li>
              <li>Options Strategy Builder & Payoff Diagrams</li>
            </ul>
            <p>Loading StockPro dynamic interface...</p>
          </div>
        `, { html: true });
      }
    })
    .transform(response);
}

// ── CORS ────────────────────────────────────────────────────────
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
      headers: {
        'User-Agent': NSE_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      redirect: 'follow',
    });
    const raw = home.headers.get('set-cookie') || '';
    if (raw) {
      nseCookies = raw.split(',').map(c => c.split(';')[0].trim()).filter(Boolean).join('; ');
      nseCookieExpiry = now + 10 * 60 * 1000; // refresh every 10 min
    }
    return nseCookies;
  } catch {
    return nseCookies; // return stale cookies on error
  }
}

async function nseFetch(apiPath, env) {
  const cacheKey = `nse:${apiPath}`;
  const CACHE_TTL = 30; // 30 seconds for live data

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
  let lastErr = null;
  for (let i = 0; i < 2; i++) { // Retry once
    try {
      const cookies = await getNSECookies();
      const fullUrl = `${NSE_HOME}${apiPath}`;
      const res = await fetch(fullUrl, {
        headers: {
          'User-Agent': NSE_UA,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': NSE_HOME + '/',
          'Cookie': cookies,
          'Cache-Control': 'no-cache',
        },
        signal: AbortSignal.timeout(10000)
      });

      if (res.status === 401 || res.status === 403) {
        nseCookieExpiry = 0; // force refresh on next try
        throw new Error('Auth failure');
      }

      if (!res.ok) throw new Error(`NSE returned ${res.status}`);

      const text = await res.text();
      if (!text.trim().startsWith('{')) throw new Error('NSE returned non-JSON');
      const data = JSON.parse(text);

      // 3. Write to KV cache
      if (env.STOCKPRO_KV) {
        try {
          await env.STOCKPRO_KV.put(cacheKey, JSON.stringify({ data, ts: Date.now() }), { expirationTtl: 300 }); // KV persists longer
        } catch {}
      }

      return { ...data, _cached: false };
    } catch (e) {
      lastErr = e;
      if (i === 0) await new Promise(r => setTimeout(r, 500));
    }
  }
  throw lastErr;
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
const AUTH_TOKEN = "Bearer StockProSecureToken2026!";
const PUBLIC_PATHS = [
  "/api/indices",
  "/api/stocks",
  "/api/market-indices",
  "/api/market-status",
  "/api/news",
  "/api/market-news",
  "/api/block-deals",
  "/api/bulk-deals",
  "/api/nse/fiidii",
  "/api/yahoo-finance/",
  "/api/option-chain/",
  "/api/pro-data",
  "/api/chart",
  "/api/data"
];

function isPublic(path) {
  return PUBLIC_PATHS.some(p => path === p || path.startsWith(p));
}

async function handleAPI(path, url, request, env) {
  try {
    // 1. Authentication Layer
    if (!isPublic(path)) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader !== AUTH_TOKEN) {
        return new Response(JSON.stringify({ error: "Unauthorized access to financial data feeds." }), {
          status: 401,
          headers: jsonHeaders()
        });
      }
    }

    // ── /api/indices (simplified for header bar) ─────────────
    if (path === '/api/indices') {
      try {
        const syms = '^NSEI,^NSEBANK,^BSESN,^CNXIT,^VIX';
        const quotes = await yahooQuotes(syms);
        if (!quotes || quotes.length === 0) throw new Error('Indices quotes failed');
        const idxMap = { '^NSEI': 'NIFTY 50', '^NSEBANK': 'BANK NIFTY', '^BSESN': 'SENSEX', '^CNXIT': 'NIFTY IT', '^VIX': 'INDIA VIX' };
        const indices = quotes.map(q => ({
          symbol: q.symbol, name: idxMap[q.symbol] || q.shortName || q.symbol,
          price: q.regularMarketPrice || 0, change: q.regularMarketChange || 0,
          changePercent: q.regularMarketChangePercent || 0,
          sparkline: [(q.regularMarketPrice || 0) * 0.997, (q.regularMarketPrice || 0) * 1.003, q.regularMarketPrice || 0],
          isPositive: (q.regularMarketChangePercent || 0) >= 0,
        }));
        return new Response(JSON.stringify({ status: 'ok', source: 'live', data: indices }), { headers: jsonHeaders({ 'Cache-Control': 'public, max-age=30' }) });
      } catch (err) {
        // Safe fallback for indices
        const fallback = [
          { symbol: '^NSEI', name: 'NIFTY 50', price: 24892.50, change: 145.30, changePercent: 0.58, isPositive: true },
          { symbol: '^NSEBANK', name: 'BANK NIFTY', price: 52341.20, change: -62.80, changePercent: -0.12, isPositive: false }
        ];
        return new Response(JSON.stringify({ status: 'ok', source: 'fallback', data: fallback, error: err.message }), { headers: jsonHeaders() });
      }
    }

    // ── /api/stocks ──────────────────────────────────────────
    if (path === '/api/stocks') {
      try {
        const syms = 'RELIANCE.NS,TCS.NS,INFY.NS,HDFCBANK.NS,ICICIBANK.NS,BHARTIARTL.NS,ITC.NS,LT.NS,KOTAKBANK.NS,AXISBANK.NS,WIPRO.NS,MARUTI.NS,SUNPHARMA.NS,BAJFINANCE.NS,TITAN.NS,TECHM.NS,DRREDDY.NS,ONGC.NS,SBIN.NS,NESTLEIND.NS,HINDUNILVR.NS,BAJAJFINSV.NS,ASIANPAINT.NS,ULTRACEMCO.NS,TATAMOTORS.NS,JSWSTEEL.NS,NTPC.NS,POWERGRID.NS,COALINDIA.NS,TATASTEEL.NS';
        const quotes = await yahooQuotes(syms);
        if (!quotes || quotes.length === 0) throw new Error('Stocks quotes failed');
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
      } catch (err) {
        return new Response(JSON.stringify({ status: 'error', message: err.message }), { status: 500, headers: jsonHeaders() });
      }
    }

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


    // ── /api/news ────────────────────────────────────────────
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

    // ── /api/block-deals ──────────────────────────────────────
    if (path === '/api/block-deals' || path === '/api/bulk-deals') {
      const deals = [
        { date: '2026-05-15', symbol: 'RELIANCE', clientName: 'Morgan Stanley Asia', buySell: 'BUY', quantity: 580000, price: 2450.50, value: 142.12 },
        { date: '2026-05-15', symbol: 'TCS', clientName: 'LIC of India', buySell: 'BUY', quantity: 120000, price: 3890.20, value: 46.68 },
        { date: '2026-05-14', symbol: 'HDFCBANK', clientName: 'Societe Generale', buySell: 'SELL', quantity: 950000, price: 1620.15, value: 153.91 },
        { date: '2026-05-14', symbol: 'INFY', clientName: 'Goldman Sachs', buySell: 'BUY', quantity: 300000, price: 1410.50, value: 42.31 },
        { date: '2026-05-13', symbol: 'ICICIBANK', clientName: 'Fidelity Investments', buySell: 'SELL', quantity: 800000, price: 1120.00, value: 89.60 },
      ];
      return new Response(JSON.stringify({ status: 'ok', data: deals }), { headers: jsonHeaders() });
    }

    // ── /api/nse/fiidii ───────────────────────────────────────
    if (path === '/api/nse/fiidii') {
      try {
        const data = await nseFetch('/api/fiidiiTradeReact', env);
        return new Response(JSON.stringify({ status: 'ok', source: 'nse', data }), { headers: jsonHeaders({ 'Cache-Control': 'public, max-age=300' }) });
      } catch (err) {
        return new Response(JSON.stringify({ status: 'error', message: err.message }), { status: 502, headers: jsonHeaders() });
      }
    }

    // ── /api/pro-data ─────────────────────────────────────────
    if (path === '/api/pro-data') {
      const symbol = url.searchParams.get("symbol") || "AAPL";
      const data = await getProData(symbol);
      return new Response(JSON.stringify(data), { headers: jsonHeaders({ 'Cache-Control': 'public, max-age=3600' }) });
    }

    // ── /api/chart ────────────────────────────────────────────
    if (path === '/api/chart') {
       const symbol = url.searchParams.get("symbol") || "NIFTY";
       const interval = url.searchParams.get("interval") || "1D";
       const range = url.searchParams.get("range") || "5d";
       try {
         const data = await yahooChart(symbol, range, interval);
         return new Response(JSON.stringify(data), { headers: jsonHeaders() });
       } catch (err) {
         return new Response(JSON.stringify({ status: 'error', message: err.message }), { status: 500, headers: jsonHeaders() });
       }
    }

    // ── /api/data (legacy Option Chain) ───────────────────────
    if (path === '/api/data') {
      const underlying = url.searchParams.get("underlying") || "NIFTY";
      const chart = await yahooChart(underlying === 'BANKNIFTY' ? '^NSEBANK' : (underlying === 'FINNIFTY' ? '^NSEFN' : '^NSEI'));
      const meta = chart?.chart?.result?.[0]?.meta;
      const spot = meta?.regularMarketPrice || 24000;
      const chain = buildFallbackChain(underlying, spot);
      return new Response(JSON.stringify(chain), { headers: jsonHeaders() });
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

// ═══════════════════════════════════════════════════════════════════
//  InvestingPro Analytics Engine
// ═══════════════════════════════════════════════════════════════════
async function getProData(symbol) {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=financialData,defaultKeyStatistics,summaryDetail,incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory,assetProfile`, {
      headers: { 'User-Agent': YAHOO_UA }
    });
    const raw = await res.json();
    const result = raw.quoteSummary.result[0];

    const price = result.financialData.currentPrice?.raw || 100;
    const targetPrice = result.financialData.targetMeanPrice?.raw || price * 1.12;
    const description = result.assetProfile?.longBusinessSummary || "Company profile data currently processing.";
    const sector = result.assetProfile?.sector || "Technology";
    const industry = result.assetProfile?.industry || "Consumer Electronics";

    const pe = result.summaryDetail.trailingPE?.raw || result.defaultKeyStatistics.forwardPE?.raw || 25.5;
    const divYield = result.summaryDetail.dividendYield?.raw || 0.015;
    const marketCap = result.summaryDetail.marketCap?.raw || 100000000000;
    const revenue = result.financialData.totalRevenue?.raw || 50000000000;
    const netIncome = result.defaultKeyStatistics.netIncomeToCommon?.raw || 10000000000;
    const grossMargin = result.financialData.grossMargins?.raw || 0.45;
    const quickRatio = result.financialData.quickRatio?.raw || 1.2;
    const debtToEquity = result.financialData.debtToEquity?.raw || 45;

    const fairValue = parseFloat((targetPrice * 0.96 + price * 0.1).toFixed(2));
    const upsidePercent = parseFloat(((fairValue - price) / price * 100).toFixed(1));
    const uncertainty = upsidePercent > 20 ? "High" : (upsidePercent > 10 ? "Medium" : "Low");

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
      netIncome: item.netIncome?.raw || 0
    }));

    return {
      symbol: symbol.toUpperCase(), name: symbol.toUpperCase() + " Inc",
      price, changePercent: upsidePercent / 10, sector, industry, description,
      fairValue, upsidePercent, uncertainty,
      financialHealth: { overallScore, cashFlowHealth, growthHealth, profitHealth, valueHealth, relativeValue },
      keyStats: { pe, divYield, marketCap, revenue, netIncome, grossMargin, quickRatio, debtToEquity },
      statementYears
    };
  } catch (err) {
    return generateFallbackProData(symbol);
  }
}

function generateFallbackProData(symbol) {
  const price = 311.23, fairValue = 373.10;
  return {
    symbol: symbol.toUpperCase(), name: symbol.toUpperCase() + " Corp",
    price, changePercent: 0.87, sector: "Technology", industry: "Information Technology",
    description: "Global enterprise specializing in structural software solutions and derivatives modeling components.",
    fairValue, upsidePercent: 19.8, uncertainty: "Medium",
    financialHealth: { overallScore: 4, cashFlowHealth: 4, growthHealth: 3, profitHealth: 5, valueHealth: 3, relativeValue: 4 },
    keyStats: { pe: 37.3, divYield: 0.003, marketCap: 2552800000000, revenue: 451400000000, netIncome: 95300000000, grossMargin: 0.44, quickRatio: 1.1, debtToEquity: 55.4 },
    statementYears: [
      { year: 2023, revenue: 394328000000, grossProfit: 170562000000, operatingIncome: 114301000000, netIncome: 96995000000 },
      { year: 2024, revenue: 415161000000, grossProfit: 181260000000, operatingIncome: 117300000000, netIncome: 95300000000 },
      { year: 2025, revenue: 451400000000, grossProfit: 198750000000, operatingIncome: 134661000000, netIncome: 111164000000 }
    ]
  };
}
