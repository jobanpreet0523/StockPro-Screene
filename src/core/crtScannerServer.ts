import { evaluateCrtSnapshot, defaultCrtFilters, type CrtCandle, type CrtScanFilters, type CrtInstrumentSnapshot } from './crtScanner';
import { getSupabaseServerConfig, type SupabaseServerEnv } from './supabaseServer';

interface CrtEnv extends SupabaseServerEnv {
  MARKET_DATA_PROVIDER?: string;
  ZERODHA_API_KEY?: string;
  ZERODHA_ACCESS_TOKEN?: string;
  AUTHORIZED_VENDOR_API_KEY?: string;
  AUTHORIZED_VENDOR_BASE_URL?: string;
  SUPABASE_MARKET_INSTRUMENTS_TABLE?: string;
  SUPABASE_CRT_SCAN_RUNS_TABLE?: string;
  SUPABASE_CRT_SCAN_RESULTS_TABLE?: string;
  CRT_SCAN_BATCH_SIZE?: string;
  ADMIN_ACCESS_TOKEN?: string;
}

interface ExecutionContextLike { waitUntil(promise: Promise<unknown>): void }

const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers });
const clean = (value: unknown) => typeof value === 'string' ? value.trim() : '';
function tokenEquals(left: string, right: string) {
  const a = new TextEncoder().encode(left); const b = new TextEncoder().encode(right);
  if (!a.length || a.length !== b.length) return false;
  let difference = 0; for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}
const tableName = (value: unknown, fallback: string) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(clean(value)) ? clean(value) : fallback;

function providerConfig(env: CrtEnv) {
  const provider = clean(env.MARKET_DATA_PROVIDER);
  const zerodha = provider === 'zerodha' && clean(env.ZERODHA_API_KEY) && clean(env.ZERODHA_ACCESS_TOKEN);
  let vendorUrl = clean(env.AUTHORIZED_VENDOR_BASE_URL).replace(/\/+$/, '');
  try { if (new URL(vendorUrl).protocol !== 'https:') vendorUrl = ''; } catch { vendorUrl = ''; }
  const vendor = provider === 'authorized_vendor' && vendorUrl && clean(env.AUTHORIZED_VENDOR_API_KEY);
  return {
    provider,
    configured: Boolean(zerodha || vendor),
    message: zerodha || vendor
      ? `${provider} is configured for backend-only market snapshots.`
      : 'Live market data provider not configured. CRT Scanner cannot run without authorized market data.',
    vendorUrl,
  };
}

function dbConfig(env: CrtEnv) {
  const supabase = getSupabaseServerConfig(env);
  return {
    supabase,
    instruments: tableName(env.SUPABASE_MARKET_INSTRUMENTS_TABLE, 'market_instruments'),
    runs: tableName(env.SUPABASE_CRT_SCAN_RUNS_TABLE, 'crt_scan_runs'),
    results: tableName(env.SUPABASE_CRT_SCAN_RESULTS_TABLE, 'crt_scan_results'),
  };
}

async function supabaseRequest(env: CrtEnv, table: string, init: RequestInit, query = '') {
  const { supabase } = dbConfig(env);
  if (!supabase.configured) throw new Error('Supabase storage is not configured.');
  return fetch(`${supabase.url}/rest/v1/${table}${query}`, {
    ...init,
    headers: { ...supabase.headers, 'Content-Type': 'application/json', Prefer: 'return=representation,resolution=merge-duplicates', ...(init.headers || {}) },
  });
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i += 1; } else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(value); value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(value); if (row.some(Boolean)) rows.push(row); row = []; value = '';
    } else value += char;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  const [columns, ...data] = rows;
  return data.map((values) => Object.fromEntries(columns.map((column, index) => [column, values[index] || ''])));
}

