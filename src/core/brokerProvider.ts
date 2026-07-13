import { z } from 'zod';

export type ReadOnlyBrokerProvider = 'upstox' | 'dhan';
export type BrokerTestKind = 'profile' | 'quote' | 'historical' | 'option_chain' | 'instrument_master';

export interface BrokerProviderCredentials {
  provider: ReadOnlyBrokerProvider;
  accessToken: string;
  clientId?: string;
  mode: 'sandbox' | 'live';
  gatewayUrl?: string;
  gatewaySecret?: string;
}

export interface NormalizedBrokerCandle {
  symbol: string;
  exchange: string;
  instrumentToken: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  lastPrice: number;
  provider: ReadOnlyBrokerProvider;
}

export interface BrokerTestRequest {
  testType: BrokerTestKind;
  instrumentToken?: string;
  symbol?: string;
  exchange?: string;
  fromDate?: string;
  toDate?: string;
  interval?: string;
  expiry?: string;
  underlyingSegment?: string;
}

export interface BrokerTestResult {
  ok: boolean;
  status: 'ok' | 'setup_required' | 'reconnect_required' | 'provider_unavailable' | 'invalid_response';
  testType: BrokerTestKind;
  provider: ReadOnlyBrokerProvider;
  mode: 'sandbox' | 'live';
  dataPresent: boolean;
  message: string;
}


export interface ReadOnlyBrokerAdapter {
  getProviderStatus(userId: string): Promise<BrokerTestResult>;
  getProfile(userId: string): Promise<BrokerTestResult>;
  getInstrumentMaster(userId: string): Promise<BrokerTestResult>;
  getQuotes(userId: string, request: BrokerTestRequest): Promise<BrokerTestResult>;
  getHistoricalCandles(userId: string, request: BrokerTestRequest): Promise<BrokerTestResult>;
  getOptionChain(userId: string, request: BrokerTestRequest): Promise<BrokerTestResult>;
  testConnection(userId: string): Promise<BrokerTestResult>;
  disconnect(userId: string): Promise<{ status: 'not_connected' | 'provider_unavailable'; message: string }>;
}

// Angel One can implement this contract after provider approval without changing CRT callers.
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const safeText = z.string().min(1).max(300);
const finiteNumber = z.coerce.number().finite();
const dhanProfileSchema = z.object({ dhanClientId: z.union([z.string(), z.number()]), dhanClientName: z.string().optional() }).passthrough();
const upstoxProfileSchema = z.object({ status: z.literal('success'), data: z.object({ user_id: z.string().optional(), user_name: z.string().optional(), is_active: z.boolean().optional() }).passthrough() }).passthrough();
const dhanEnvelopeSchema = z.object({ status: z.union([z.string(), z.number()]).optional(), data: z.unknown().optional(), errorCode: z.unknown().optional(), errorType: z.unknown().optional(), errorMessage: z.unknown().optional() }).passthrough();
const upstoxEnvelopeSchema = z.object({ status: z.string(), data: z.unknown().optional() }).passthrough();

function clean(value: unknown, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function safeGateway(credentials: BrokerProviderCredentials) {
  const url = clean(credentials.gatewayUrl, 1000).replace(/\/+$/, '');
  const secret = clean(credentials.gatewaySecret, 1000);
  try {
    return new URL(url).protocol === 'https:' && secret ? { url, secret } : null;
  } catch {
    return null;
  }
}

function providerHeaders(credentials: BrokerProviderCredentials) {
  if (credentials.provider === 'upstox') {
    return { Accept: 'application/json', Authorization: `Bearer ${credentials.accessToken}` };
  }
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'access-token': credentials.accessToken,
    'client-id': clean(credentials.clientId, 120),
  };
}

function reconnect(testType: BrokerTestKind, credentials: BrokerProviderCredentials, message: string): BrokerTestResult {
  return { ok: false, status: 'reconnect_required', testType, provider: credentials.provider, mode: credentials.mode, dataPresent: false, message };
}

function invalid(testType: BrokerTestKind, credentials: BrokerProviderCredentials, message: string): BrokerTestResult {
  return { ok: false, status: 'invalid_response', testType, provider: credentials.provider, mode: credentials.mode, dataPresent: false, message };
}

