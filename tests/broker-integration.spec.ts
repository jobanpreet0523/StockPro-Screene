import { expect, test } from '@playwright/test';
import { handleBrokerV2Request } from '../src/core/brokerServer';
import { normalizeBrokerCandle, testReadOnlyBrokerProvider } from '../src/core/brokerProvider';
import { handleBrokerCrtRequest } from '../src/core/crtScannerBrokerServer';
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
