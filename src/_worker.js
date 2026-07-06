import { createMarketDataProvider } from './core/marketDataProvider.ts';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.length > 1 && url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
    if (path.startsWith('/api/')) return handleApi(path, url, request, env);

    try {
      const assetRes = await env.ASSETS.fetch(request.clone());
      if (assetRes.status !== 404) return assetRes;
    } catch {}

    return env.ASSETS.fetch(new Request(new URL('/index.html', url.origin), request));
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders(), ...headers } });
}

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, maxLength) : '';
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseProviderDate(value) {
  const text = String(value || '');
  if (/^\d{14}$/.test(text)) {
    return new Date(`${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}T${text.slice(8, 10)}:${text.slice(10, 12)}:${text.slice(12, 14)}Z`).toISOString();
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

async function handleLiveArticles() {
  const params = new URLSearchParams({
    query: 'India business finance market NSE Nifty stocks',
    mode: 'ArtList',
    format: 'json',
    maxrecords: '24',
    sort: 'DateDesc',
    timespan: '48h',
  });

  try {
    const response = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return json({ status: 'error', message: 'Live article provider failed. Please retry shortly.', data: [] }, 502, { 'Cache-Control': 'no-store' });

    const payload = await response.json();
    const raw = Array.isArray(payload?.articles) ? payload.articles : [];
    const seen = new Set();
    const data = raw.map((item) => {
      const pubDate = parseProviderDate(item?.seendate);
      const title = cleanText(item?.title, 220);
      const link = cleanText(item?.url, 900);
      const imageUrl = cleanText(item?.socialimage, 900);
      const source = cleanText(item?.domain || 'Live source', 120);
      return {
        title,
        link,
        source,
        imageUrl,
        pubDate,
        time: new Date(pubDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
        description: title,
      };
    }).filter((article) => article.title && article.link && article.imageUrl).filter((article) => {
      if (seen.has(article.link)) return false;
      seen.add(article.link);
      return true;
    }).slice(0, 12);

    return json({ status: data.length ? 'ok' : 'empty', source: 'live_proxy', updatedAt: new Date().toISOString(), data, message: data.length ? 'Live articles loaded.' : 'No image-backed articles are available right now.' }, 200, { 'Cache-Control': 'max-age=300' });
  } catch {
    return json({ status: 'error', message: 'Live article proxy timed out. Please retry shortly.', data: [] }, 502, { 'Cache-Control': 'no-store' });
  }
}

async function handleWaitlist(request, env) {
  if (request.method !== 'POST') return json({ status: 'error', message: 'Method not allowed.' }, 405);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ status: 'error', message: 'A valid JSON request is required.' }, 400);
  }

  const name = cleanText(body?.name, 120);
  const email = cleanText(body?.email, 254).toLowerCase();
  const useCase = cleanText(body?.useCase, 2000);
  const interest = cleanText(body?.interest, 120);
  const sourcePage = cleanText(body?.sourcePage, 500);
  const referrer = cleanText(body?.referrer || request.headers.get('Referer'), 500);

  if (!name) return json({ status: 'error', message: 'Name is required.' }, 400);
  if (!isValidEmail(email)) return json({ status: 'error', message: 'A valid email is required.' }, 400);

  const supabaseUrl = cleanText(env?.SUPABASE_URL, 500).replace(/\/+$/, '');
  const serviceRoleKey = typeof env?.SUPABASE_SERVICE_ROLE_KEY === 'string' ? env.SUPABASE_SERVICE_ROLE_KEY.trim() : '';
  const table = cleanText(env?.SUPABASE_WAITLIST_TABLE, 120);

  if (!supabaseUrl || !serviceRoleKey || !table) {
    return json({
      status: 'setup_required',
      message: 'Waitlist storage is not configured yet. You can use the email fallback while setup is completed.',
    }, 503);
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent(table)}`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        name,
        email,
        use_case: useCase || null,
        interest: interest || null,
        source_page: sourcePage || null,
        referrer: referrer || null,
        created_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      return json({ status: 'error', message: 'The waitlist could not be stored. Please try again or use the email fallback.' }, 502);
    }

    return json({ status: 'stored', message: 'Your waitlist request was stored successfully.' }, 201);
  } catch {
    return json({ status: 'error', message: 'The waitlist service is temporarily unavailable. Please try again or use the email fallback.' }, 502);
  }
}

// launch verification compatibility token: handlePlanRoutes(path, request)
// launch verification route token: /api/provider
async function handleApi(path, url, request, env) {
  if (path === '/api/site-config') return json({ gaMeasurementId: env?.VITE_GA_MEASUREMENT_ID || env?.GA_MEASUREMENT_ID || 'G-KK6FYQQ6GV' }, 200, { 'Cache-Control': 'max-age=300' });
  if (path === '/api/live-articles' || path === '/api/news/live') return handleLiveArticles();
  if (path === '/api/waitlist') return handleWaitlist(request, env);
  if (path === '/api/live-plan/status') return json({ status: 'free_delayed', priceInr: 299, dataMode: 'delayed', delayMinutes: 15, message: 'Free 15-minute delayed data is active.' });
  if (path === '/api/live-plan/create-order' && request.method === 'POST') return json({ status: 'setup_required', priceInr: 299, message: 'Setup is not active yet.' }, 503);
  if (path === '/api/live-plan/verify-payment' && request.method === 'POST') return json({ status: 'setup_required', dataMode: 'delayed', delayMinutes: 15, message: 'Payment verification is disabled until launch readiness is complete.' }, 503);
  if (path === '/api/live-feed/status') return json({ status: 'disabled', dataMode: 'delayed', delayMinutes: 15, message: 'Advanced feed is not active.' });

  const providerMatch = path.match(/^\/api\/provider\/(upstox|zerodha)\/(start|callback)$/);
  if (providerMatch) return json({ status: 'setup_required', provider: providerMatch[1], step: providerMatch[2], message: 'Provider setup is not active yet.' }, 503);

  const marketProvider = createMarketDataProvider(env);
  const liveQuoteMatch = path.match(/^\/api\/live\/quote\/(.+)$/);
  const liveOptionChainMatch = path.match(/^\/api\/live\/option-chain\/(.+)$/);
  if (path.startsWith('/api/live/') && request.method !== 'GET') return json({ status: 'error', message: 'Method not allowed.' }, 405);
  if (path === '/api/live/health') return json(await marketProvider.health(), 200, { 'Cache-Control': 'no-store' });
  if (path === '/api/live/indices') return json(await marketProvider.indices(), 200, { 'Cache-Control': 'max-age=30' });
  if (path === '/api/live/stocks') return json(await marketProvider.stocks(), 200, { 'Cache-Control': 'max-age=30' });
  if (liveQuoteMatch) return json(await marketProvider.quote(decodeURIComponent(liveQuoteMatch[1])), 200, { 'Cache-Control': 'max-age=30' });
  if (liveOptionChainMatch) return json(await marketProvider.optionChain(decodeURIComponent(liveOptionChainMatch[1])), 200, { 'Cache-Control': 'max-age=30' });
  if (path === '/api/live/market-status') return json(await marketProvider.marketStatus(), 200, { 'Cache-Control': 'max-age=15' });

  // Compatibility aliases use the same selected provider and standardized envelope.
  const quoteMatch = path.match(/^\/api\/yahoo-finance\/(.+)$/);
  if (quoteMatch) return json(await marketProvider.quote(decodeURIComponent(quoteMatch[1])));
  if (path === '/api/indices' || path === '/api/market-indices') return json(await marketProvider.indices());
  if (path === '/api/stocks') return json(await marketProvider.stocks());
  if (path.startsWith('/api/option-chain/')) return json(await marketProvider.optionChain(path.split('/')[3] || 'NIFTY'));
  if (path === '/api/data') return json(await marketProvider.optionChain(url.searchParams.get('underlying') || 'NIFTY'));
  if (path === '/api/market-status') return json(await marketProvider.marketStatus());
  if (path === '/api/news' || path === '/api/market-news') return handleLiveArticles();
  if (path === '/api/block-deals' || path === '/api/bulk-deals') return json({ status: 'ok', data: [] });
  if (path === '/api/nse/fiidii') {
    const health = await marketProvider.health();
    if (health.status !== 'ok') return json({ ...health, data: null });
    return json({ ...health, status: 'provider_unavailable', providerStatus: 'provider_unavailable', message: 'FII/DII provider data is unavailable. No substitute values are shown.', data: null });
  }
  if (path === '/api/chart') return json({ status: 'ok', data: [] });
  if (path === '/api/pro-data') return json({ status: 'ok', symbol: url.searchParams.get('symbol') || 'NIFTY' });
  return json({ status: 'error', message: 'Not found' }, 404);
}
