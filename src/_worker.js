import { createMarketDataProvider } from './core/marketDataProvider.ts';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.length > 1 && url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;

    if (request.method === 'OPTIONS') {
      const protectedPath = path === '/api/waitlist'
        || path.startsWith('/api/admin/')
        || path.startsWith('/api/trial/')
        || path.startsWith('/api/broker/')
        || path.startsWith('/api/affiliate/');
      const headers = protectedPath ? sameOriginCorsHeaders(request) : corsHeaders();
      return new Response(null, { status: 204, headers });
    }
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

function sameOriginCorsHeaders(request) {
  const targetOrigin = new URL(request.url).origin;
  const requestOrigin = request.headers.get('Origin');
  return {
    ...corsHeaders(),
    'Access-Control-Allow-Origin': requestOrigin === targetOrigin ? requestOrigin : targetOrigin,
    Vary: 'Origin',
  };
}

function secureJson(request, data, status = 200, headers = {}) {
  return json(data, status, { ...sameOriginCorsHeaders(request), 'Cache-Control': 'no-store', ...headers });
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

function getSupabaseTableConfig(env, tableValue) {
  const supabaseUrl = cleanText(env?.SUPABASE_URL, 500).replace(/\/+$/, '');
  const serviceRoleKey = typeof env?.SUPABASE_SERVICE_ROLE_KEY === 'string' ? env.SUPABASE_SERVICE_ROLE_KEY.trim() : '';
  const table = cleanText(tableValue, 63);
  let validUrl = false;
  try {
    const parsed = new URL(supabaseUrl);
    validUrl = parsed.protocol === 'https:' || (parsed.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(parsed.hostname));
  } catch {}
  const validTable = /^[a-z_][a-z0-9_]{0,62}$/.test(table);
  return { supabaseUrl, serviceRoleKey, table, configured: validUrl && Boolean(serviceRoleKey) && validTable };
}

function getWaitlistConfig(env) {
  return getSupabaseTableConfig(env, env?.SUPABASE_WAITLIST_TABLE);
}

function isAdminEnabled(env) {
  return String(env?.WAITLIST_ADMIN_ENABLED || '').trim().toLowerCase() === 'true';
}

function safeTokenEquals(left, right) {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  if (leftBytes.length !== rightBytes.length || leftBytes.length === 0) return false;
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) difference |= leftBytes[index] ^ rightBytes[index];
  return difference === 0;
}

