import { z } from 'zod';
import { decryptBrokerToken, encryptBrokerToken } from './tokenVault';
import { testReadOnlyBrokerProvider, type BrokerTestRequest, type ReadOnlyBrokerProvider } from './brokerProvider';

type BrokerEnv = Record<string, string | undefined>;
type AuthResult = { status: string; user: { id: string } | null; message: string };
type AuthResolver = (request: Request, env: BrokerEnv) => Promise<AuthResult>;

interface StoredConnection {
  id?: string;
  user_id: string;
  provider: ReadOnlyBrokerProvider;
  encrypted_token: string;
  token_iv: string;
  encrypted_refresh_token?: string | null;
  refresh_token_iv?: string | null;
  token_algorithm?: string;
  expires_at?: string | null;
  status: string;
  scopes?: string[] | null;
  connected_at?: string | null;
  last_tested_at?: string | null;
  last_error_code?: string | null;
}

const upstoxTokenSchema = z.object({
  access_token: z.string().min(20),
  extended_token: z.string().min(20).optional(),
  user_id: z.string().optional(),
  user_name: z.string().optional(),
}).passthrough();
const dhanTokenSchema = z.object({
  dhanClientId: z.union([z.string(), z.number()]),
  accessToken: z.string().min(20),
  expiryTime: z.string().min(10),
}).passthrough();

const clean = (value: unknown, max = 1000) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const bool = (value: unknown) => String(value || '').trim().toLowerCase() === 'true';
const table = (value: unknown, fallback: string) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(clean(value, 100)) ? clean(value, 100) : fallback;
const encryptionSecret = (env: BrokerEnv) => clean(env.BROKER_TOKEN_ENCRYPTION_KEY || env.BROKER_ENCRYPTION_SECRET, 1000);

function secureHeaders(request: Request) {
  const origin = new URL(request.url).origin;
  const requestOrigin = request.headers.get('Origin');
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': requestOrigin === origin ? requestOrigin : origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token',
    Vary: 'Origin',
  };
}

function reply(request: Request, payload: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(payload), { status, headers: { ...secureHeaders(request), ...headers } });
}

function setup(request: Request, provider: string, reason: string, message: string, extra: Record<string, unknown> = {}) {
  return reply(request, { status: 'setup_required', configured: false, severity: 'info', provider, isConnected: false, reason, message, ...extra });
}

function database(env: BrokerEnv) {
  const url = clean(env.SUPABASE_URL, 500).replace(/\/+$/, '');
  const key = clean(env.SUPABASE_SERVICE_ROLE_KEY, 4000);
  let validUrl = false;
  try { validUrl = new URL(url).protocol === 'https:'; } catch { validUrl = false; }
  return {
    url,
    key,
    connections: table(env.SUPABASE_BROKER_CONNECTIONS_TABLE, 'broker_connections'),
    events: table(env.SUPABASE_BROKER_EVENTS_TABLE, 'broker_connection_events'),
    states: table(env.SUPABASE_BROKER_OAUTH_STATES_TABLE, 'broker_oauth_states'),
    configured: validUrl && Boolean(key),
  };
}

async function dbFetch(env: BrokerEnv, path: string, init: RequestInit = {}) {
  const db = database(env);
  if (!db.configured) throw new Error('Broker database storage is not configured.');
  return fetch(`${db.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: db.key,
      Authorization: `Bearer ${db.key}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

async function audit(env: BrokerEnv, userId: string, provider: string, eventType: string, outcome: string, safeMetadata: Record<string, unknown> = {}) {
  const db = database(env);
  if (!db.configured) return;
  await dbFetch(env, db.events, {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ user_id: userId, provider, event_type: eventType, outcome, safe_metadata: safeMetadata, created_at: new Date().toISOString() }),
  }).catch(() => undefined);
}