async function refreshInstruments(env: CrtEnv) {
  const config = providerConfig(env);
  if (!config.configured) throw new Error(config.message);
  let records: Array<Record<string, unknown>> = [];
  if (config.provider === 'zerodha') {
    const response = await fetch('https://api.kite.trade/instruments/NSE', {
      headers: { 'X-Kite-Version': '3', Authorization: `token ${clean(env.ZERODHA_API_KEY)}:${clean(env.ZERODHA_ACCESS_TOKEN)}` },
    });
    if (!response.ok) throw new Error('Zerodha instrument master request failed.');
    records = parseCsv(await response.text());
  } else {
    const response = await fetch(`${config.vendorUrl}/instruments?exchange=NSE&segment=EQ`, {
      headers: { Authorization: `Bearer ${clean(env.AUTHORIZED_VENDOR_API_KEY)}`, Accept: 'application/json' },
    });
    const payload = await response.json().catch(() => null) as { data?: Array<Record<string, unknown>> } | null;
    if (!response.ok || !Array.isArray(payload?.data)) throw new Error('Authorized vendor instrument master returned malformed data.');
    records = payload.data;
  }

  const now = new Date().toISOString();
  const normalized = records.map((record) => {
    const segment = clean(record.instrument_type) || clean(record.segment);
    const symbol = clean(record.tradingsymbol) || clean(record.symbol);
    const series = clean(record.series) || 'EQ';
    return {
      provider: config.provider,
      instrument_token: String(record.instrument_token || record.instrumentId || record.id || ''),
      exchange: 'NSE',
      segment: 'EQ',
      symbol,
      trading_symbol: symbol,
      name: clean(record.name) || symbol,
      sector: clean(record.sector) || null,
      market_cap: Number(record.marketCap) || null,
      active: segment === 'EQ' && series === 'EQ' && Boolean(symbol),
      provider_payload: { series },
      refreshed_at: now,
    };
  }).filter((row) => row.active && !/(-BE|-SM| SME$)/i.test(row.symbol));

  const db = dbConfig(env);
  const response = await supabaseRequest(env, db.instruments, { method: 'POST', body: JSON.stringify(normalized) }, '?on_conflict=provider,instrument_token');
  if (!response.ok) throw new Error('Instrument master could not be persisted.');
  return normalized.length;
}

function normalizeCandle(raw: unknown): CrtCandle | null {
  if (!Array.isArray(raw) || raw.length < 6) return null;
  const [time, open, high, low, close, volume] = raw;
  const candle = { time: String(time), open: Number(open), high: Number(high), low: Number(low), close: Number(close), volume: Number(volume) };
  return Object.values(candle).every((value) => typeof value === 'string' || Number.isFinite(value)) ? candle : null;
}

async function zerodhaSnapshot(env: CrtEnv, instrument: Record<string, unknown>) {
  const token = encodeURIComponent(String(instrument.instrument_token));
  const to = new Date();
  const from = new Date(to);
  from.setUTCFullYear(from.getUTCFullYear() - 12);
  const query = new URLSearchParams({ from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10), continuous: '0', oi: '0' });
  const response = await fetch(`https://api.kite.trade/instruments/historical/${token}/day?${query}`, {
    headers: { 'X-Kite-Version': '3', Authorization: `token ${clean(env.ZERODHA_API_KEY)}:${clean(env.ZERODHA_ACCESS_TOKEN)}` },
  });
  const payload = await response.json().catch(() => null) as { status?: string; data?: { candles?: unknown[] } } | null;
  if (!response.ok || payload?.status !== 'success' || !Array.isArray(payload.data?.candles)) throw new Error('Zerodha historical candles unavailable.');
  return {
    symbol: String(instrument.symbol),
    companyName: String(instrument.name || instrument.symbol),
    exchange: 'NSE' as const,
    candles: payload.data.candles.map(normalizeCandle).filter((c): c is CrtCandle => Boolean(c)),
    marketCap: Number(instrument.market_cap) || undefined,
    sector: clean(instrument.sector) || undefined,
  };
}

async function vendorSnapshots(env: CrtEnv, instruments: Array<Record<string, unknown>>) {
  const config = providerConfig(env);
  const response = await fetch(`${config.vendorUrl}/crt-snapshot`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${clean(env.AUTHORIZED_VENDOR_API_KEY)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ exchange: 'NSE', segment: 'EQ', interval: 'day', instruments: instruments.map((row) => ({ symbol: row.symbol, instrumentId: row.instrument_token })) }),
  });
  const payload = await response.json().catch(() => null) as { capturedAt?: string; data?: CrtInstrumentSnapshot[] } | null;
  if (!response.ok || !Array.isArray(payload?.data)) throw new Error('Authorized vendor snapshot returned malformed data.');
  return { capturedAt: payload.capturedAt || new Date().toISOString(), data: payload.data };
}

async function updateRun(env: CrtEnv, runId: string, values: Record<string, unknown>) {
  const db = dbConfig(env);
  const response = await supabaseRequest(env, db.runs, { method: 'PATCH', body: JSON.stringify(values) }, `?id=eq.${encodeURIComponent(runId)}`);
  if (!response.ok) throw new Error('CRT scan progress could not be stored.');
}