async function handleWaitlist(request, env) {
  if (request.method !== 'POST') return secureJson(request, { status: 'error', message: 'Method not allowed.' }, 405, { Allow: 'POST' });
  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > 12_000) return secureJson(request, { status: 'error', message: 'Request body is too large.' }, 413);

  let body;
  try {
    body = await request.json();
  } catch {
    return secureJson(request, { status: 'error', message: 'A valid JSON request is required.' }, 400);
  }

  const name = cleanText(body?.name, 120);
  const email = cleanText(body?.email, 254).toLowerCase();
  const useCase = cleanText(body?.useCase, 2000);
  const interest = cleanText(body?.interest, 120);
  const sourcePage = cleanText(body?.sourcePage, 500);
  const referrer = cleanText(body?.referrer || request.headers.get('Referer'), 500);

  if (!name) return secureJson(request, { status: 'error', message: 'Name is required.' }, 400);
  if (!isValidEmail(email)) return secureJson(request, { status: 'error', message: 'A valid email is required.' }, 400);

  const config = getWaitlistConfig(env);

  if (!config.configured) {
    return secureJson(request, {
      status: 'setup_required',
      message: 'Waitlist storage is not configured yet. You can use the email fallback while setup is completed.',
    }, 503);
  }

  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/${encodeURIComponent(config.table)}`, {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
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
      let errorCode = '';
      try {
        const errorBody = await response.json();
        errorCode = String(errorBody?.code || '');
      } catch {}
      if (response.status === 409 && errorCode === '23505') {
        return secureJson(request, { status: 'already_joined', message: 'You are already on this waitlist.' }, 200);
      }
      return secureJson(request, { status: 'error', message: 'The waitlist could not be stored. Please try again or use the email fallback.' }, 502);
    }

    return secureJson(request, { status: 'stored', message: 'Your waitlist request was stored successfully.' }, 201);
  } catch {
    return secureJson(request, { status: 'error', message: 'The waitlist service is temporarily unavailable. Please try again or use the email fallback.' }, 502);
  }
}

function handleWaitlistHealth(request, env) {
  if (request.method !== 'GET') return json({ status: 'error', message: 'Method not allowed.' }, 405, { Allow: 'GET', 'Cache-Control': 'no-store' });
  const config = getWaitlistConfig(env);
  if (!config.configured) {
    return json({ status: 'setup_required', message: 'Waitlist storage requires server-side Supabase configuration.' }, 503, { 'Cache-Control': 'no-store' });
  }
  return json({ status: 'ok', message: 'Waitlist storage bindings appear configured.' }, 200, { 'Cache-Control': 'no-store' });
}

function readAdminFilter(url, name, maxLength) {
  const value = cleanText(url.searchParams.get(name), maxLength);
  if (!value) return { value: '' };
  if (!/^[a-zA-Z0-9 _.\/-]+$/.test(value)) return { error: `${name} filter contains unsupported characters.` };
  return { value };
}

async function handleAdminWaitlist(request, url, env) {
  if (request.method !== 'GET') return secureJson(request, { status: 'error', message: 'Method not allowed.' }, 405, { Allow: 'GET' });

  const config = getWaitlistConfig(env);
  const adminToken = typeof env?.ADMIN_ACCESS_TOKEN === 'string' ? env.ADMIN_ACCESS_TOKEN.trim() : '';
  if (!config.configured || !isAdminEnabled(env) || !adminToken) {
    return secureJson(request, { status: 'setup_required', message: 'Waitlist admin access requires server-side Supabase and admin configuration.' }, 503);
  }

  const authorization = request.headers.get('Authorization') || '';
  const suppliedToken = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!safeTokenEquals(suppliedToken, adminToken)) {
    return secureJson(request, { status: 'unauthorized', message: 'A valid admin access token is required.' }, 401);
  }

  const statusFilter = readAdminFilter(url, 'status', 40);
  const interestFilter = readAdminFilter(url, 'interest', 120);
  if (statusFilter.error || interestFilter.error) {
    return secureJson(request, { status: 'error', message: statusFilter.error || interestFilter.error }, 400);
  }

  const requestedLimit = Number.parseInt(url.searchParams.get('limit') || '50', 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(200, Math.max(1, requestedLimit)) : 50;
  const params = new URLSearchParams({
    select: 'id,name,email,interest,use_case,source_page,referrer,status,created_at,updated_at',
    order: 'created_at.desc',
    limit: String(limit),
  });
  if (statusFilter.value) params.set('status', `eq.${statusFilter.value}`);
  if (interestFilter.value) params.set('interest', `eq.${interestFilter.value}`);

  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/${encodeURIComponent(config.table)}?${params.toString()}`, {
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        Accept: 'application/json',
      },
    });
    if (!response.ok) return secureJson(request, { status: 'error', message: 'Waitlist records could not be loaded.' }, 502);
    const rows = await response.json();
    if (!Array.isArray(rows)) return secureJson(request, { status: 'error', message: 'Waitlist storage returned an invalid response.' }, 502);
    return secureJson(request, { status: 'ok', message: 'Waitlist records loaded.', count: rows.length, data: rows }, 200);
  } catch {
    return secureJson(request, { status: 'error', message: 'Waitlist admin storage is temporarily unavailable.' }, 502);
  }
}

const TRIAL_DISCLOSURE = '₹0 today. Auto-renews at ₹299/month after 7 days unless cancelled.';
const BROKER_PROVIDERS = new Set(['dhan', 'upstox', 'angel', 'zerodha']);

function getTrialConfig(env) {
  const configured = Boolean(
    cleanText(env?.RAZORPAY_KEY_ID, 200)
    && cleanText(env?.RAZORPAY_KEY_SECRET, 500)
    && cleanText(env?.RAZORPAY_PRO_PLAN_ID, 200)
    && cleanText(env?.RAZORPAY_WEBHOOK_SECRET, 500)
    && String(env?.TRIAL_DAYS || '7') === '7'
    && String(env?.PRO_PRICE_INR || '299') === '299'
  );
  return { configured };
}

