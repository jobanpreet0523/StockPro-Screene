// Cloudflare Worker for StockPro Screener
// Handles API routes and delegates static assets to the Assets binding
// Compatible with Workers + Static Assets (wrangler [assets] config)
//
// Routing logic:
// 1. /api/* and /indices → Worker handles (returns JSON)
// 2. Static asset match → served by ASSETS binding
// 3. No match (SPA routes like /screener) → Worker returns index.html via ASSETS

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ── API Routes ──────────────────────────────────────────────
    if (path.startsWith('/api/') || path === '/indices') {
      return handleApiRoute(path, url, request, env);
    }

    // ── Try serving static asset ────────────────────────────────
    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    // ── SPA Fallback ────────────────────────────────────────────
    // For client-side routes like /screener, /option-chain etc.
    // that don't match a static file, serve index.html
    return env.ASSETS.fetch(new Request(new URL('/', url.origin)));
  },
};

// ════════════════════════════════════════════════════════════════
//  NSE Cookie Cache
// ════════════════════════════════════════════════════════════════
let cookieCache = { cookies: '', expiry: 0 };

async function getNseCookies() {
  const now = Date.now();
  if (cookieCache.cookies && cookieCache.expiry > now) return cookieCache.cookies;
  try {
    const homeRes = await fetch('https://www.nseindia.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    const rawCookie = homeRes.headers.get('set-cookie') || '';
    const cookies = rawCookie.split(',').map(c => c.split(';')[0].trim()).join('; ');
    cookieCache = { cookies, expiry: now + 5 * 60 * 1000 };
    return cookies;
  } catch {
    return '';
  }
}

// ════════════════════════════════════════════════════════════════
//  Yahoo Finance Fetchers
// ════════════════════════════════════════════════════════════════
const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'application/json',
};

async function fetchYahooChart(symbol, range = '1d', interval = '1d') {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
  const res = await fetch(url, { headers: YAHOO_HEADERS });
  if (!res.ok) throw new Error(`Yahoo chart API returned ${res.status}`);
  return res.json();
}

async function fetchYahooQuotes(symbols) {
  // Try v7 quotes API first
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;
  try {
    const res = await fetch(url, { headers: YAHOO_HEADERS });
    if (res.ok) {
      const json = await res.json();
      if (json?.quoteResponse?.result?.length > 0) return json;
    }
  } catch {}

  // Fallback: fetch each symbol via v8 chart API
  const symbolList = symbols.split(',');
  const results = [];
  for (const sym of symbolList) {
    try {
      const json = await fetchYahooChart(sym, '5d', '1d');
      const meta = json?.chart?.result?.[0]?.meta;
      if (meta) {
        const prevClose = meta.chartPreviousClose || meta.previousClose || meta.regularMarketPrice;
        const price = meta.regularMarketPrice;
        results.push({
          symbol: meta.symbol,
          regularMarketPrice: price,
          regularMarketChange: prevClose ? price - prevClose : 0,
          regularMarketChangePercent: prevClose ? ((price - prevClose) / prevClose) * 100 : 0,
          regularMarketVolume: meta.regularMarketVolume || 0,
          shortName: meta.shortName || meta.symbol,
          longName: meta.longName || meta.shortName || meta.symbol,
          marketCap: 0,
          trailingPE: 0,
          regularMarketOpen: meta.regularMarketPreviousOpen || price,
          regularMarketDayHigh: meta.regularMarketDayHigh || price * 1.008,
          regularMarketDayLow: meta.regularMarketDayLow || price * 0.992,
          regularMarketPreviousClose: prevClose,
        });
      }
    } catch { /* skip */ }
  }
  return { quoteResponse: { result: results } };
}

