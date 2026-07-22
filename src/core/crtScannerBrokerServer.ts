import { z } from 'zod';
import { defaultCrtFilters, evaluateCrtSnapshot, type CrtCandle, type CrtScanFilters } from './crtScanner';
import { decryptBrokerToken } from './tokenVault';

type Provider = 'upstox' | 'dhan';
type Env = Record<string, string | undefined>;
type AuthResult = { status: string; user: { id: string } | null; message: string };
type AuthResolver = (request: Request, env: Env) => Promise<AuthResult>;
type Context = { waitUntil(promise: Promise<unknown>): void } | undefined;

interface ConnectionRow {
  user_id: string;
  provider: Provider;
  encrypted_token: string;
  token_iv: string;
  status: string;
  expires_at?: string | null;
  connected_at?: string | null;
}

interface InstrumentRow {
  provider: Provider;
  instrument_token: string;
  exchange: string;
  segment: string;
  symbol: string;
  trading_symbol: string;
  name?: string | null;
  sector?: string | null;
  market_cap?: number | null;
}

const clean = (value: unknown, max = 1000) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const bool = (value: unknown) => String(value || '').trim().toLowerCase() === 'true';
const table = (value: unknown, fallback: string) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(clean(value, 100)) ? clean(value, 100) : fallback;
const reply = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

function database(env: Env) {
  const url = clean(env.SUPABASE_URL, 500).replace(/\/+$/, '');
  const key = clean(env.SUPABASE_SERVICE_ROLE_KEY, 4000);
  let validUrl = false;
  try { validUrl = new URL(url).protocol === 'https:'; } catch { validUrl = false; }
  return {
    url, key, configured: validUrl && Boolean(key),
    connections: table(env.SUPABASE_BROKER_CONNECTIONS_TABLE, 'broker_connections'),
    instruments: table(env.SUPABASE_MARKET_INSTRUMENTS_TABLE, 'market_instruments'),
    runs: table(env.SUPABASE_CRT_SCAN_RUNS_TABLE, 'crt_scan_runs'),
    results: table(env.SUPABASE_CRT_SCAN_RESULTS_TABLE, 'crt_scan_results'),
  };
}

async function dbFetch(env: Env, path: string, init: RequestInit = {}) {
  const db = database(env);
  if (!db.configured) throw new Error('CRT storage is not configured.');
  return fetch(`${db.url}/rest/v1/${path}`, { ...init, headers: { apikey: db.key, Authorization: `Bearer ${db.key}`, Accept: 'application/json', 'Content-Type': 'application/json', ...(init.headers || {}) } });
}

async function requireUser(request: Request, env: Env, authResolver: AuthResolver) {
  const auth = await authResolver(request, env);
  if (auth.status === 'setup_required') return { userId: null, response: reply({ status: 'setup_required', configured: false, severity: 'info', message: auth.message }) };
  if (auth.status !== 'authenticated' || !auth.user) return { userId: null, response: reply({ status: 'login_required', configured: false, severity: 'info', message: 'Log in before running or loading a CRT scan.' }) };
  return { userId: auth.user.id, response: null };
}

async function connection(env: Env, userId: string, provider: Provider) {
  const db = database(env);
  const response = await dbFetch(env, `${db.connections}?user_id=eq.${encodeURIComponent(userId)}&provider=eq.${provider}&select=user_id,provider,encrypted_token,token_iv,status,expires_at,connected_at&limit=1`);
  const rows = response.ok ? await response.json().catch(() => null) : null;
  return (Array.isArray(rows) ? rows[0] : null) as ConnectionRow | null;
}

function dhanGateway(env: Env) {
  const url = clean(env.DHAN_PROVIDER_GATEWAY_URL, 1000).replace(/\/+$/, '');
  const secret = clean(env.DHAN_PROVIDER_GATEWAY_SECRET, 1000);
  try {
    return new URL(url).protocol === 'https:' && secret ? { url, secret } : null;
  } catch { return null; }
}