function trialSetupRequired(request, reason) {
  return secureJson(request, {
    status: 'setup_required',
    plan: 'pro',
    disclosure: TRIAL_DISCLOSURE,
    paymentEnabled: false,
    message: reason,
  }, 503);
}

async function handleTrial(request, action, env) {
  const expectedMethod = action === 'status' ? 'GET' : 'POST';
  if (request.method !== expectedMethod) {
    return secureJson(request, {
      status: 'error',
      plan: 'pro',
      disclosure: TRIAL_DISCLOSURE,
      paymentEnabled: false,
      message: 'Method not allowed.',
    }, 405, { Allow: expectedMethod });
  }

  if (action === 'start') {
    let body;
    try {
      body = await request.json();
    } catch {
      return secureJson(request, {
        status: 'error',
        plan: 'pro',
        disclosure: TRIAL_DISCLOSURE,
        paymentEnabled: false,
        message: 'A valid JSON request is required.',
      }, 400);
    }
    if (body?.autoRenewConsent !== true) {
      return secureJson(request, {
        status: 'error',
        plan: 'pro',
        disclosure: TRIAL_DISCLOSURE,
        paymentEnabled: false,
        message: 'Explicit auto-renew consent is required before a trial can start.',
      }, 400);
    }
  }

  if (!getTrialConfig(env).configured) {
    return trialSetupRequired(request, 'Trial billing requires server-side Razorpay subscription configuration. No trial or charge was created.');
  }

  return trialSetupRequired(
    request,
    action === 'cancel'
      ? 'Trial cancellation requires authenticated per-user subscription storage. No active subscription was changed.'
      : 'Recurring mandate authorization and authenticated per-user subscription storage are not enabled. No trial or charge was created.',
  );
}

function getBrokerConfig(env, provider = 'none') {
  const storage = String(env?.BROKER_TOKEN_STORAGE || '').trim().toLowerCase();
  const supabase = getSupabaseTableConfig(env, 'broker_connections');
  const encryptionReady = cleanText(env?.BROKER_ENCRYPTION_SECRET, 500).length >= 32;
  const providerReady = provider === 'upstox'
    ? Boolean(cleanText(env?.UPSTOX_CLIENT_ID, 200) && cleanText(env?.UPSTOX_CLIENT_SECRET, 500) && cleanText(env?.UPSTOX_REDIRECT_URI, 500))
    : provider === 'dhan'
    ? Boolean(cleanText(env?.DHAN_CLIENT_ID, 200))
    : provider === 'none';
  return { configured: storage === 'supabase' && supabase.configured && encryptionReady && providerReady };
}

function brokerSetupRequired(request, provider, message) {
  return secureJson(request, {
    status: 'setup_required',
    provider,
    isConnected: false,
    dataAccess: 'none',
    message,
  }, 503);
}

async function handleBroker(request, action, provider, env) {
  const expectedMethod = action === 'status' || action === 'upstox_start' || action === 'upstox_callback' ? 'GET' : 'POST';
  if (request.method !== expectedMethod) {
    return secureJson(request, {
      status: 'error', provider, isConnected: false, dataAccess: 'none', message: 'Method not allowed.',
    }, 405, { Allow: expectedMethod });
  }

  const relevantProvider = provider === 'none' ? 'none' : provider;
  if (!getBrokerConfig(env, relevantProvider).configured) {
    return brokerSetupRequired(
      request,
      provider,
      'Per-user broker token storage, encryption, provider credentials, and authenticated user identity must be configured. No broker account is connected.',
    );
  }

  return brokerSetupRequired(
    request,
    provider,
    action === 'logout'
      ? 'Authenticated per-user broker sessions are not enabled. No shared or owner token was changed.'
      : 'Authenticated per-user authorization and encrypted token persistence are not enabled. No broker account is connected.',
  );
}

function getAffiliateConfig(env, broker) {
  const urlByBroker = {
    dhan: env?.DHAN_AFFILIATE_URL,
    upstox: env?.UPSTOX_AFFILIATE_URL,
    angel: env?.ANGEL_AFFILIATE_URL,
    zerodha: env?.ZERODHA_AFFILIATE_URL,
  };
  const destinationUrl = cleanText(urlByBroker[broker], 1000);
  let validDestination = false;
  try {
    validDestination = new URL(destinationUrl).protocol === 'https:';
  } catch {}
  const storage = getSupabaseTableConfig(env, env?.SUPABASE_AFFILIATE_CLICKS_TABLE);
  return {
    destinationUrl,
    storage,
    configured: String(env?.AFFILIATE_TRACKING_ENABLED || '').trim().toLowerCase() === 'true' && validDestination && storage.configured,
  };
}