async function processRun(env: CrtEnv, runId: string, filters: CrtScanFilters) {
  const db = dbConfig(env);
  try {
    await updateRun(env, runId, { status: 'running' });
    const instrumentsResponse = await supabaseRequest(env, db.instruments, { method: 'GET' }, '?exchange=eq.NSE&segment=eq.EQ&active=eq.true&select=*&order=symbol.asc');
    const instruments = await instrumentsResponse.json().catch(() => null) as Array<Record<string, unknown>> | null;
    if (!instrumentsResponse.ok || !Array.isArray(instruments) || !instruments.length) throw new Error('Stored NSE EQ instrument master is empty. Refresh it before scanning.');

    const batchSize = Math.min(100, Math.max(5, Number(env.CRT_SCAN_BATCH_SIZE) || 50));
    let processed = 0;
    let resultCount = 0;
    for (let index = 0; index < instruments.length; index += batchSize) {
      const batch = instruments.slice(index, index + batchSize);
      const capturedAt = new Date().toISOString();
      let snapshots: CrtInstrumentSnapshot[];
      if (providerConfig(env).provider === 'authorized_vendor') {
        snapshots = (await vendorSnapshots(env, batch)).data;
      } else {
        const settled = await Promise.allSettled(batch.map((row) => zerodhaSnapshot(env, row)));
        snapshots = settled.flatMap((entry) => entry.status === 'fulfilled' ? [entry.value] : []);
      }
      const results = snapshots.map((snapshot) => evaluateCrtSnapshot(snapshot, filters, runId, capturedAt)).filter(Boolean);
      if (results.length) {
        const response = await supabaseRequest(env, db.results, { method: 'POST', body: JSON.stringify(results.map((result) => ({
          scan_run_id: runId, symbol: result.symbol, exchange: result.exchange,
          timeframe: result.timeframe, direction: result.direction, mode: result.mode,
          score: result.score,
          entry_price: result.triggerLevel,
          invalidation_price: result.invalidationLevel,
          target_price: result.target1,
          risk_reward: result.riskReward,
          candles: result.chartCandles,
          result_payload: result,
        }))) });
        if (!response.ok) throw new Error('CRT results could not be persisted.');
      }
      processed += batch.length;
      resultCount += results.length;
      await updateRun(env, runId, { processed_symbols: processed, total_symbols: instruments.length, result_count: resultCount });
    }
    await updateRun(env, runId, { status: 'completed', completed_at: new Date().toISOString(), processed_symbols: processed, result_count: resultCount });
  } catch (error) {
    await updateRun(env, runId, { status: 'failed', completed_at: new Date().toISOString(), error_message: error instanceof Error ? error.message.slice(0, 500) : 'CRT scan failed.' }).catch(() => {});
  }
}

function parseFilters(input: unknown): CrtScanFilters | null {
  const base = defaultCrtFilters();
  if (!input || typeof input !== 'object') return base;
  const value = input as Record<string, unknown>;
  const timeframe = ['1D','1W','1M','3M','6M','12M'].includes(String(value.timeframe)) ? value.timeframe as CrtScanFilters['timeframe'] : base.timeframe;
  const mode = ['Forming','Confirmed','Completed'].includes(String(value.mode)) ? value.mode as CrtScanFilters['mode'] : base.mode;
  const direction = ['Bullish','Bearish','Both'].includes(String(value.direction)) ? value.direction as CrtScanFilters['direction'] : base.direction;
  const emaPeriod = [20,50,100,200].includes(Number(value.emaPeriod)) ? Number(value.emaPeriod) as CrtScanFilters['emaPeriod'] : base.emaPeriod;
  return { ...base, ...value, exchange: 'NSE', segment: 'EQ', timeframe, mode, direction, emaPeriod };
}