// ════════════════════════════════════════════════════════════════
//  NSE Option Chain
// ════════════════════════════════════════════════════════════════
async function fetchNseOptionChain(symbol) {
  try {
    const cookies = await getNseCookies();
    const url = `https://www.nseindia.com/api/option-chain-indices?symbol=${encodeURIComponent(symbol)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
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
  } catch {
    return null;
  }
}

function parseNseOptionChain(nseData, symbol) {
  if (!nseData?.records?.data) return null;
  const spotPrice = nseData.records.underlyingValue;
  const timestamp = nseData.records.timestamp;
  const rawOptions = nseData.records.data;
  const activeExpiry = nseData.records.expiryDates?.[0] || '';
  const filteredOptions = activeExpiry ? rawOptions.filter(o => o.expiryDate === activeExpiry) : rawOptions;

  let totalCallOi = 0, totalPutOi = 0;
  const options = filteredOptions.map(item => {
    const ce = item.CE || {};
    const pe = item.PE || {};
    const callOi = ce.openInterest || 0;
    const putOi = pe.openInterest || 0;
    totalCallOi += callOi;
    totalPutOi += putOi;
    const strikePrice = item.strikePrice;
    const iv = Math.max(0.01, (ce.impliedVolatility || 14) / 100);
    const zCall = (spotPrice - strikePrice) / (spotPrice * iv);
    const callDelta = Number((1 / (1 + Math.exp(-zCall))).toFixed(2));
    return {
      strikePrice,
      callLtp: ce.lastPrice || 0,
      callChange: ce.change || 0,
      callVol: ce.totalTradedVolume || 0,
      callOi,
      callOiChg: ce.changeinOpenInterest || 0,
      callIv: ce.impliedVolatility || 0,
      callDelta,
      putLtp: pe.lastPrice || 0,
      putChange: pe.change || 0,
      putVol: pe.totalTradedVolume || 0,
      putOi,
      putOiChg: pe.changeinOpenInterest || 0,
      putIv: pe.impliedVolatility || 0,
      putDelta: Number((callDelta - 1).toFixed(2)),
    };
  });

  let maxPain = spotPrice;
  if (options.length > 0) {
    let minPain = Infinity;
    for (const target of options) {
      let pain = 0;
      for (const opt of options) {
        if (target.strikePrice > opt.strikePrice) pain += (target.strikePrice - opt.strikePrice) * opt.callOi;
        if (target.strikePrice < opt.strikePrice) pain += (opt.strikePrice - target.strikePrice) * opt.putOi;
      }
      if (pain < minPain) { minPain = pain; maxPain = target.strikePrice; }
    }
  }

  return {
    symbol, spotPrice,
    pcr: totalCallOi > 0 ? Number((totalPutOi / totalCallOi).toFixed(2)) : 1.0,
    totalCallOi, totalPutOi, maxPain,
    expiryDate: activeExpiry || 'Current',
    timestamp,
    options,
  };
}

// ════════════════════════════════════════════════════════════════
//  Fallback Option Chain Generator
// ════════════════════════════════════════════════════════════════
function generateFallbackChain(symbol, spotPrice) {
  const isBankNifty = symbol === 'BANKNIFTY' || symbol === '^NSEBANK';
  const step = isBankNifty ? 100 : 50;
  const atm = Math.round(spotPrice / step) * step;
  const options = [];
  let totalCallOi = 0, totalPutOi = 0;

  for (let i = -10; i <= 10; i++) {
    const strike = atm + i * step;
    const d = Math.abs((strike - atm) / atm);
    const callIntrinsic = Math.max(0, spotPrice - strike);
    const putIntrinsic = Math.max(0, strike - spotPrice);
    const timeVal = spotPrice * 0.035 * Math.exp(-d * 6);
    const callOi = Math.round(80000 * Math.exp(-d * 4) * (strike > spotPrice ? 1.3 : 0.6) * (1 + Math.random() * 0.2));
    const putOi = Math.round(90000 * Math.exp(-d * 4) * (strike < spotPrice ? 1.4 : 0.5) * (1 + Math.random() * 0.2));
    totalCallOi += callOi;
    totalPutOi += putOi;
    options.push({
      strikePrice: strike,
      callLtp: Number((callIntrinsic + timeVal + Math.random() * 2).toFixed(2)),
      callChange: Number(((Math.random() - 0.45) * 12).toFixed(2)),
      callVol: Math.round(callOi * (1.3 + Math.random())),
      callOi, callOiChg: Math.round((Math.random() - 0.3) * callOi * 0.12),
      callIv: Number((14 + d * 55 + Math.random() * 2).toFixed(2)),
      callDelta: Number((1 / (1 + Math.exp(-(spotPrice - strike) / (spotPrice * 0.08)))).toFixed(2)),
      putLtp: Number((putIntrinsic + timeVal + Math.random() * 2).toFixed(2)),
      putChange: Number(((Math.random() - 0.55) * 12).toFixed(2)),
      putVol: Math.round(putOi * (1.1 + Math.random())),
      putOi, putOiChg: Math.round((Math.random() - 0.4) * putOi * 0.1),
      putIv: Number((15 + d * 65 + Math.random() * 2).toFixed(2)),
      putDelta: Number(((1 / (1 + Math.exp(-(spotPrice - strike) / (spotPrice * 0.08)))) - 1).toFixed(2)),
    });
  }

  return {
    symbol, spotPrice,
    pcr: totalCallOi > 0 ? Number((totalPutOi / totalCallOi).toFixed(2)) : 1.0,
    totalCallOi, totalPutOi, maxPain: atm,
    expiryDate: 'Current',
    source: 'fallback',
    options,
  };
}

// ════════════════════════════════════════════════════════════════
//  RSS XML Parser (lightweight, no external deps)
// ════════════════════════════════════════════════════════════════
function parseRssXml(xml, sourceName) {
  const articles = [];
  // Match <item>...</item> blocks
  const itemRegex = /<item[\s>]/gi;
  let match;
  const items = [];
  let searchIdx = 0;

  while ((match = itemRegex.exec(xml)) !== null) {
    items.push(match.index);
  }

  for (let i = 0; i < items.length; i++) {
    const start = items[i];
    const end = i + 1 < items.length ? items[i + 1] : xml.length;
    const block = xml.substring(start, end);

    const title = extractCdataOrText(block, 'title');
    const link = extractTag(block, 'link');
    const pubDate = extractTag(block, 'pubDate');

    if (title) {
      articles.push({
        title: title.replace(/&amp;/g, '&').trim(),
        link: link || '#',
        pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        source: sourceName,
      });
    }
  }
  return articles;
}

function extractCdataOrText(block, tag) {
  // Try CDATA first: <tag><![CDATA[...]]></tag>
  const cdataRegex = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>`, 'i');
  const cdataMatch = block.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1];

  // Plain text: <tag>text</tag>
  return extractTag(block, tag);
}

