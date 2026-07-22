import { expect, test } from '@playwright/test';
import { handleBrokerV2Request } from '../src/core/brokerServer';
import { normalizeBrokerCandle, testReadOnlyBrokerProvider } from '../src/core/brokerProvider';
import { handleBrokerCrtRequest } from '../src/core/crtScannerBrokerServer';
import { handleSavedResearchRequest } from '../src/core/savedResearchServer';
import { externalProviderAdapter } from '../src/core/marketDataProvider';
import { handleCrtScannerRequest } from '../src/core/crtScannerServer';
import stockproWorker from '../src/_worker';
import { decryptBrokerToken, encryptBrokerToken } from '../src/core/tokenVault';

const originalFetch = globalThis.fetch;
const baseEnv = {
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-value',
  BROKER_TOKEN_STORAGE: 'supabase',
  BROKER_ENCRYPTION_SECRET: 'test-encryption-secret-with-at-least-32-characters',
  UPSTOX_CLIENT_ID: 'upstox-client',
  UPSTOX_CLIENT_SECRET: ['upstox', 'test', 'credential'].join('-'),
  UPSTOX_REDIRECT_URI: 'https://stockpro1.qzz.io/api/broker/upstox/callback',
  DHAN_MODE: 'live',
  DHAN_AUTH_MODE: 'individual',
  DHAN_CLIENT_ID: '1000000001',
  DHAN_API_KEY: 'dhan-app',
  DHAN_API_SECRET: 'dhan-secret',
  DHAN_REDIRECT_URI: 'https://stockpro1.qzz.io/api/broker/dhan/callback',
};
const auth = async () => ({ status: 'authenticated', user: { id: 'user-a' }, message: 'Authenticated.' });
const json = (payload: unknown, status = 200) => new Response(status === 204 ? null : JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });

test.afterEach(() => { globalThis.fetch = originalFetch; });

test('Upstox start creates random user-bound state and official OAuth URL', async () => {
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes('/rest/v1/broker_oauth_states')) return json({}, 201);
    throw new Error(`Unexpected fetch: ${url}`);
  };
  const response = await handleBrokerV2Request({ request: new Request('https://stockpro1.qzz.io/api/broker/upstox/start'), path: '/api/broker/upstox/start', env: baseEnv, authResolver: auth });
  const payload = await response!.json();
  expect(response!.status).toBe(200);
  expect(payload.status).toBe('ready');
  const authorization = new URL(payload.authorizationUrl);
  expect(authorization.origin).toBe('https://api.upstox.com');
  expect(authorization.searchParams.get('response_type')).toBe('code');
  expect(authorization.searchParams.get('state')).not.toBe('user-a');
  expect(authorization.searchParams.get('state')!.length).toBeGreaterThanOrEqual(40);
  expect(response!.headers.get('set-cookie')).toContain('HttpOnly');
});

test('Upstox callback rejects missing code and invalid or replayed state', async () => {
  const missing = await handleBrokerV2Request({ request: new Request('https://stockpro1.qzz.io/api/broker/upstox/callback?state=abc', { headers: { Accept: 'application/json' } }), path: '/api/broker/upstox/callback', env: baseEnv, authResolver: auth });
  expect(missing!.status).toBe(400);
  expect((await missing!.json()).status).toBe('invalid_request');

  globalThis.fetch = async (input) => String(input).includes('/rest/v1/broker_oauth_states') ? json([]) : json({}, 500);
  const invalid = await handleBrokerV2Request({ request: new Request(`https://stockpro1.qzz.io/api/broker/upstox/callback?code=one-time&state=${'x'.repeat(43)}`, { headers: { Accept: 'application/json' } }), path: '/api/broker/upstox/callback', env: baseEnv, authResolver: auth });
  expect(invalid!.status).toBe(400);
  expect((await invalid!.json()).status).toBe('invalid_state');
});