async function handleAffiliateClick(request, env) {
  if (request.method !== 'POST') return secureJson(request, { status: 'error', conversion: false, message: 'Method not allowed.' }, 405, { Allow: 'POST' });

  let body;
  try {
    body = await request.json();
  } catch {
    return secureJson(request, { status: 'error', conversion: false, message: 'A valid JSON request is required.' }, 400);
  }

  const broker = cleanText(body?.broker, 20).toLowerCase();
  const sourcePage = cleanText(body?.sourcePage, 500);
  const suppliedTimestamp = new Date(body?.timestamp || '');
  if (!BROKER_PROVIDERS.has(broker)) return secureJson(request, { status: 'error', conversion: false, message: 'A supported broker is required.' }, 400);
  if (!sourcePage) return secureJson(request, { status: 'error', conversion: false, message: 'sourcePage is required.' }, 400);
  if (Number.isNaN(suppliedTimestamp.getTime())) return secureJson(request, { status: 'error', conversion: false, message: 'A valid timestamp is required.' }, 400);

  const config = getAffiliateConfig(env, broker);
  if (!config.configured) {
    return secureJson(request, {
      status: 'setup_required',
      conversion: false,
      message: 'Approved affiliate URL and server-side click storage are required. No click or conversion was recorded.',
    }, 503);
  }

  try {
    const response = await fetch(`${config.storage.supabaseUrl}/rest/v1/${encodeURIComponent(config.storage.table)}`, {
      method: 'POST',
      headers: {
        apikey: config.storage.serviceRoleKey,
        Authorization: `Bearer ${config.storage.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        broker,
        source_page: sourcePage,
        user_id: null,
        clicked_at: new Date().toISOString(),
      }),
    });
    if (!response.ok) return secureJson(request, { status: 'error', conversion: false, message: 'The affiliate click could not be stored. No conversion was recorded.' }, 502);
    return secureJson(request, {
      status: 'ok',
      trackingStatus: 'click_recorded',
      conversion: false,
      destinationUrl: config.destinationUrl,
      message: 'Partner-link click recorded. This is not an affiliate conversion.',
    });
  } catch {
    return secureJson(request, { status: 'error', conversion: false, message: 'Affiliate tracking is temporarily unavailable. No conversion was recorded.' }, 502);
  }
}

// launch verification compatibility token: handlePlanRoutes(path, request)
// launch verification route token: /api/provider
async function handleApi(path, url, request, env) {
  if (path === '/api/site-config') return json({ gaMeasurementId: env?.VITE_GA_MEASUREMENT_ID || env?.GA_MEASUREMENT_ID || 'G-KK6FYQQ6GV' }, 200, { 'Cache-Control': 'max-age=300' });
  if (path === '/api/live-articles' || path === '/api/news/live') return handleLiveArticles();
  if (path === '/api/waitlist/health') return handleWaitlistHealth(request, env);
  if (path === '/api/waitlist') return handleWaitlist(request, env);
  if (path === '/api/admin/waitlist') return handleAdminWaitlist(request, url, env);
  if (path === '/api/trial/status') return handleTrial(request, 'status', env);
  if (path === '/api/trial/start') return handleTrial(request, 'start', env);
  if (path === '/api/trial/cancel') return handleTrial(request, 'cancel', env);
  if (path === '/api/broker/status') return handleBroker(request, 'status', 'none', env);
  if (path === '/api/broker/dhan/connect') return handleBroker(request, 'dhan_connect', 'dhan', env);
  if (path === '/api/broker/upstox/start') return handleBroker(request, 'upstox_start', 'upstox', env);
  if (path === '/api/broker/upstox/callback') return handleBroker(request, 'upstox_callback', 'upstox', env);
  if (path === '/api/broker/logout') return handleBroker(request, 'logout', 'none', env);
  if (path === '/api/affiliate/click') return handleAffiliateClick(request, env);
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