function base64Url(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function hashState(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return base64Url(new Uint8Array(digest));
}

function readCookie(request: Request, name: string) {
  const cookies = request.headers.get('Cookie') || '';
  const part = cookies.split(';').map((value) => value.trim()).find((value) => value.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : '';
}

function oauthCookie(provider: ReadOnlyBrokerProvider, value: string, maxAge = 600) {
  return `stockpro_${provider}_oauth=${encodeURIComponent(value)}; Path=/api/broker/${provider}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

async function createOauthState(env: BrokerEnv, userId: string, provider: ReadOnlyBrokerProvider) {
  const raw = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  const stateHash = await hashState(raw);
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
  const db = database(env);
  const response = await dbFetch(env, db.states, {
    method: 'POST', headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ user_id: userId, provider, state_hash: stateHash, expires_at: expiresAt, consumed_at: null }),
  });
  if (!response.ok) throw new Error('OAuth state could not be stored.');
  return raw;
}

async function hasActiveOauthState(env: BrokerEnv, userId: string, provider: ReadOnlyBrokerProvider) {
  const db = database(env);
  const response = await dbFetch(env, `${db.states}?user_id=eq.${encodeURIComponent(userId)}&provider=eq.${provider}&consumed_at=is.null&select=id,expires_at&limit=5`);
  if (!response.ok) throw new Error('OAuth state could not be checked.');
  const rows = await response.json().catch(() => null);
  return Array.isArray(rows) && rows.some((row) => row?.id && Date.parse(row.expires_at) > Date.now());
}

async function consumeOauthState(env: BrokerEnv, provider: ReadOnlyBrokerProvider, rawState: string) {
  if (rawState.length < 32) return null;
  const db = database(env);
  const stateHash = await hashState(rawState);
  const response = await dbFetch(env, `${db.states}?provider=eq.${provider}&state_hash=eq.${encodeURIComponent(stateHash)}&consumed_at=is.null&select=id,user_id,expires_at&limit=1`);
  const rows = response.ok ? await response.json().catch(() => null) : null;
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row?.id || !row?.user_id || Date.parse(row.expires_at) <= Date.now()) return null;
  const consume = await dbFetch(env, `${db.states}?id=eq.${encodeURIComponent(row.id)}&consumed_at=is.null`, {
    method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ consumed_at: new Date().toISOString() }),
  });
  const consumed = consume.ok ? await consume.json().catch(() => null) : null;
  return Array.isArray(consumed) && consumed.length === 1 ? { userId: String(row.user_id) } : null;
}

async function loadConnection(env: BrokerEnv, userId: string, provider: ReadOnlyBrokerProvider) {
  const db = database(env);
  const response = await dbFetch(env, `${db.connections}?user_id=eq.${encodeURIComponent(userId)}&provider=eq.${provider}&select=*&limit=1`);
  if (!response.ok) throw new Error('Broker connection could not be loaded.');
  const rows = await response.json().catch(() => null);
  return (Array.isArray(rows) ? rows[0] : null) as StoredConnection | null;
}

async function persistConnection(env: BrokerEnv, userId: string, provider: ReadOnlyBrokerProvider, token: string, refreshToken: string | null, clientId: string | null, expiresAt: string | null, scopes: string[] = []) {
  const secret = encryptionSecret(env);
  const encrypted = await encryptBrokerToken({ token: JSON.stringify({ accessToken: token, clientId, mode: 'live' }), provider, userId, secret });
  if (encrypted.status !== 'ok' || !encrypted.record) throw new Error(encrypted.message);
  const encryptedRefresh = refreshToken ? await encryptBrokerToken({ token: refreshToken, provider, userId, secret }) : null;
  if (refreshToken && (encryptedRefresh?.status !== 'ok' || !encryptedRefresh.record)) throw new Error('Refresh token could not be encrypted.');
  const db = database(env);
  const response = await dbFetch(env, `${db.connections}?on_conflict=user_id,provider`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      user_id: userId, provider, encrypted_token: encrypted.record.encryptedToken, token_iv: encrypted.record.iv,
      token_algorithm: encrypted.record.algorithm, encrypted_refresh_token: encryptedRefresh?.record?.encryptedToken || null,
      refresh_token_iv: encryptedRefresh?.record?.iv || null, expires_at: expiresAt, status: 'connected', scopes,
      connected_at: new Date().toISOString(), last_tested_at: null, last_error_code: null, updated_at: new Date().toISOString(),
    }),
  });
  if (!response.ok) throw new Error('Encrypted broker connection could not be persisted.');
}

function upstoxExpiry() {
  const now = new Date();
  const expiry = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 22, 0, 0));
  if (expiry.getTime() <= now.getTime()) expiry.setUTCDate(expiry.getUTCDate() + 1);
  return expiry.toISOString();
}

function dhanReadiness(env: BrokerEnv) {
  const gatewayUrl = clean(env.DHAN_PROVIDER_GATEWAY_URL, 1000);
  const gatewaySecret = clean(env.DHAN_PROVIDER_GATEWAY_SECRET, 1000);
  let gatewayConfigured = false;
  try { gatewayConfigured = new URL(gatewayUrl).protocol === 'https:' && Boolean(gatewaySecret); } catch { gatewayConfigured = false; }
  return {
    mode: clean(env.DHAN_MODE, 20).toLowerCase() === 'live' ? 'live' as const : 'sandbox' as const,
    authMode: clean(env.DHAN_AUTH_MODE, 20).toLowerCase() === 'partner' ? 'partner' as const : 'individual' as const,
    dataApiSubscriptionActive: bool(env.DHAN_DATA_API_SUBSCRIPTION_ACTIVE),
    staticIpConfigured: bool(env.DHAN_STATIC_IP_CONFIGURED) || gatewayConfigured,
    quotePermission: bool(env.DHAN_QUOTE_PERMISSION),
    historicalPermission: bool(env.DHAN_HISTORICAL_PERMISSION),
    optionChainPermission: bool(env.DHAN_OPTION_CHAIN_PERMISSION),
    liveFeedPermission: bool(env.DHAN_LIVE_FEED_PERMISSION),
    gatewayConfigured,
  };
}

async function requireUser(request: Request, env: BrokerEnv, authResolver: AuthResolver, provider: string) {
  const auth = await authResolver(request, env);
  if (auth.status === 'setup_required') return { response: setup(request, provider, 'auth_setup_required', auth.message), userId: null };
  if (auth.status !== 'authenticated' || !auth.user) return { response: reply(request, { status: 'login_required', configured: false, severity: 'info', provider, isConnected: false, message: 'Sign in before connecting or testing a broker.' }), userId: null };
  return { response: null, userId: auth.user.id };
}

function callbackResponse(request: Request, provider: ReadOnlyBrokerProvider, status: string, message: string, httpStatus = 200) {
  if ((request.headers.get('Accept') || '').includes('application/json')) return reply(request, { status, provider, isConnected: status === 'connected', message }, httpStatus, { 'Set-Cookie': oauthCookie(provider, '', 0) });
  const target = new URL('/connect-broker', request.url);
  target.searchParams.set('provider', provider);
  target.searchParams.set('status', status);
  return new Response(null, { status: 302, headers: { Location: target.toString(), 'Cache-Control': 'no-store', 'Set-Cookie': oauthCookie(provider, '', 0) } });
}

async function startUpstox(request: Request, env: BrokerEnv, authResolver: AuthResolver) {
  const auth = await requireUser(request, env, authResolver, 'upstox');
  if (auth.response) return auth.response;
  const clientId = clean(env.UPSTOX_CLIENT_ID, 300);
  const clientSecret = clean(env.UPSTOX_CLIENT_SECRET, 1000);
  const redirectUri = clean(env.UPSTOX_REDIRECT_URI, 1000);
  if (!clientId || !clientSecret || !redirectUri) return setup(request, 'upstox', 'oauth_credentials_required', 'Upstox OAuth requires server-side client ID, client secret, and redirect URI.');
  try {
    const state = await createOauthState(env, auth.userId!, 'upstox');
    const params = new URLSearchParams({ response_type: 'code', client_id: clientId, redirect_uri: redirectUri, state });
    return reply(request, { status: 'ready', configured: true, provider: 'upstox', isConnected: false, authorizationUrl: `https://api.upstox.com/v2/login/authorization/dialog?${params}`, message: 'Upstox authorization is ready for this authenticated user.' }, 200, { 'Set-Cookie': oauthCookie('upstox', state) });
  } catch {
    return setup(request, 'upstox', 'oauth_state_storage_required', 'One-time Upstox OAuth state could not be stored.');
  }
}

async function callbackUpstox(request: Request, env: BrokerEnv) {
  const url = new URL(request.url);
  const code = clean(url.searchParams.get('code'), 2000);
  const state = clean(url.searchParams.get('state'), 1000);
  if (!code) return callbackResponse(request, 'upstox', 'invalid_request', 'Upstox callback did not include an authorization code.', 400);
  const oauth = await consumeOauthState(env, 'upstox', state).catch(() => null);
  if (!oauth) return callbackResponse(request, 'upstox', 'invalid_state', 'Upstox OAuth state is invalid, expired, or already used.', 400);
  const params = new URLSearchParams({ code, client_id: clean(env.UPSTOX_CLIENT_ID, 300), client_secret: clean(env.UPSTOX_CLIENT_SECRET, 1000), redirect_uri: clean(env.UPSTOX_REDIRECT_URI, 1000), grant_type: 'authorization_code' });
  const response = await fetch('https://api.upstox.com/v2/login/authorization/token', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' }, body: params }).catch(() => null);
  const payload = response?.ok ? await response.json().catch(() => null) : null;
  const parsed = upstoxTokenSchema.safeParse(payload);
  if (!response?.ok || !parsed.success) {
    await audit(env, oauth.userId, 'upstox', 'oauth_callback', 'token_exchange_failed');
    return callbackResponse(request, 'upstox', 'reconnect_required', 'Upstox token exchange failed. Start a new authorization flow.', 400);
  }
  try {
    await persistConnection(env, oauth.userId, 'upstox', parsed.data.access_token, parsed.data.extended_token || null, null, upstoxExpiry(), ['market_data_read']);
    await audit(env, oauth.userId, 'upstox', 'oauth_callback', 'connected');
    return callbackResponse(request, 'upstox', 'connected', 'Upstox connected for this user. Raw tokens were not returned to the browser.');
  } catch {
    return callbackResponse(request, 'upstox', 'setup_required', 'Upstox authorized, but encrypted token storage is not ready.', 500);
  }
}

async function startDhan(request: Request, env: BrokerEnv, authResolver: AuthResolver) {
  const auth = await requireUser(request, env, authResolver, 'dhan');
  if (auth.response) return auth.response;
  const readiness = dhanReadiness(env);
  if (readiness.mode !== 'live') return setup(request, 'dhan', 'sandbox_mode', 'Dhan sandbox is for developer validation only and cannot start a user live consent flow.', { mode: 'sandbox' });
  const consentInProgress = await hasActiveOauthState(env, auth.userId!, 'dhan').catch(() => false);
  if (consentInProgress) return reply(request, { status: 'consent_in_progress', configured: true, severity: 'info', provider: 'dhan', isConnected: false, message: 'A Dhan consent attempt is already active for this user. Complete it before starting another.' });
  let endpoint: string;
  let headers: Record<string, string>;
  if (readiness.authMode === 'partner') {
    const partnerId = clean(env.DHAN_PARTNER_ID, 300); const partnerSecret = clean(env.DHAN_PARTNER_SECRET, 1000);
    if (!partnerId || !partnerSecret) return setup(request, 'dhan', 'partner_credentials_required', 'Dhan partner integration is not configured.');
    endpoint = 'https://auth.dhan.co/partner/generate-consent'; headers = { partner_id: partnerId, partner_secret: partnerSecret };
  } else {
    const clientId = clean(env.DHAN_CLIENT_ID, 300); const appId = clean(env.DHAN_API_KEY, 500); const appSecret = clean(env.DHAN_API_SECRET, 1000);
    if (!clientId || !appId || !appSecret) return setup(request, 'dhan', 'individual_credentials_required', 'Dhan individual consent requires client ID, API key, and API secret.');
    endpoint = `https://auth.dhan.co/app/generate-consent?client_id=${encodeURIComponent(clientId)}`; headers = { app_id: appId, app_secret: appSecret };
  }
  const response = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json', ...headers } }).catch(() => null);
  const payload = response?.ok ? await response.json().catch(() => null) : null;
  const consentId = clean(payload?.consentAppId || payload?.consentId, 500);
  if (!response?.ok || !consentId) return setup(request, 'dhan', 'consent_generation_failed', 'Dhan consent could not be generated. Verify server-side credentials.');
  const state = await createOauthState(env, auth.userId!, 'dhan').catch(() => null);
  if (!state) return setup(request, 'dhan', 'oauth_state_storage_required', 'One-time Dhan consent state could not be stored.');
  const authorizationUrl = readiness.authMode === 'partner' ? `https://auth.dhan.co/consent-login?consentId=${encodeURIComponent(consentId)}` : `https://auth.dhan.co/login/consentApp-login?consentAppId=${encodeURIComponent(consentId)}`;
  return reply(request, { status: 'ready', configured: true, provider: 'dhan', mode: 'live', authMode: readiness.authMode, isConnected: false, authorizationUrl, message: 'Dhan consent is ready for this authenticated user.' }, 200, { 'Set-Cookie': oauthCookie('dhan', state) });
}

async function callbackDhan(request: Request, env: BrokerEnv) {
  const url = new URL(request.url);
  const tokenId = clean(url.searchParams.get('tokenId'), 2000);
  if (!tokenId) return callbackResponse(request, 'dhan', 'invalid_request', 'Dhan callback did not include tokenId.', 400);
  const state = readCookie(request, 'stockpro_dhan_oauth');
  const oauth = await consumeOauthState(env, 'dhan', state).catch(() => null);
  if (!oauth) return callbackResponse(request, 'dhan', 'invalid_state', 'Dhan consent state is invalid, expired, or already used.', 400);
  const readiness = dhanReadiness(env);
  let endpoint: string; let headers: Record<string, string>;
  if (readiness.authMode === 'partner') {
    endpoint = `https://auth.dhan.co/partner/consume-consent?tokenId=${encodeURIComponent(tokenId)}`;
    headers = { partner_id: clean(env.DHAN_PARTNER_ID, 300), partner_secret: clean(env.DHAN_PARTNER_SECRET, 1000) };
  } else {
    endpoint = `https://auth.dhan.co/app/consumeApp-consent?tokenId=${encodeURIComponent(tokenId)}`;
    headers = { app_id: clean(env.DHAN_API_KEY, 500), app_secret: clean(env.DHAN_API_SECRET, 1000) };
  }
  const response = await fetch(endpoint, { headers: { Accept: 'application/json', ...headers } }).catch(() => null);
  const payload = response?.ok ? await response.json().catch(() => null) : null;
  const parsed = dhanTokenSchema.safeParse(payload);
  if (!response?.ok || !parsed.success) {
    await audit(env, oauth.userId, 'dhan', 'consent_callback', 'token_exchange_failed');
    return callbackResponse(request, 'dhan', 'reconnect_required', 'Dhan consent could not be consumed. Start a new consent flow.', 400);
  }
  try {
    await persistConnection(env, oauth.userId, 'dhan', parsed.data.accessToken, null, String(parsed.data.dhanClientId), parsed.data.expiryTime, ['market_data_read']);
    await audit(env, oauth.userId, 'dhan', 'consent_callback', 'connected');
    return callbackResponse(request, 'dhan', 'connected', 'Dhan connected for this user. Raw tokens were not returned to the browser.');
  } catch {
    return callbackResponse(request, 'dhan', 'setup_required', 'Dhan authorized, but encrypted token storage is not ready.', 500);
  }
}

async function providerStatus(request: Request, env: BrokerEnv, authResolver: AuthResolver, provider: ReadOnlyBrokerProvider) {
  const auth = await requireUser(request, env, authResolver, provider);
  if (auth.response) return auth.response;
  if (!database(env).configured || clean(env.BROKER_TOKEN_STORAGE, 30) !== 'supabase' || encryptionSecret(env).length < 32) return setup(request, provider, 'vault_setup_required', 'Per-user Supabase token storage and BROKER_TOKEN_ENCRYPTION_KEY are required.');
  const row = await loadConnection(env, auth.userId!, provider).catch(() => null);
  const expired = Boolean(row?.expires_at && Date.parse(row.expires_at) <= Date.now());
  if (!row) return reply(request, { status: 'not_connected', configured: true, provider, isConnected: false, dataAccess: 'none', message: `No ${provider} connection is stored for this user.` });
  if (expired || row.status === 'reconnect_required') return reply(request, { status: 'reconnect_required', configured: true, provider, isConnected: false, dataAccess: 'none', expiresAt: row.expires_at || null, message: `${provider} token is expired or invalid. Reconnect this user.` });
  if (provider === 'dhan') {
    const readiness = dhanReadiness(env);
    const base = { provider, isConnected: row.status === 'connected', expiresAt: row.expires_at || null, mode: readiness.mode, authMode: readiness.authMode, ...readiness };
    if (readiness.mode !== 'live') return setup(request, provider, 'sandbox_mode', 'Dhan sandbox is isolated from production live mode.', base);
    if (!readiness.dataApiSubscriptionActive) return setup(request, provider, 'data_api_subscription_required', 'Dhan Data API subscription is required before live market data can be used.', base);
    if (!readiness.staticIpConfigured) return setup(request, provider, 'static_ip_required', 'Dhan requires a static outbound IP; configure the secure provider gateway for Cloudflare Worker deployments.', base);
    return reply(request, { status: row.status === 'connected' ? 'connected' : 'not_connected', configured: true, ...base, dataAccess: row.status === 'connected' ? 'market_data_only' : 'none', message: 'Dhan user connection and Data API readiness checked. Order placement remains disabled.' });
  }
  return reply(request, { status: row.status === 'connected' ? 'connected' : 'not_connected', configured: true, provider, isConnected: row.status === 'connected', dataAccess: row.status === 'connected' ? 'market_data_only' : 'none', expiresAt: row.expires_at || null, message: 'Upstox per-user read-only connection status checked. Order placement remains disabled.' });
}

async function testProvider(request: Request, env: BrokerEnv, authResolver: AuthResolver, provider: ReadOnlyBrokerProvider) {
  const auth = await requireUser(request, env, authResolver, provider);
  if (auth.response) return auth.response;
  const row = await loadConnection(env, auth.userId!, provider).catch(() => null);
  if (!row?.encrypted_token || !row.token_iv) return reply(request, { status: 'not_connected', configured: true, provider, isConnected: false, message: `Connect ${provider} before testing it.` });
  if (row.expires_at && Date.parse(row.expires_at) <= Date.now()) return reply(request, { status: 'reconnect_required', configured: true, provider, isConnected: false, message: `${provider} token has expired.` });
  const decrypted = await decryptBrokerToken({ record: { provider, userId: auth.userId!, encryptedToken: row.encrypted_token, iv: row.token_iv, algorithm: 'AES-GCM', createdAt: row.connected_at || new Date().toISOString() }, secret: encryptionSecret(env) });
  if (decrypted.status !== 'ok' || !decrypted.token) return reply(request, { status: 'reconnect_required', configured: true, provider, isConnected: false, message: 'Stored credentials could not be decrypted. Reconnect this user.' });
  let credentials: { accessToken?: string; clientId?: string; mode?: string }; let body: BrokerTestRequest;
  try { credentials = JSON.parse(decrypted.token); body = await request.json() as BrokerTestRequest; } catch { return reply(request, { status: 'invalid_input', provider, message: 'A valid broker test request is required.' }, 400); }
  if (provider === 'dhan') {
    const readiness = dhanReadiness(env);
    if (readiness.mode !== 'live') return setup(request, provider, 'sandbox_mode', 'User connections cannot use Dhan sandbox data as production data.', readiness);
    if (body.testType !== 'profile' && !readiness.dataApiSubscriptionActive) return setup(request, provider, 'data_api_subscription_required', 'Dhan Data API subscription is required for this test.', readiness);
    if (body.testType !== 'profile' && !readiness.staticIpConfigured) return setup(request, provider, 'static_ip_required', 'Dhan data tests require a secure static-IP provider gateway.', readiness);
  }
  const result = await testReadOnlyBrokerProvider({ provider, accessToken: clean(credentials.accessToken, 5000), clientId: clean(credentials.clientId, 200), mode: 'live', gatewayUrl: env.DHAN_PROVIDER_GATEWAY_URL, gatewaySecret: env.DHAN_PROVIDER_GATEWAY_SECRET }, body);
  const db = database(env);
  await dbFetch(env, `${db.connections}?user_id=eq.${encodeURIComponent(auth.userId!)}&provider=eq.${provider}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: result.ok ? 'connected' : result.status === 'reconnect_required' ? 'reconnect_required' : row.status, last_tested_at: new Date().toISOString(), last_error_code: result.ok ? null : result.status, updated_at: new Date().toISOString() }) }).catch(() => null);
  await audit(env, auth.userId!, provider, `${body.testType}_test`, result.ok ? 'passed' : result.status);
  return reply(request, { ...result, configured: true, isConnected: result.ok, dataAccess: result.ok ? 'market_data_only' : 'none' });
}

async function disconnectProvider(request: Request, env: BrokerEnv, authResolver: AuthResolver, provider: ReadOnlyBrokerProvider) {
  const auth = await requireUser(request, env, authResolver, provider);
  if (auth.response) return auth.response;
  const row = await loadConnection(env, auth.userId!, provider).catch(() => null);
  if (row?.encrypted_token && row.token_iv && provider === 'upstox') {
    const decrypted = await decryptBrokerToken({ record: { provider, userId: auth.userId!, encryptedToken: row.encrypted_token, iv: row.token_iv, algorithm: 'AES-GCM', createdAt: row.connected_at || new Date().toISOString() }, secret: encryptionSecret(env) });
    if (decrypted.status === 'ok' && decrypted.token) {
      try { const credentials = JSON.parse(decrypted.token); await fetch('https://api.upstox.com/v2/logout', { method: 'DELETE', headers: { Accept: 'application/json', Authorization: `Bearer ${clean(credentials.accessToken, 5000)}` } }); } catch { /* Local deletion still prevents reuse. */ }
    }
  }
  const db = database(env);
  const response = await dbFetch(env, `${db.connections}?user_id=eq.${encodeURIComponent(auth.userId!)}&provider=eq.${provider}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }).catch(() => null);
  if (!response?.ok) return reply(request, { status: 'provider_unavailable', provider, isConnected: false, message: 'Broker connection could not be deleted.' }, 502);
  await audit(env, auth.userId!, provider, 'disconnect', 'deleted');
  return reply(request, { status: 'not_connected', configured: true, provider, isConnected: false, dataAccess: 'none', message: `${provider} encrypted tokens were deleted for this user.` });
}

async function dhanSandboxTest(request: Request, env: BrokerEnv) {
  const supplied = clean(request.headers.get('X-Admin-Token'), 1000);
  const expected = clean(env.ADMIN_ACCESS_TOKEN, 1000);
  if (!supplied || supplied !== expected) return reply(request, { status: 'unauthorized', message: 'Developer sandbox testing requires server-configured admin access.' }, 401);
  const clientId = clean(env.DHAN_SANDBOX_CLIENT_ID, 200); const accessToken = clean(env.DHAN_SANDBOX_ACCESS_TOKEN, 5000);
  if (!clientId || !accessToken) return setup(request, 'dhan', 'sandbox_credentials_required', 'Dhan sandbox client ID and access token are not configured.', { mode: 'sandbox' });
  const result = await testReadOnlyBrokerProvider({ provider: 'dhan', accessToken, clientId, mode: 'sandbox' }, { testType: 'profile' });
  return reply(request, { ...result, configured: true, isConnected: false, unlocksLiveMode: false, message: `${result.message} Sandbox output is never labelled live and never unlocks production CRT.` });
}

export async function handleBrokerV2Request(options: { request: Request; path: string; env: BrokerEnv; authResolver: AuthResolver }): Promise<Response | null> {
  const { request, path, env, authResolver } = options;
  const match = path.match(/^\/api\/broker\/(upstox|dhan)\/(start|callback|status|test|disconnect)$/);
  if (path === '/api/broker/angelone/status') return reply(request, { status: 'setup_pending', configured: false, severity: 'info', provider: 'angelone', isConnected: false, message: 'Angel One integration will become available after application approval and credential configuration.' });
  if (path === '/api/broker/dhan/sandbox/test') return request.method === 'POST' ? dhanSandboxTest(request, env) : reply(request, { status: 'error', message: 'Method not allowed.' }, 405, { Allow: 'POST' });
  if (!match) return null;
  const provider = match[1] as ReadOnlyBrokerProvider;
  const action = match[2];
  const expectedMethod = ['start', 'callback', 'status'].includes(action) ? 'GET' : 'POST';
  if (request.method !== expectedMethod) return reply(request, { status: 'error', provider, message: 'Method not allowed.' }, 405, { Allow: expectedMethod });
  if (provider === 'upstox' && action === 'start') return startUpstox(request, env, authResolver);
  if (provider === 'upstox' && action === 'callback') return callbackUpstox(request, env);
  if (provider === 'dhan' && action === 'start') return startDhan(request, env, authResolver);
  if (provider === 'dhan' && action === 'callback') return callbackDhan(request, env);
  if (action === 'status') return providerStatus(request, env, authResolver, provider);
  if (action === 'test') return testProvider(request, env, authResolver, provider);
  if (action === 'disconnect') return disconnectProvider(request, env, authResolver, provider);
  return null;
}