function success(testType: BrokerTestKind, credentials: BrokerProviderCredentials, dataPresent: boolean): BrokerTestResult {
  return {
    ok: true,
    status: 'ok',
    testType,
    provider: credentials.provider,
    mode: credentials.mode,
    dataPresent,
    message: `${credentials.provider} ${testType.replace('_', ' ')} request returned a validated read-only response.`,
  };
}

async function providerFetch(credentials: BrokerProviderCredentials, url: string, init: RequestInit = {}) {
  return fetch(url, { ...init, headers: { ...providerHeaders(credentials), ...(init.headers || {}) } });
}

async function gatewayTest(credentials: BrokerProviderCredentials, request: BrokerTestRequest): Promise<BrokerTestResult> {
  const gateway = safeGateway(credentials);
  if (!gateway) {
    return { ok: false, status: 'setup_required', testType: request.testType, provider: credentials.provider, mode: credentials.mode, dataPresent: false, message: 'A configured HTTPS provider gateway with a static outbound IP is required for this request.' };
  }
  const response = await fetch(`${gateway.url}/v1/broker/read-only-test`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${gateway.secret}` },
    body: JSON.stringify({ provider: credentials.provider, mode: credentials.mode, request }),
  }).catch(() => null);
  if (!response?.ok) return reconnect(request.testType, credentials, 'Secure provider gateway rejected the read-only request.');
  const payload = await response.json().catch(() => null);
  const parsed = z.object({ status: z.literal('ok'), dataPresent: z.boolean() }).safeParse(payload);
  return parsed.success ? success(request.testType, credentials, parsed.data.dataPresent) : invalid(request.testType, credentials, 'Provider gateway returned an invalid response.');
}

function validateRequest(input: BrokerTestRequest) {
  const base = z.object({
    testType: z.enum(['profile', 'quote', 'historical', 'option_chain', 'instrument_master']),
    instrumentToken: safeText.optional(), symbol: safeText.optional(), exchange: safeText.optional(),
    fromDate: isoDate.optional(), toDate: isoDate.optional(), interval: safeText.optional(),
    expiry: isoDate.optional(), underlyingSegment: safeText.optional(),
  }).strict().safeParse(input);
  if (!base.success) throw new Error('A valid read-only broker test request is required.');
  if (base.data.testType !== 'profile' && base.data.testType !== 'instrument_master' && !base.data.instrumentToken) throw new Error('instrumentToken is required for this provider test.');
  if (base.data.testType === 'historical' && (!base.data.fromDate || !base.data.toDate)) throw new Error('Historical testing requires fromDate and toDate.');
  if (base.data.testType === 'option_chain' && !base.data.expiry) throw new Error('Option-chain testing requires expiry.');
  return base.data;
}

export async function testReadOnlyBrokerProvider(credentials: BrokerProviderCredentials, rawRequest: BrokerTestRequest): Promise<BrokerTestResult> {
  let request: ReturnType<typeof validateRequest>;
  try { request = validateRequest(rawRequest); } catch (error) {
    return { ok: false, status: 'invalid_response', testType: rawRequest.testType || 'profile', provider: credentials.provider, mode: credentials.mode, dataPresent: false, message: error instanceof Error ? error.message : 'Invalid test request.' };
  }

  if (credentials.mode === 'sandbox' && credentials.provider !== 'dhan') {
    return { ok: false, status: 'setup_required', testType: request.testType, provider: credentials.provider, mode: credentials.mode, dataPresent: false, message: 'Sandbox mode is supported only for explicit Dhan developer validation.' };
  }
  if (request.testType === 'instrument_master') return gatewayTest(credentials, request);
  if (credentials.provider === 'dhan' && credentials.mode === 'live' && ['quote', 'historical', 'option_chain'].includes(request.testType) && safeGateway(credentials)) return gatewayTest(credentials, request);

  let url: string;
  let init: RequestInit = {};
  if (credentials.provider === 'upstox') {
    if (request.testType === 'profile') url = 'https://api.upstox.com/v2/user/profile';
    else if (request.testType === 'quote') url = `https://api.upstox.com/v3/market-quote/ltp?instrument_key=${encodeURIComponent(request.instrumentToken!)}`;
    else if (request.testType === 'historical') {
      const interval = clean(request.interval || 'days', 20);
      url = `https://api.upstox.com/v3/historical-candle/${encodeURIComponent(request.instrumentToken!)}/${encodeURIComponent(interval)}/1/${request.toDate}/${request.fromDate}`;
    } else {
      url = `https://api.upstox.com/v2/option/chain?instrument_key=${encodeURIComponent(request.instrumentToken!)}&expiry_date=${request.expiry}`;
    }
  } else {
    if (!clean(credentials.clientId, 120)) return invalid(request.testType, credentials, 'Dhan client ID is missing from the encrypted connection.');
    if (request.testType === 'profile') url = 'https://api.dhan.co/v2/profile';
    else if (request.testType === 'quote') {
      url = 'https://api.dhan.co/v2/marketfeed/quote'; init = { method: 'POST', body: JSON.stringify({ [request.exchange || 'NSE_EQ']: [Number(request.instrumentToken)] }) };
    } else if (request.testType === 'historical') {
      url = 'https://api.dhan.co/v2/charts/historical'; init = { method: 'POST', body: JSON.stringify({ securityId: request.instrumentToken, exchangeSegment: request.exchange || 'NSE_EQ', instrument: 'EQUITY', expiryCode: 0, oi: false, fromDate: request.fromDate, toDate: request.toDate }) };
    } else {
      url = 'https://api.dhan.co/v2/optionchain'; init = { method: 'POST', body: JSON.stringify({ UnderlyingScrip: Number(request.instrumentToken), UnderlyingSeg: request.underlyingSegment || 'IDX_I', Expiry: request.expiry }) };
    }
  }

  const response = await providerFetch(credentials, url, init).catch(() => null);
  if (!response?.ok) return reconnect(request.testType, credentials, 'Broker rejected the read-only request. Reconnect or verify provider permissions.');
  const payload = await response.json().catch(() => null);
  if (request.testType === 'profile') {
    const parsed = credentials.provider === 'upstox' ? upstoxProfileSchema.safeParse(payload) : dhanProfileSchema.safeParse(payload);
    return parsed.success ? success(request.testType, credentials, true) : invalid(request.testType, credentials, 'Broker profile response was malformed.');
  }
  if (credentials.provider === 'upstox') {
    const parsed = upstoxEnvelopeSchema.safeParse(payload);
    if (!parsed.success || parsed.data.status !== 'success' || parsed.data.data === null || parsed.data.data === undefined) return invalid(request.testType, credentials, 'Upstox market-data response did not report success.');
    return success(request.testType, credentials, true);
  }
  const parsed = dhanEnvelopeSchema.safeParse(payload);
  const status = parsed.success ? String(parsed.data.status ?? 'success').toLowerCase() : '';
  const hasError = parsed.success && [parsed.data.errorCode, parsed.data.errorType, parsed.data.errorMessage].some((value) => value !== null && value !== undefined && value !== '');
  const acceptedStatus = ['success', 'ok', '200'].includes(status);
  if (!parsed.success || !acceptedStatus || hasError || parsed.data.data === null || parsed.data.data === undefined) return invalid(request.testType, credentials, 'Dhan market-data response did not report success.');
  return success(request.testType, credentials, true);
}