test('Upstox callback exchanges server-side and persists ciphertext without exposing token', async () => {
  const storedBodies: string[] = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    if (url.includes('broker_oauth_states?') && (init.method || 'GET') === 'GET') return json([{ id: 'state-id', user_id: 'user-a', expires_at: new Date(Date.now() + 60_000).toISOString() }]);
    if (url.includes('broker_oauth_states?') && init.method === 'PATCH') return json([{ id: 'state-id' }]);
    if (url === 'https://api.upstox.com/v2/login/authorization/token') return json({ access_token: 'raw-upstox-access-token-value-1234567890', extended_token: 'raw-upstox-extended-token-value-1234567890', user_id: 'u1' });
    if (url.includes('/rest/v1/broker_connections')) { storedBodies.push(String(init.body)); return json({}, 201); }
    if (url.includes('/rest/v1/broker_connection_events')) return json({}, 201);
    throw new Error(`Unexpected fetch: ${url}`);
  };
  const state = 's'.repeat(43);
  const response = await handleBrokerV2Request({ request: new Request(`https://stockpro1.qzz.io/api/broker/upstox/callback?code=one-time&state=${state}`, { headers: { Accept: 'application/json' } }), path: '/api/broker/upstox/callback', env: baseEnv, authResolver: auth });
  const payload = await response!.json();
  expect(payload.status).toBe('connected');
  expect(JSON.stringify(payload)).not.toContain('raw-upstox');
  expect(storedBodies).toHaveLength(1);
  expect(storedBodies[0]).not.toContain('raw-upstox');
  expect(JSON.parse(storedBodies[0]).encrypted_token).toBeTruthy();
  expect(JSON.parse(storedBodies[0]).refresh_token_iv).toBeTruthy();
});

test('status lookups are scoped to the authenticated user and disconnect deletes only that row', async () => {
  const urls: string[] = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input); urls.push(url);
    if (url.includes('/broker_connections?') && (init.method || 'GET') === 'GET') return json([]);
    if (url.includes('/broker_connections?') && init.method === 'DELETE') return json({}, 204);
    if (url.includes('/broker_connection_events')) return json({}, 201);
    return json({}, 200);
  };
  const status = await handleBrokerV2Request({ request: new Request('https://stockpro1.qzz.io/api/broker/upstox/status'), path: '/api/broker/upstox/status', env: baseEnv, authResolver: auth });
  expect((await status!.json()).status).toBe('not_connected');
  const disconnected = await handleBrokerV2Request({ request: new Request('https://stockpro1.qzz.io/api/broker/upstox/disconnect', { method: 'POST' }), path: '/api/broker/upstox/disconnect', env: baseEnv, authResolver: auth });
  expect((await disconnected!.json()).status).toBe('not_connected');
  expect(urls.filter((url) => url.includes('broker_connections')).every((url) => url.includes('user_id=eq.user-a'))).toBe(true);
  expect(urls.join('\n')).not.toContain('user-b');
});

test('Dhan consent uses official individual flow and sandbox cannot unlock live mode', async () => {
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes('/rest/v1/broker_oauth_states')) return json({}, 201);
    if (url.startsWith('https://auth.dhan.co/app/generate-consent')) return json({ consentAppId: 'consent-123', consentAppStatus: 'GENERATED', status: 'success' });
    throw new Error(`Unexpected fetch: ${url}`);
  };
  const live = await handleBrokerV2Request({ request: new Request('https://stockpro1.qzz.io/api/broker/dhan/start'), path: '/api/broker/dhan/start', env: baseEnv, authResolver: auth });
  const livePayload = await live!.json();
  expect(livePayload.authorizationUrl).toBe('https://auth.dhan.co/login/consentApp-login?consentAppId=consent-123');
  expect(livePayload.mode).toBe('live');

  const sandbox = await handleBrokerV2Request({ request: new Request('https://stockpro1.qzz.io/api/broker/dhan/start'), path: '/api/broker/dhan/start', env: { ...baseEnv, DHAN_MODE: 'sandbox' }, authResolver: auth });
  const sandboxPayload = await sandbox!.json();
  expect(sandboxPayload.status).toBe('setup_required');
  expect(sandboxPayload.reason).toBe('sandbox_mode');
  expect(sandboxPayload.isConnected).toBe(false);
});