function dataReadiness(env: Env, provider: Provider) {
  if (provider === 'upstox') return { ready: true, reason: null as string | null };
  if (!bool(env.DHAN_DATA_API_SUBSCRIPTION_ACTIVE)) return { ready: false, reason: 'data_api_subscription_required' };
  const gateway = Boolean(dhanGateway(env));
  if (!bool(env.DHAN_STATIC_IP_CONFIGURED) && !gateway) return { ready: false, reason: 'static_ip_required' };
  if (!bool(env.DHAN_HISTORICAL_PERMISSION)) return { ready: false, reason: 'historical_permission_required' };
  return { ready: true, reason: null };
}

async function providerList(env: Env, userId: string) {
  const result = [];
  for (const provider of ['upstox', 'dhan'] as const) {
    const row = await connection(env, userId, provider).catch(() => null);
    const expired = Boolean(row?.expires_at && Date.parse(row.expires_at) <= Date.now());
    const readiness = dataReadiness(env, provider);
    result.push({ provider, enabled: row?.status === 'connected' && !expired && readiness.ready, connected: row?.status === 'connected' && !expired, reason: expired ? 'token_expired' : readiness.reason || (row ? null : 'not_connected') });
  }
  result.push({ provider: 'angelone', enabled: false, connected: false, reason: 'approval_pending' });
  return result;
}

function parseFilters(input: unknown): CrtScanFilters {
  const base = defaultCrtFilters();
  const schema = z.object({
    timeframe: z.enum(['1D', '1W', '1M', '3M', '6M', '12M']).default(base.timeframe),
    direction: z.enum(['Bullish', 'Bearish', 'Both']).default(base.direction),
    mode: z.enum(['Forming', 'Confirmed', 'Completed']).default(base.mode),
    minPrice: z.coerce.number().finite().nonnegative().default(base.minPrice),
    maxPrice: z.coerce.number().finite().positive().default(base.maxPrice),
    minAverageVolume: z.coerce.number().finite().nonnegative().default(base.minAverageVolume),
    minScore: z.coerce.number().min(0).max(100).default(base.minScore),
    minimumRiskReward: z.coerce.number().min(0).max(10).default(base.minimumRiskReward),
    volumeConfirmation: z.boolean().default(base.volumeConfirmation), trendFilter: z.boolean().default(base.trendFilter),
    emaPeriod: z.union([z.literal(20), z.literal(50), z.literal(100), z.literal(200)]).default(base.emaPeriod),
    excludeLowLiquidity: z.boolean().default(base.excludeLowLiquidity), excludeInsufficientHistory: z.boolean().default(base.excludeInsufficientHistory), showWeakSetups: z.boolean().default(base.showWeakSetups),
    minMarketCap: z.coerce.number().finite().nonnegative().optional(), sector: z.string().max(100).optional(),
  }).partial().safeParse(input || {});
  if (!schema.success) throw new Error('Valid CRT filters are required.');
  return { ...base, ...schema.data, exchange: 'NSE', segment: 'EQ' };
}

function normalizeTuples(value: unknown): CrtCandle[] {
  const tuples = z.array(z.tuple([z.union([z.string(), z.number()]), z.coerce.number().finite(), z.coerce.number().finite(), z.coerce.number().finite(), z.coerce.number().finite(), z.coerce.number().finite()]).rest(z.unknown())).safeParse(value);
  if (!tuples.success) throw new Error('Provider returned incomplete historical candles.');
  return tuples.data.map(([rawTime, open, high, low, close, volume]) => {
    const time = typeof rawTime === 'number' ? new Date(rawTime > 10_000_000_000 ? rawTime : rawTime * 1000).toISOString() : new Date(rawTime).toISOString();
    if (high < Math.max(open, close) || low > Math.min(open, close)) throw new Error('Provider returned malformed OHLC values.');
    return { time, open, high, low, close, volume };
  });
}