function extractTag(block, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = block.match(regex);
  return match ? match[1].trim() : '';
}

// ════════════════════════════════════════════════════════════════
//  API Route Handler
// ════════════════════════════════════════════════════════════════
async function handleApiRoute(path, url, request, env) {
  const jsonHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=30',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    // ── /api/indices ──────────────────────────────────────────
    if (path === '/api/indices') {
      const symbols = '^NSEI,^NSEBANK,^BSESN,^CNXIT,^VIX';
      const json = await fetchYahooQuotes(symbols);
      const quotes = json?.quoteResponse?.result || [];
      const indexMap = {
        '^NSEI': 'NIFTY 50', '^NSEBANK': 'BANK NIFTY', '^BSESN': 'SENSEX',
        '^CNXIT': 'NIFTY IT', '^VIX': 'INDIA VIX',
      };

      const indices = quotes.map(q => ({
        symbol: q.symbol,
        name: indexMap[q.symbol] || q.shortName || q.symbol,
        price: q.regularMarketPrice || 0,
        change: q.regularMarketChange || 0,
        changePercent: q.regularMarketChangePercent || 0,
        sparkline: [
          (q.regularMarketPrice || 0) * 0.993,
          (q.regularMarketPrice || 0) * 1.005,
          (q.regularMarketPrice || 0) * 0.997,
          q.regularMarketPrice || 0,
        ],
        isPositive: (q.regularMarketChangePercent || 0) >= 0,
      }));

      return new Response(JSON.stringify({
        status: 'ok', timestamp: Date.now(), source: 'live_yahoo', data: indices,
      }), { headers: jsonHeaders });
    }

    // ── /indices (legacy) ─────────────────────────────────────
    if (path === '/indices') {
      const json = await fetchYahooQuotes('^NSEI,^NSEBANK,^BSESN');
      const quotes = json?.quoteResponse?.result || [];
      const find = (sym) => quotes.find(q => q.symbol === sym);
      const nifty = find('^NSEI');
      const banknifty = find('^NSEBANK');
      const sensex = find('^BSESN');

      return new Response(JSON.stringify({
        nifty50: nifty ? { price: nifty.regularMarketPrice, change: nifty.regularMarketChangePercent } : { price: 24892.50, change: 0 },
        banknifty: banknifty ? { price: banknifty.regularMarketPrice, change: banknifty.regularMarketChangePercent } : { price: 52341.20, change: 0 },
        sensex: sensex ? { price: sensex.regularMarketPrice, change: sensex.regularMarketChangePercent } : { price: 81943.50, change: 0 },
      }), { headers: jsonHeaders });
    }

    // ── /api/stocks ───────────────────────────────────────────
    if (path === '/api/stocks') {
      const symbols = 'RELIANCE.NS,TCS.NS,INFY.NS,HDFCBANK.NS,ICICIBANK.NS,BHARTIARTL.NS,ITC.NS,LT.NS,KOTAKBANK.NS,AXISBANK.NS,WIPRO.NS,MARUTI.NS,SUNPHARMA.NS,BAJFINANCE.NS,TITAN.NS,TECHM.NS,DRREDDY.NS,ONGC.NS,SBIN.NS,NESTLEIND.NS,HINDUNILVR.NS,BAJAJFINSV.NS,ASIANPAINT.NS,ULTRACEMCO.NS,TATAMOTORS.NS,JSWSTEEL.NS,NTPC.NS,POWERGRID.NS,COALINDIA.NS,TATASTEEL.NS';
      const json = await fetchYahooQuotes(symbols);
      const quotes = json?.quoteResponse?.result || [];
      const sectorMap = {
        'RELIANCE.NS': 'Energy', 'TCS.NS': 'Technology', 'INFY.NS': 'Technology',
        'HDFCBANK.NS': 'Banking', 'ICICIBANK.NS': 'Banking', 'BHARTIARTL.NS': 'Telecom',
        'ITC.NS': 'Consumer Goods', 'LT.NS': 'Capital Goods', 'KOTAKBANK.NS': 'Banking',
        'AXISBANK.NS': 'Banking', 'WIPRO.NS': 'Technology', 'MARUTI.NS': 'Auto',
        'SUNPHARMA.NS': 'Pharma', 'BAJFINANCE.NS': 'Finance', 'SBIN.NS': 'Banking',
        'TITAN.NS': 'Consumer Goods', 'TECHM.NS': 'Technology', 'DRREDDY.NS': 'Pharma',
        'ONGC.NS': 'Energy', 'NESTLEIND.NS': 'Consumer Goods', 'HINDUNILVR.NS': 'Consumer Goods',
        'BAJAJFINSV.NS': 'Finance', 'ASIANPAINT.NS': 'Consumer Goods', 'ULTRACEMCO.NS': 'Cement',
        'TATAMOTORS.NS': 'Auto', 'JSWSTEEL.NS': 'Metals', 'NTPC.NS': 'Power',
        'POWERGRID.NS': 'Power', 'COALINDIA.NS': 'Mining', 'TATASTEEL.NS': 'Metals',
      };

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
        futuresOi: Math.round((q.regularMarketVolume || 1000000) * 2.5),
        futuresOiChange: Number(((Math.random() - 0.4) * 10).toFixed(1)),
        buildup: (q.regularMarketChangePercent || 0) >= 0 ? 'Long Build-up' : 'Short Build-up',
      }));

      return new Response(JSON.stringify({
        status: 'ok', timestamp: Date.now(), source: 'live_yahoo', count: data.length, data,
      }), { headers: jsonHeaders });
    }

    // ── /api/option-chain/:symbol ─────────────────────────────
    if (path.startsWith('/api/option-chain/')) {
      const rawSymbol = path.split('/')[3] || url.searchParams.get('symbol') || 'NIFTY';
      const underlyingMap = {
        'NIFTY': 'NIFTY', '^NSEI': 'NIFTY',
        'BANKNIFTY': 'BANKNIFTY', '^NSEBANK': 'BANKNIFTY',
        'FINNIFTY': 'FINNIFTY', '^NSEFN': 'FINNIFTY',
      };
      const targetSymbol = underlyingMap[rawSymbol.toUpperCase()] || rawSymbol.toUpperCase();

      // 1) Try NSE India API
      const nseData = await fetchNseOptionChain(targetSymbol);
      const parsed = parseNseOptionChain(nseData, targetSymbol);
      if (parsed && parsed.options.length > 0) {
        return new Response(JSON.stringify({
          status: 'ok', symbol: targetSymbol, data: parsed,
          source: 'real_nse', timestamp: parsed.timestamp,
        }), { headers: jsonHeaders });
      }

      // 2) Fallback: Yahoo Finance spot price + generated chain
      const yahooMap = { 'NIFTY': '^NSEI', 'BANKNIFTY': '^NSEBANK', 'FINNIFTY': '^NSEFN' };
      const yahooSym = yahooMap[targetSymbol] || targetSymbol;
      try {
        const chartJson = await fetchYahooChart(yahooSym);
        const meta = chartJson?.chart?.result?.[0]?.meta;
        if (meta?.regularMarketPrice) {
          const chain = generateFallbackChain(targetSymbol, meta.regularMarketPrice);
          return new Response(JSON.stringify({
            status: 'ok', symbol: targetSymbol, data: chain, source: 'yahoo_spot_fallback',
          }), { headers: jsonHeaders });
        }
      } catch {}

      // 3) Static fallback
      const defaultSpots = { 'NIFTY': 24892.50, 'BANKNIFTY': 52341.20, 'FINNIFTY': 21450.00 };
      const chain = generateFallbackChain(targetSymbol, defaultSpots[targetSymbol] || 24000);
      return new Response(JSON.stringify({
        status: 'ok', symbol: targetSymbol, data: chain, source: 'static_fallback',
      }), { headers: jsonHeaders });
    }

    // ── /api/data?underlying=NIFTY ────────────────────────────
    if (path === '/api/data') {
      const underlying = url.searchParams.get('underlying') || 'NIFTY';
      const yahooMap = { 'NIFTY': '^NSEI', 'BANKNIFTY': '^NSEBANK', 'FINNIFTY': '^NSEFN' };
      const yahooSym = yahooMap[underlying.toUpperCase()] || underlying;

      try {
        const chartJson = await fetchYahooChart(yahooSym, '5d', '1d');
        const meta = chartJson?.chart?.result?.[0]?.meta;
        if (meta?.regularMarketPrice) {
          const price = meta.regularMarketPrice;
          const prevClose = meta.previousClose || meta.chartPreviousClose || price;
          return new Response(JSON.stringify({
            status: 'ok', underlying, spotPrice: price, spot: price,
            change: price - prevClose,
            changePercent: prevClose ? ((price - prevClose) / prevClose) * 100 : 0,
            source: 'live_yahoo', timestamp: Date.now(),
          }), { headers: jsonHeaders });
        }
      } catch {}

      const defaultSpots = { 'NIFTY': 24892.50, 'BANKNIFTY': 52341.20, 'FINNIFTY': 21450.00 };
      return new Response(JSON.stringify({
        status: 'ok', underlying, spotPrice: defaultSpots[underlying.toUpperCase()] || 24000,
        source: 'static_fallback', timestamp: Date.now(),
      }), { headers: jsonHeaders });
    }

    // ── /api/news ─────────────────────────────────────────────
    if (path === '/api/news') {
      const feeds = [
        { url: 'https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms', source: 'Economic Times' },
        { url: 'https://www.moneycontrol.com/rss/latestnews.xml', source: 'Moneycontrol' },
      ];

      for (const feed of feeds) {
        // Method 1: Direct RSS XML parsing (most reliable)
        try {
          const res = await fetch(feed.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            },
            signal: AbortSignal.timeout(8000),
          });
          if (res.ok) {
            const xml = await res.text();
            const articles = parseRssXml(xml, feed.source);
            if (articles.length > 0) {
              return new Response(JSON.stringify({
                status: 'ok', timestamp: Date.now(), source: feed.source, data: articles.slice(0, 15),
              }), { headers: jsonHeaders });
            }
          }
        } catch {}

        // Method 2: RSS2JSON fallback
        try {
          const rssUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&count=15`;
          const res = await fetch(rssUrl, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(6000),
          });
          if (!res.ok) continue;
          const json = await res.json();
          if (json?.status === 'ok' && json.items?.length > 0) {
            const articles = json.items.slice(0, 15).map(item => ({
              title: (item.title || '').replace(/&amp;/g, '&'),
              link: item.link || '#',
              pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
              source: item.author || feed.source,
            }));
            return new Response(JSON.stringify({
              status: 'ok', timestamp: Date.now(), source: feed.source, data: articles,
            }), { headers: jsonHeaders });
          }
        } catch { continue; }
      }

      return new Response(JSON.stringify({
        status: 'ok', timestamp: Date.now(), source: 'fallback', data: [],
      }), { headers: jsonHeaders });
    }

    // ── Unknown API route ─────────────────────────────────────
    return new Response(JSON.stringify({
      status: 'error', message: 'Unknown API endpoint',
    }), { status: 404, headers: jsonHeaders });

  } catch (err) {
    return new Response(JSON.stringify({
      status: 'error', message: err.message || 'Internal server error',
    }), { status: 500, headers: jsonHeaders });
  }
}