test('Dhan rejects a second active consent attempt without replacing its state', async () => {
  let consentRequests = 0;
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    if (url.includes('/rest/v1/broker_oauth_states') && (init.method || 'GET') === 'GET') return json([{ id: 'active-state', expires_at: new Date(Date.now() + 60_000).toISOString() }]);
    if (url.startsWith('https://auth.dhan.co/')) consentRequests += 1;
    return json({}, 200);
  };
  const response = await handleBrokerV2Request({ request: new Request('https://stockpro1.qzz.io/api/broker/dhan/start'), path: '/api/broker/dhan/start', env: baseEnv, authResolver: auth });
  expect(response!.status).toBe(200);
  expect(await response!.json()).toMatchObject({ status: 'consent_in_progress', provider: 'dhan', isConnected: false });
  expect(consentRequests).toBe(0);
});


test('Dhan callback consumes consent server-side and stores only ciphertext', async () => {
  const storedBodies: string[] = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    if (url.includes('broker_oauth_states?') && (init.method || 'GET') === 'GET') return json([{ id: 'dhan-state', user_id: 'user-a', expires_at: new Date(Date.now() + 60_000).toISOString() }]);
    if (url.includes('broker_oauth_states?') && init.method === 'PATCH') return json([{ id: 'dhan-state' }]);
    if (url.startsWith('https://auth.dhan.co/app/consumeApp-consent')) return json({ dhanClientId: '1000000001', accessToken: 'raw-dhan-access-token-value-1234567890', expiryTime: new Date(Date.now() + 86_400_000).toISOString() });
    if (url.includes('/rest/v1/broker_connections')) { storedBodies.push(String(init.body)); return json({}, 201); }
    if (url.includes('/rest/v1/broker_connection_events')) return json({}, 201);
    throw new Error(`Unexpected fetch: ${url}`);
  };
  const state = 'd'.repeat(43);
  const response = await handleBrokerV2Request({
    request: new Request('https://stockpro1.qzz.io/api/broker/dhan/callback?tokenId=one-time-token-id', {
      headers: { Accept: 'application/json', Cookie: `stockpro_dhan_oauth=${state}` },
    }),
    path: '/api/broker/dhan/callback',
    env: baseEnv,
    authResolver: auth,
  });
  const payload = await response!.json();
  expect(payload.status).toBe('connected');
  expect(JSON.stringify(payload)).not.toContain('raw-dhan');
  expect(storedBodies).toHaveLength(1);
  expect(storedBodies[0]).not.toContain('raw-dhan');
  expect(JSON.parse(storedBodies[0]).encrypted_token).toBeTruthy();
});
test('Dhan expected subscription and static-IP gaps are HTTP 200 readiness states', async () => {
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes('/broker_connections?')) return json([{ user_id: 'user-a', provider: 'dhan', encrypted_token: 'cipher', token_iv: 'iv', status: 'connected', expires_at: new Date(Date.now() + 60_000).toISOString() }]);
    return json({}, 200);
  };
  const subscription = await handleBrokerV2Request({ request: new Request('https://stockpro1.qzz.io/api/broker/dhan/status'), path: '/api/broker/dhan/status', env: baseEnv, authResolver: auth });
  const subscriptionPayload = await subscription!.json();
  expect(subscription!.status).toBe(200);
  expect(subscriptionPayload.status).toBe('setup_required');
  expect(subscriptionPayload.reason).toBe('data_api_subscription_required');

  const staticIp = await handleBrokerV2Request({ request: new Request('https://stockpro1.qzz.io/api/broker/dhan/status'), path: '/api/broker/dhan/status', env: { ...baseEnv, DHAN_DATA_API_SUBSCRIPTION_ACTIVE: 'true' }, authResolver: auth });
  expect((await staticIp!.json()).reason).toBe('static_ip_required');
});