function normalizeDhanColumns(payload: unknown): CrtCandle[] {
  const parsed = z.object({ open: z.array(z.coerce.number().finite()), high: z.array(z.coerce.number().finite()), low: z.array(z.coerce.number().finite()), close: z.array(z.coerce.number().finite()), volume: z.array(z.coerce.number().finite()), timestamp: z.array(z.union([z.string(), z.number()])) }).passthrough().safeParse(payload);
  if (!parsed.success) throw new Error('Dhan returned an incomplete historical response.');
  const { open, high, low, close, volume, timestamp } = parsed.data;
  const length = timestamp.length;
  if (!length || [open, high, low, close, volume].some((items) => items.length !== length)) throw new Error('Dhan historical arrays have inconsistent lengths.');
  return timestamp.map((rawTime, index) => {
    const time = typeof rawTime === 'number' ? new Date(rawTime > 10_000_000_000 ? rawTime : rawTime * 1000).toISOString() : new Date(rawTime).toISOString();
    if (high[index] < Math.max(open[index], close[index]) || low[index] > Math.min(open[index], close[index])) throw new Error('Dhan returned malformed OHLC values.');
    return { time, open: open[index], high: high[index], low: low[index], close: close[index], volume: volume[index] };
  });
}

async function historical(env: Env, provider: Provider, credentials: { accessToken: string; clientId?: string }, instrument: InstrumentRow) {
  const to = new Date(); const from = new Date(to); from.setUTCFullYear(from.getUTCFullYear() - 3);
  if (provider === 'upstox') {
    const url = `https://api.upstox.com/v3/historical-candle/${encodeURIComponent(instrument.instrument_token)}/days/1/${to.toISOString().slice(0, 10)}/${from.toISOString().slice(0, 10)}`;
    const response = await fetch(url, { headers: { Accept: 'application/json', Authorization: `Bearer ${credentials.accessToken}` } });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.status !== 'success') throw new Error('Upstox historical request failed.');
    return normalizeTuples(payload?.data?.candles);
  }
  const gateway = dhanGateway(env);
  if (gateway) {
    const response = await fetch(`${gateway.url}/v1/dhan/historical-candles`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${gateway.secret}` }, body: JSON.stringify({ accessToken: credentials.accessToken, clientId: credentials.clientId, securityId: instrument.instrument_token, exchangeSegment: instrument.segment, fromDate: from.toISOString().slice(0, 10), toDate: to.toISOString().slice(0, 10) }) });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error('Dhan static-IP gateway rejected historical request.');
    return Array.isArray(payload?.data?.candles) ? normalizeTuples(payload.data.candles) : normalizeDhanColumns(payload?.data);
  }
  const response = await fetch('https://api.dhan.co/v2/charts/historical', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'access-token': credentials.accessToken, 'client-id': clean(credentials.clientId, 200) }, body: JSON.stringify({ securityId: instrument.instrument_token, exchangeSegment: instrument.segment, instrument: 'EQUITY', expiryCode: 0, oi: false, fromDate: from.toISOString().slice(0, 10), toDate: to.toISOString().slice(0, 10) }) });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error('Dhan historical request failed.');
  return normalizeDhanColumns(payload);
}

async function updateRun(env: Env, runId: string, userId: string, values: Record<string, unknown>) {
  const db = database(env);
  const response = await dbFetch(env, `${db.runs}?id=eq.${encodeURIComponent(runId)}&user_id=eq.${encodeURIComponent(userId)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(values) });
  if (!response.ok) throw new Error('CRT scan progress could not be persisted.');
}