export function normalizeBrokerCandle(input: unknown, expected: { provider: ReadOnlyBrokerProvider; symbol: string; exchange: string; instrumentToken: string }): NormalizedBrokerCandle {
  const tuple = z.tuple([z.union([z.string(), z.number()]), finiteNumber, finiteNumber, finiteNumber, finiteNumber, finiteNumber]).rest(z.unknown()).safeParse(input);
  if (!tuple.success) throw new Error('Incomplete historical candle response.');
  const [rawTimestamp, open, high, low, close, volume] = tuple.data;
  const timestamp = typeof rawTimestamp === 'number' ? new Date(rawTimestamp > 10_000_000_000 ? rawTimestamp : rawTimestamp * 1000).toISOString() : new Date(rawTimestamp).toISOString();
  if (![open, high, low, close, volume].every(Number.isFinite) || high < Math.max(open, close) || low > Math.min(open, close)) throw new Error('Malformed OHLC values.');
  if (!clean(expected.symbol) || !clean(expected.exchange) || !clean(expected.instrumentToken)) throw new Error('Expected symbol, exchange, and instrument token are required.');
  return { symbol: expected.symbol, exchange: expected.exchange, instrumentToken: expected.instrumentToken, timestamp, open, high, low, close, volume, lastPrice: close, provider: expected.provider };
}