test('Angel One remains approval pending without requiring credentials', async () => {
  const response = await handleBrokerV2Request({ request: new Request('https://stockpro1.qzz.io/api/broker/angelone/status'), path: '/api/broker/angelone/status', env: {}, authResolver: auth });
  const payload = await response!.json();
  expect(response!.status).toBe(200);
  expect(payload).toMatchObject({ status: 'setup_pending', configured: false, provider: 'angelone', isConnected: false });
});

test('official provider shapes validate and malformed candles are rejected', async () => {
  globalThis.fetch = async () => json({ status: 'success', data: { user_id: 'U1', user_name: 'Research User', is_active: true } });
  const upstox = await testReadOnlyBrokerProvider({ provider: 'upstox', accessToken: 'token', mode: 'live' }, { testType: 'profile' });
  expect(upstox.ok).toBe(true);
  const candle = normalizeBrokerCandle(['2026-07-01T09:15:00.000Z', 100, 105, 98, 102, 1000], { provider: 'upstox', symbol: 'INFY', exchange: 'NSE', instrumentToken: 'NSE_EQ|1' });
  expect(candle).toMatchObject({ symbol: 'INFY', close: 102, lastPrice: 102, provider: 'upstox' });
  expect(() => normalizeBrokerCandle(['2026-07-01T09:15:00.000Z', 100, 99, 101, 102, 1000], { provider: 'upstox', symbol: 'INFY', exchange: 'NSE', instrumentToken: 'NSE_EQ|1' })).toThrow(/Malformed OHLC/);
});

test('provider error envelopes cannot be reported as successful read-only tests', async () => {
  globalThis.fetch = async () => json({ status: 'error', data: null, error: 'Invalid instrument' });
  const upstox = await testReadOnlyBrokerProvider({ provider: 'upstox', accessToken: 'token', mode: 'live' }, { testType: 'quote', instrumentToken: 'NSE_EQ|1' });
  expect(upstox).toMatchObject({ ok: false, status: 'invalid_response', dataPresent: false });

  globalThis.fetch = async () => json({ status: 'failed', data: null, errorCode: 'DH-905', errorMessage: 'Invalid request' });
  const dhan = await testReadOnlyBrokerProvider({ provider: 'dhan', accessToken: 'token', clientId: '1000000001', mode: 'live' }, { testType: 'quote', instrumentToken: '1' });
  expect(dhan).toMatchObject({ ok: false, status: 'invalid_response', dataPresent: false });
});


test('Upstox read-only quote, historical, option-chain, and instrument-master shapes validate', async () => {
  const requested: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    requested.push(url);
    if (url === 'https://gateway.example/v1/broker/read-only-test') return json({ status: 'ok', dataPresent: true });
    return json({ status: 'success', data: { verified: true } });
  };
  const credentials = { provider: 'upstox' as const, accessToken: 'test-token', mode: 'live' as const };
  const quote = await testReadOnlyBrokerProvider(credentials, { testType: 'quote', instrumentToken: 'NSE_EQ|1' });
  const historical = await testReadOnlyBrokerProvider(credentials, { testType: 'historical', instrumentToken: 'NSE_EQ|1', fromDate: '2026-06-01', toDate: '2026-07-01', interval: 'days' });
  const optionChain = await testReadOnlyBrokerProvider(credentials, { testType: 'option_chain', instrumentToken: 'NSE_INDEX|Nifty 50', expiry: '2026-07-30' });
  const instrumentMaster = await testReadOnlyBrokerProvider({ ...credentials, gatewayUrl: 'https://gateway.example', gatewaySecret: 'test-gateway-credential' }, { testType: 'instrument_master' });
  expect([quote, historical, optionChain, instrumentMaster].every((result) => result.ok)).toBe(true);
  expect(requested).toEqual(expect.arrayContaining([
    expect.stringContaining('/v3/market-quote/ltp'),
    expect.stringContaining('/v3/historical-candle/'),
    expect.stringContaining('/v2/option/chain'),
    'https://gateway.example/v1/broker/read-only-test',
  ]));
});