export async function handleCrtScannerRequest(request: Request, path: string, env: CrtEnv, ctx: ExecutionContextLike | undefined, allowRequest: () => Promise<boolean>) {
  const provider = providerConfig(env);
  const db = dbConfig(env);
  if (path === '/api/market/provider-status') return reply({ status: provider.configured ? 'configured' : 'setup_required', configured: provider.configured, severity: 'info', provider: provider.provider || 'none', message: provider.message });
  if (!db.supabase.configured) return reply({ status: 'setup_required', configured: false, severity: 'info', data: [], message: 'CRT Scanner requires server-side Supabase storage.' });

  if (path === '/api/market/instruments' && request.method === 'GET') {
    const url = new URL(request.url);
    if ((url.searchParams.get('exchange') || 'NSE') !== 'NSE' || (url.searchParams.get('segment') || 'EQ') !== 'EQ') return reply({ status: 'error', message: 'Only NSE EQ is currently supported.' }, 400);
    const response = await supabaseRequest(env, db.instruments, { method: 'GET' }, '?exchange=eq.NSE&segment=eq.EQ&active=eq.true&select=symbol,name,exchange,segment,sector,refreshed_at&order=symbol.asc');
    return reply({ status: response.ok ? 'ok' : 'error', data: response.ok ? await response.json() : [], message: response.ok ? 'Stored instrument universe loaded.' : 'Instrument universe unavailable.' }, response.ok ? 200 : 502);
  }

  if (path === '/api/market/instruments/refresh' && request.method === 'POST') {
    const adminToken = clean(env.ADMIN_ACCESS_TOKEN);
    if (!tokenEquals(clean(request.headers.get('X-Admin-Token')), adminToken)) return reply({ status: 'unauthorized', message: 'Instrument refresh requires server-configured admin access.' }, 401);
    if (!provider.configured) return reply({ status: 'setup_required', configured: false, severity: 'info', message: provider.message });
    if (!(await allowRequest())) return reply({ status: 'error', message: 'Instrument refresh rate limit reached.' }, 429);
    try { return reply({ status: 'ok', count: await refreshInstruments(env), message: 'Authorized provider instrument master refreshed and stored.' }); }
    catch (error) { return reply({ status: 'error', message: error instanceof Error ? error.message : 'Instrument refresh failed.' }, 502); }
  }

  if (path === '/api/crt-scanner/run' && request.method === 'POST') {
    if (!provider.configured) return reply({ status: 'setup_required', configured: false, severity: 'info', message: provider.message });
    if (!(await allowRequest())) return reply({ status: 'error', message: 'Scan rate limit reached. Retry later.' }, 429);
    const body = await request.json().catch(() => null) as { filters?: unknown } | null;
    const filters = parseFilters(body?.filters);
    if (!filters) return reply({ status: 'error', message: 'Valid scan filters are required.' }, 400);
    const runId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const response = await supabaseRequest(env, db.runs, { method: 'POST', body: JSON.stringify({ id: runId, status: 'queued', provider: provider.provider, filters, created_at: createdAt, processed_symbols: 0, result_count: 0 }) });
    if (!response.ok) return reply({ status: 'error', message: 'Scan run could not be persisted.' }, 502);
    const work = processRun(env, runId, filters);
    if (ctx) ctx.waitUntil(work); else await work;
    return reply({ status: 'queued', scan_run_id: runId, data_captured_at: createdAt, message: 'Scan run created. Provider data will be captured once and saved by scan run id.' }, 202);
  }

  const runMatch = path.match(/^\/api\/crt-scanner\/runs\/([0-9a-f-]+)$/i);
  const resultMatch = path.match(/^\/api\/crt-scanner\/results\/([0-9a-f-]+)$/i);
  if (path === '/api/crt-scanner/runs' && request.method === 'GET') {
    const response = await supabaseRequest(env, db.runs, { method: 'GET' }, '?select=id,status,provider,filters,created_at,completed_at,total_symbols,processed_symbols,result_count,error_message&order=created_at.desc&limit=20');
    return reply({ status: response.ok ? 'ok' : 'error', data: response.ok ? await response.json() : [], message: response.ok ? 'Saved scan runs loaded.' : 'Saved scan runs unavailable.' }, response.ok ? 200 : 502);
  }
  if (runMatch && request.method === 'GET') {
    const response = await supabaseRequest(env, db.runs, { method: 'GET' }, `?id=eq.${runMatch[1]}&select=*&limit=1`);
    const rows = response.ok ? await response.json() as unknown[] : [];
    return reply({ status: response.ok ? 'ok' : 'error', data: rows[0] || null, message: rows[0] ? 'Saved scan run loaded.' : 'Scan run not found.' }, rows[0] ? 200 : 404);
  }
  if (resultMatch && request.method === 'GET') {
    const runResponse = await supabaseRequest(env, db.runs, { method: 'GET' }, `?id=eq.${resultMatch[1]}&select=status,processed_symbols,total_symbols,result_count&limit=1`);
    const runs = runResponse.ok ? await runResponse.json() as Array<Record<string, unknown>> : [];
    const run = runs[0];
    if (!run) return reply({ status: 'error', data: [], message: 'Scan run not found.' }, 404);
    if (run.status !== 'completed') return reply({ status: run.status, data: [], progress: run, message: 'Scan is not complete. Final results are not exposed yet.' }, 202);
    const response = await supabaseRequest(env, db.results, { method: 'GET' }, `?scan_run_id=eq.${resultMatch[1]}&select=result_payload&order=symbol.asc`);
    const rows = response.ok ? await response.json() as Array<{ result_payload: unknown }> : [];
    return reply({ status: response.ok ? 'ok' : 'error', data: rows.map((row) => row.result_payload), message: response.ok ? 'Saved final scan results loaded without provider refetch.' : 'Saved results unavailable.' }, response.ok ? 200 : 502);
  }
  return reply({ status: 'error', message: 'CRT Scanner API route not found.' }, 404);
}