async function processRun(env: Env, runId: string, userId: string, provider: Provider, filters: CrtScanFilters, row: ConnectionRow) {
  const db = database(env);
  try {
    await updateRun(env, runId, userId, { status: 'running' });
    const decrypted = await decryptBrokerToken({ record: { provider, userId, encryptedToken: row.encrypted_token, iv: row.token_iv, algorithm: 'AES-GCM', createdAt: row.connected_at || new Date().toISOString() }, secret: clean(env.BROKER_TOKEN_ENCRYPTION_KEY || env.BROKER_ENCRYPTION_SECRET, 1000) });
    if (decrypted.status !== 'ok' || !decrypted.token) throw new Error('Broker credentials could not be opened for this scan.');
    const credentials = JSON.parse(decrypted.token) as { accessToken: string; clientId?: string };
    const limit = Math.min(250, Math.max(1, Number(env.CRT_SCAN_MAX_INSTRUMENTS) || 100));
    const instrumentResponse = await dbFetch(env, `${db.instruments}?provider=eq.${provider}&exchange=eq.NSE&active=eq.true&select=provider,instrument_token,exchange,segment,symbol,trading_symbol,name,sector,market_cap&order=symbol.asc&limit=${limit}`);
    const instruments = instrumentResponse.ok ? await instrumentResponse.json().catch(() => null) : null;
    if (!Array.isArray(instruments) || !instruments.length) throw new Error(`Stored ${provider} instrument master is empty.`);
    const capturedAt = new Date().toISOString();
    let processed = 0; let resultCount = 0; let failureCount = 0; let lastFailure = '';
    for (const instrument of instruments as InstrumentRow[]) {
      try {
        const candles = await historical(env, provider, credentials, instrument);
        const result = evaluateCrtSnapshot({ symbol: instrument.symbol, companyName: instrument.name || instrument.trading_symbol || instrument.symbol, exchange: 'NSE', candles, marketCap: Number(instrument.market_cap) || undefined, sector: clean(instrument.sector, 100) || undefined }, filters, runId, capturedAt);
        if (result) {
          const insert = await dbFetch(env, `${db.results}?on_conflict=scan_run_id,symbol,timeframe,mode`, { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ scan_run_id: runId, symbol: result.symbol, exchange: result.exchange, timeframe: result.timeframe, direction: result.direction, mode: result.mode, score: result.score, entry_price: result.triggerLevel, invalidation_price: result.invalidationLevel, target_price: result.target1, risk_reward: result.riskReward, candles: result.chartCandles, result_payload: result, created_at: new Date().toISOString() }) });
          if (!insert.ok) throw new Error('CRT result could not be stored.');
          resultCount += 1;
        }
      } catch (error) {
        failureCount += 1;
        lastFailure = error instanceof Error ? error.message : 'Provider request failed.';
      }
      processed += 1;
      await updateRun(env, runId, userId, { total_symbols: instruments.length, processed_symbols: processed, result_count: resultCount });
    }
    if (failureCount > instruments.length / 2) throw new Error(`${failureCount} of ${instruments.length} provider requests failed. ${lastFailure}`);
    const warning = failureCount ? `${failureCount} of ${instruments.length} instruments could not be processed.` : null;
    await updateRun(env, runId, userId, { status: 'completed', completed_at: new Date().toISOString(), total_symbols: instruments.length, processed_symbols: processed, result_count: resultCount, error_message: warning });
  } catch (error) {
    await updateRun(env, runId, userId, { status: 'failed', completed_at: new Date().toISOString(), error_message: error instanceof Error ? error.message.slice(0, 500) : 'CRT scan failed.' }).catch(() => undefined);
  }
}