test('invalid and expired Upstox tokens require reconnect', async () => {
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes('/broker_connections?')) {
      return json([{ user_id: 'user-a', provider: 'upstox', encrypted_token: 'cipher', token_iv: 'iv', status: 'connected', expires_at: new Date(Date.now() - 60_000).toISOString() }]);
    }
    return json({}, 401);
  };
  const invalid = await testReadOnlyBrokerProvider({ provider: 'upstox', accessToken: 'invalid-token', mode: 'live' }, { testType: 'profile' });
  expect(invalid.status).toBe('reconnect_required');
  const expired = await handleBrokerV2Request({
    request: new Request('https://stockpro1.qzz.io/api/broker/upstox/status'),
    path: '/api/broker/upstox/status',
    env: baseEnv,
    authResolver: auth,
  });
  expect(await expired!.json()).toMatchObject({ status: 'reconnect_required', isConnected: false });
});

test('AES-GCM vault rejects tampering and cross-user decryption', async () => {
  const secret = 'test-vault-material-with-more-than-thirty-two-characters';
  const encrypted = await encryptBrokerToken({ token: 'provider-token-value', provider: 'upstox', userId: 'user-a', secret });
  expect(encrypted.status).toBe('ok');
  const crossUser = await decryptBrokerToken({ record: { ...encrypted.record!, userId: 'user-b' }, secret });
  expect(crossUser.status).toBe('error');
  const tampered = await decryptBrokerToken({ record: { ...encrypted.record!, encryptedToken: `${encrypted.record!.encryptedToken.slice(0, -2)}AA` }, secret });
  expect(tampered.status).toBe('error');
});

test('CRT provider readiness is scoped to the authenticated user', async () => {
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    urls.push(url);
    if (url.includes('provider=eq.upstox')) return json([{ user_id: 'user-a', provider: 'upstox', status: 'connected', encrypted_token: 'cipher', token_iv: 'iv', expires_at: new Date(Date.now() + 60_000).toISOString() }]);
    if (url.includes('provider=eq.dhan')) return json([]);
    throw new Error(`Unexpected fetch: ${url}`);
  };
  const response = await handleBrokerCrtRequest({
    request: new Request('https://stockpro1.qzz.io/api/crt-scanner/providers'),
    path: '/api/crt-scanner/providers',
    env: baseEnv,
    ctx: undefined,
    authResolver: auth,
    allowRequest: async () => true,
  });
  const payload = await response!.json();
  expect(payload.data).toEqual(expect.arrayContaining([
    expect.objectContaining({ provider: 'upstox', connected: true, enabled: true }),
    expect.objectContaining({ provider: 'angelone', connected: false, enabled: false, reason: 'approval_pending' }),
  ]));
  expect(urls.every((url) => url.includes('user_id=eq.user-a'))).toBe(true);
});

test('saved CRT result load never refetches a broker provider', async () => {
  const providerUrls: string[] = [];
  const runId = '11111111-1111-4111-8111-111111111111';
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (/api\.(upstox|dhan)\.co/.test(url)) providerUrls.push(url);
    if (url.includes('/crt_scan_runs?')) return json([{ status: 'completed', processed_symbols: 1, total_symbols: 1, result_count: 1 }]);
    if (url.includes('/crt_scan_results?')) return json([{ result_payload: { symbol: 'INFY', provider: 'upstox', dataCapturedAt: '2026-07-01T09:15:00.000Z' } }]);
    throw new Error(`Unexpected fetch: ${url}`);
  };
  const response = await handleBrokerCrtRequest({
    request: new Request(`https://stockpro1.qzz.io/api/crt-scanner/results/${runId}`),
    path: `/api/crt-scanner/results/${runId}`,
    env: baseEnv,
    ctx: undefined,
    authResolver: auth,
    allowRequest: async () => true,
  });
  const payload = await response!.json();
  expect(response!.status).toBe(200);
  expect(payload.data).toEqual([expect.objectContaining({ symbol: 'INFY', provider: 'upstox' })]);
  expect(providerUrls).toEqual([]);
});