export async function handleBrokerCrtRequest(options: { request: Request; path: string; env: Env; ctx: Context; authResolver: AuthResolver; allowRequest: () => Promise<boolean> }): Promise<Response | null> {
  const { request, path, env, ctx, authResolver, allowRequest } = options;
  if (!path.startsWith('/api/crt-scanner/')) return null;
  const auth = await requireUser(request, env, authResolver);
  if (auth.response) return auth.response;
  if (!database(env).configured) return reply({ status: 'setup_required', configured: false, severity: 'info', message: 'CRT Scanner requires server-side Supabase storage.' });
  const userId = auth.userId!;
  if (path === '/api/crt-scanner/providers' && request.method === 'GET') return reply({ status: 'ok', data: await providerList(env, userId), message: 'Per-user CRT provider readiness loaded.' });
  if (path === '/api/crt-scanner/run' && request.method === 'POST') {
    if (!(await allowRequest())) return reply({ status: 'error', message: 'Scan rate limit reached. Retry later.' }, 429);
    const body = await request.json().catch(() => null) as { provider?: string; filters?: unknown } | null;
    if (!body || !['upstox', 'dhan'].includes(String(body.provider))) return reply({ status: 'provider_required', configured: false, severity: 'info', message: 'Select a connected Upstox or Dhan provider.' });
    const provider = body.provider as Provider; const row = await connection(env, userId, provider).catch(() => null); const readiness = dataReadiness(env, provider);
    if (!row || row.status !== 'connected') return reply({ status: 'broker_required', configured: false, severity: 'info', provider, message: `Connect ${provider} before running CRT.` });
    if (row.expires_at && Date.parse(row.expires_at) <= Date.now()) return reply({ status: 'reconnect_required', configured: false, severity: 'info', provider, message: `${provider} token has expired.` });
    if (!readiness.ready) return reply({ status: 'setup_required', configured: false, severity: 'info', provider, reason: readiness.reason, message: `CRT cannot use ${provider} until ${readiness.reason?.replace(/_/g, ' ')} is resolved.` });
    let filters: CrtScanFilters; try { filters = parseFilters(body.filters); } catch (error) { return reply({ status: 'error', message: error instanceof Error ? error.message : 'Invalid filters.' }, 400); }
    const runId = crypto.randomUUID(); const createdAt = new Date().toISOString(); const db = database(env);
    const insert = await dbFetch(env, db.runs, { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ id: runId, user_id: userId, provider, status: 'queued', filters, total_symbols: 0, processed_symbols: 0, result_count: 0, created_at: createdAt }) });
    if (!insert.ok) return reply({ status: 'error', message: 'Scan run could not be persisted.' }, 502);
    const work = processRun(env, runId, userId, provider, filters, row); if (ctx) ctx.waitUntil(work); else await work;
    return reply({ status: 'queued', scan_run_id: runId, provider, data_captured_at: createdAt, message: 'Manual scan created. One provider snapshot is persisted under this run ID.' }, 202);
  }
  const runMatch = path.match(/^\/api\/crt-scanner\/runs\/([0-9a-f-]+)$/i); const resultMatch = path.match(/^\/api\/crt-scanner\/results\/([0-9a-f-]+)$/i); const db = database(env);
  if (path === '/api/crt-scanner/runs' && request.method === 'GET') {
    const response = await dbFetch(env, `${db.runs}?user_id=eq.${encodeURIComponent(userId)}&select=id,status,provider,filters,created_at,completed_at,total_symbols,processed_symbols,result_count,error_message&order=created_at.desc&limit=20`);
    return reply({ status: response.ok ? 'ok' : 'error', data: response.ok ? await response.json() : [], message: response.ok ? 'This user saved scan runs loaded.' : 'Saved runs unavailable.' }, response.ok ? 200 : 502);
  }
  if (runMatch && request.method === 'GET') {
    const response = await dbFetch(env, `${db.runs}?id=eq.${runMatch[1]}&user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`); const rows = response.ok ? await response.json() : [];
    return reply({ status: rows[0] ? 'ok' : 'not_found', data: rows[0] || null, message: rows[0] ? 'Saved run loaded.' : 'Scan run not found.' }, rows[0] ? 200 : 404);
  }
  if (resultMatch && request.method === 'GET') {
    const runResponse = await dbFetch(env, `${db.runs}?id=eq.${resultMatch[1]}&user_id=eq.${encodeURIComponent(userId)}&select=status,processed_symbols,total_symbols,result_count&limit=1`); const runs = runResponse.ok ? await runResponse.json() : []; const run = runs[0];
    if (!run) return reply({ status: 'not_found', data: [], message: 'Scan run not found.' }, 404);
    if (run.status !== 'completed') return reply({ status: run.status, data: [], progress: run, message: 'Final saved results are not available yet.' }, 202);
    const response = await dbFetch(env, `${db.results}?scan_run_id=eq.${resultMatch[1]}&select=result_payload&order=symbol.asc`); const rows = response.ok ? await response.json() : [];
    return reply({ status: response.ok ? 'ok' : 'error', data: rows.map((item: { result_payload: unknown }) => item.result_payload), message: response.ok ? 'Saved results loaded without a provider refetch.' : 'Saved results unavailable.' }, response.ok ? 200 : 502);
  }
  return reply({ status: 'error', message: 'CRT Scanner API route not found.' }, 404);
}