test('saved-research item creation rejects a watchlist owned by another user', async () => {
  const watchlistId = '11111111-1111-4111-8111-111111111111';
  let itemWrites = 0;
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    if (url.includes('/rest/v1/watchlists?')) return json([]);
    if (url.includes('/rest/v1/watchlist_items') && init.method === 'POST') {
      itemWrites += 1;
      return json({}, 201);
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };
  const response = await handleSavedResearchRequest(
    new Request(`https://stockpro1.qzz.io/api/watchlists/${watchlistId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: 'INFY', exchange: 'NSE' }),
    }),
    `/api/watchlists/${watchlistId}/items`,
    {
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-value',
    },
    auth,
  );
  expect(response.status).toBe(404);
  expect(await response.json()).toMatchObject({ status: 'not_found' });
  expect(itemWrites).toBe(0);
});

test('authorized vendor bindings also configure the standardized live provider adapter', async () => {
  const requested: string[] = [];
  globalThis.fetch = async (input) => {
    requested.push(String(input));
    return json({
      status: 'ok',
      source: 'authorized_vendor',
      timestamp: '2026-07-22T00:00:00.000Z',
      delayMinutes: 0,
      isLive: true,
      isStale: false,
      providerStatus: 'connected',
      message: 'Authorized provider connected.',
      data: { status: 'connected' },
    });
  };
  const provider = externalProviderAdapter({
    MARKET_DATA_PROVIDER: 'authorized_vendor',
    AUTHORIZED_VENDOR_BASE_URL: 'https://licensed-provider.example',
    AUTHORIZED_VENDOR_API_KEY: 'server-only-provider-key',
  });
  expect((await provider.health()).status).toBe('ok');
  expect(requested).toEqual(['https://licensed-provider.example/health']);
});

test('Zerodha instrument refresh accepts the official NSE equity CSV shape', async () => {
  let persisted: Array<Record<string, unknown>> = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url === 'https://api.kite.trade/instruments/NSE') {
      return new Response([
        'instrument_token,exchange_token,tradingsymbol,name,last_price,expiry,strike,tick_size,lot_size,instrument_type,segment,exchange',
        '738561,2885,RELIANCE,RELIANCE INDUSTRIES,0,,,0.05,1,EQ,NSE,NSE',
      ].join('\n'), { status: 200, headers: { 'Content-Type': 'text/csv' } });
    }
    if (url.includes('/rest/v1/market_instruments')) {
      persisted = JSON.parse(String(init?.body));
      return json(persisted, 201);
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };
  const response = await handleCrtScannerRequest(
    new Request('https://stockpro1.qzz.io/api/market/instruments/refresh', {
      method: 'POST',
      headers: { 'X-Admin-Token': 'admin-test-value' },
    }),
    '/api/market/instruments/refresh',
    {
      MARKET_DATA_PROVIDER: 'zerodha',
      ZERODHA_API_KEY: 'zerodha-api-key',
      ZERODHA_ACCESS_TOKEN: 'zerodha-access-token',
      ADMIN_ACCESS_TOKEN: 'admin-test-value',
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-value',
      SUPABASE_MARKET_INSTRUMENTS_TABLE: 'market_instruments',
    },
    undefined,
    async () => true,
  );
  const payload = await response.json();
  expect(payload).toMatchObject({ status: 'ok', count: 1 });
  expect(persisted).toHaveLength(1);
  expect(persisted[0]).toMatchObject({ instrument_token: '738561', symbol: 'RELIANCE', segment: 'EQ', active: true });
});

test('database readiness probes all 18 mandatory tables including broker OAuth state storage', async () => {
  const requested: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    requested.push(url);
    return url.includes('/rest/v1/broker_oauth_states?') ? json({}, 404) : json([]);
  };
  const response = await stockproWorker.fetch(
    new Request('https://stockpro1.qzz.io/api/database/readiness'),
    {
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-value',
      SUPABASE_BROKER_OAUTH_STATES_TABLE: 'broker_oauth_states',
    },
    undefined,
  );
  const payload = await response.json();
  expect(response.status).toBe(200);
  expect(payload.status).toBe('setup_required');
  expect(payload.configured).toBe(false);
  expect(Object.keys(payload.tables)).toHaveLength(18);
  expect(payload.tables.broker_oauth_states).toBe('missing');
  expect(requested.some((url) => url.includes('/rest/v1/broker_oauth_states?'))).toBe(true);
});

test('database readiness honors a custom broker-connections table binding', async () => {
  const requested: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    requested.push(url);
    return url.includes('/rest/v1/tenant_broker_connections?') ? json({}, 404) : json([]);
  };
  const response = await stockproWorker.fetch(
    new Request('https://stockpro1.qzz.io/api/database/readiness'),
    {
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-value',
      SUPABASE_BROKER_CONNECTIONS_TABLE: 'tenant_broker_connections',
    },
    undefined,
  );
  const payload = await response.json();
  expect(payload.tables.broker_connections).toBe('missing');
  expect(requested.some((url) => url.includes('/rest/v1/tenant_broker_connections?'))).toBe(true);
});

const operationsEnv = {
  SUPABASE_AUTH_ENABLED: 'true',
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_ANON_KEY: 'anon-test-value',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-value',
  TURNSTILE_SECRET_KEY: 'turnstile-test-value',
  SUPABASE_WAITLIST_TABLE: 'waitlist_leads',
  SUPABASE_CRT_SCAN_RUNS_TABLE: 'crt_scan_runs',
  SUPABASE_CRT_SCAN_RESULTS_TABLE: 'crt_scan_results',
  SUPABASE_WATCHLISTS_TABLE: 'watchlists',
  SUPABASE_WATCHLIST_ITEMS_TABLE: 'watchlist_items',
  SUPABASE_ALERTS_TABLE: 'alerts',
  SUPABASE_SAVED_SCREENS_TABLE: 'saved_screeners',
  SUPABASE_SAVED_RESEARCH_TABLE: 'saved_research',
};

async function operationsReadinessWithMissingTable(table: string) {
  globalThis.fetch = async (input) => String(input).includes(`/rest/v1/${table}?`) ? json({}, 404) : json([]);
  const response = await stockproWorker.fetch(
    new Request('https://stockpro1.qzz.io/api/operations/readiness'),
    operationsEnv,
    undefined,
  );
  return { response, payload: await response.json() };
}

test('operations readiness requires every CRT and saved-research table to be reachable', async () => {
  const cases = [
    ['crt_scan_runs', 'crtStorage'],
    ['crt_scan_results', 'crtStorage'],
    ['watchlists', 'savedResearch'],
    ['watchlist_items', 'savedResearch'],
    ['alerts', 'savedResearch'],
    ['saved_screeners', 'savedResearch'],
    ['saved_research', 'savedResearch'],
  ] as const;
  for (const [table, service] of cases) {
    const { response, payload } = await operationsReadinessWithMissingTable(table);
    expect(response.status, table).toBe(200);
    expect(payload.services[service], table).toBe('setup_required');
  }
  const { response, payload } = await operationsReadinessWithMissingTable('saved_research');
  expect(response.status).toBe(200);
  expect(payload.services.auth).toBe('configured');
  expect(payload.services.turnstile).toBe('configured');
  expect(payload.services.supabase).toBe('configured');
  expect(payload.services.crtStorage).toBe('configured');
  expect(payload.services.savedResearch).toBe('setup_required');
  expect(payload.services.paymentLive).toBe('disabled');
});

test('waitlist health reports reachable and unavailable storage truthfully', async () => {
  globalThis.fetch = async () => json([]);
  const reachable = await stockproWorker.fetch(
    new Request('https://stockpro1.qzz.io/api/waitlist/health'),
    operationsEnv,
    undefined,
  );
  expect(reachable.status).toBe(200);
  expect(await reachable.json()).toMatchObject({ status: 'ok', configured: true });

  globalThis.fetch = async () => json({}, 503);
  const unavailable = await stockproWorker.fetch(
    new Request('https://stockpro1.qzz.io/api/waitlist/health'),
    operationsEnv,
    undefined,
  );
  expect(unavailable.status).toBe(503);
  expect(await unavailable.json()).toMatchObject({ status: 'unavailable', configured: false });
});
