import { z } from 'zod';
import { validateProviderData } from './apiValidation';

export type AuthorizedProviderKind = 'dhan' | 'upstox' | 'zerodha' | 'authorized_vendor';
export type ProviderState = 'configured' | 'setup_required' | 'provider_required' | 'unavailable';

export interface AuthorizedProviderStatus {
  status: ProviderState;
  configured: boolean;
  provider: AuthorizedProviderKind | 'none';
  message: string;
}

export interface ProviderInstrument {
  instrumentId: string;
  exchange: string;
  segment: string;
  symbol: string;
  tradingSymbol: string;
  name?: string;
}

export interface ProviderQuote {
  instrumentId: string;
  symbol: string;
  lastPrice: number;
  capturedAt: string;
}

export interface ProviderCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  openInterest?: number;
}

export interface HistoricalCandleRequest {
  instrumentId: string;
  interval: string;
  from: string;
  to: string;
}

export interface AuthorizedMarketProvider {
  getProviderStatus(): Promise<AuthorizedProviderStatus>;
  getInstrumentMaster(): Promise<ProviderInstrument[]>;
  refreshInstrumentMaster(): Promise<ProviderInstrument[]>;
  getQuotes(instrumentIds: string[]): Promise<ProviderQuote[]>;
  getHistoricalCandles(request: HistoricalCandleRequest): Promise<ProviderCandle[]>;
  getOptionChain?(instrumentId: string, expiry?: string): Promise<unknown>;
}

export interface AuthorizedProviderEnv {
  MARKET_DATA_PROVIDER?: string;
  AUTHORIZED_VENDOR_BASE_URL?: string;
  AUTHORIZED_VENDOR_API_KEY?: string;
  DHAN_CLIENT_ID?: string;
  DHAN_ACCESS_TOKEN?: string;
  UPSTOX_CLIENT_ID?: string;
  UPSTOX_CLIENT_SECRET?: string;
  UPSTOX_ACCESS_TOKEN?: string;
  ZERODHA_API_KEY?: string;
  ZERODHA_ACCESS_TOKEN?: string;
}

const instrumentSchema = z.object({
  instrumentId: z.string().min(1),
  exchange: z.string().min(1),
  segment: z.string().min(1),
  symbol: z.string().min(1),
  tradingSymbol: z.string().min(1),
  name: z.string().optional(),
}).strict();
const quoteSchema = z.object({
  instrumentId: z.string().min(1),
  symbol: z.string().min(1),
  lastPrice: z.number().finite(),
  capturedAt: z.iso.datetime(),
}).strict();
const candleSchema = z.object({
  timestamp: z.iso.datetime(),
  open: z.number().finite(),
  high: z.number().finite(),
  low: z.number().finite(),
  close: z.number().finite(),
  volume: z.number().nonnegative(),
  openInterest: z.number().nonnegative().optional(),
}).strict();

const clean = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const providerKinds = new Set<AuthorizedProviderKind>(['dhan', 'upstox', 'zerodha', 'authorized_vendor']);

function setupProvider(provider: AuthorizedProviderKind | 'none', message: string): AuthorizedMarketProvider {
  const status = async (): Promise<AuthorizedProviderStatus> => ({ status: 'setup_required', configured: false, provider, message });
  const unavailable = async <T>(): Promise<T[]> => [];
  return {
    getProviderStatus: status,
    getInstrumentMaster: unavailable,
    refreshInstrumentMaster: unavailable,
    getQuotes: unavailable,
    getHistoricalCandles: unavailable,
    getOptionChain: async () => ({ status: 'setup_required', configured: false, provider, message }),
  };
}

function authorizedVendorProvider(env: AuthorizedProviderEnv): AuthorizedMarketProvider {
  const baseUrl = clean(env.AUTHORIZED_VENDOR_BASE_URL).replace(/\/+$/, '');
  const apiKey = clean(env.AUTHORIZED_VENDOR_API_KEY);
  const request = async (path: string, init: RequestInit = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { Accept: 'application/json', Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
    });
    if (!response.ok) throw new Error(`Authorized provider request failed with HTTP ${response.status}.`);
    return response.json();
  };
  const array = <T>(schema: z.ZodType<T>, value: unknown): T[] => {
    const validated = validateProviderData(z.array(schema), value);
    if (validated.ok === false) throw new Error(validated.message);
    return validated.data;
  };
  return {
    getProviderStatus: async () => {
      try {
        const payload = await request('/status');
        return { status: payload?.status === 'ok' ? 'configured' : 'unavailable', configured: payload?.status === 'ok', provider: 'authorized_vendor', message: clean(payload?.message) || 'Authorized provider status checked.' };
      } catch {
        return { status: 'unavailable', configured: true, provider: 'authorized_vendor', message: 'Authorized provider is configured but currently unavailable.' };
      }
    },
    getInstrumentMaster: async () => array(instrumentSchema, await request('/instruments')),
    refreshInstrumentMaster: async () => array(instrumentSchema, await request('/instruments/refresh', { method: 'POST' })),
    getQuotes: async (instrumentIds) => array(quoteSchema, await request('/quotes', { method: 'POST', body: JSON.stringify({ instrumentIds: instrumentIds.slice(0, 250) }) })),
    getHistoricalCandles: async (input) => array(candleSchema, await request('/historical-candles', { method: 'POST', body: JSON.stringify(input) })),
    getOptionChain: (instrumentId, expiry) => request('/option-chain', { method: 'POST', body: JSON.stringify({ instrumentId, expiry }) }),
  };
}

export function createAuthorizedMarketProvider(env: AuthorizedProviderEnv): AuthorizedMarketProvider {
  const selected = clean(env.MARKET_DATA_PROVIDER).toLowerCase();
  const provider = providerKinds.has(selected as AuthorizedProviderKind) ? selected as AuthorizedProviderKind : 'none';
  if (provider === 'authorized_vendor') {
    let validUrl = false;
    try { validUrl = new URL(clean(env.AUTHORIZED_VENDOR_BASE_URL)).protocol === 'https:'; } catch { validUrl = false; }
    return validUrl && clean(env.AUTHORIZED_VENDOR_API_KEY)
      ? authorizedVendorProvider(env)
      : setupProvider(provider, 'Authorized vendor HTTPS base URL and API key are required.');
  }
  if (provider === 'dhan') {
    return clean(env.DHAN_CLIENT_ID) && clean(env.DHAN_ACCESS_TOKEN)
      ? setupProvider(provider, 'Dhan credentials are present. Use the per-user Dhan adapter for data; shared public redistribution is disabled.')
      : setupProvider(provider, 'Dhan client ID and access token are required for an approved backend data account.');
  }
  if (provider === 'upstox') {
    return clean(env.UPSTOX_CLIENT_ID) && clean(env.UPSTOX_ACCESS_TOKEN)
      ? setupProvider(provider, 'Upstox credentials are present. Use the per-user Upstox adapter for data; shared public redistribution is disabled.')
      : setupProvider(provider, 'Upstox client ID and access token are required.');
  }
  if (provider === 'zerodha') {
    return clean(env.ZERODHA_API_KEY) && clean(env.ZERODHA_ACCESS_TOKEN)
      ? setupProvider(provider, 'Zerodha credentials are present. The backend CRT adapter handles instrument, quote, and historical requests.')
      : setupProvider(provider, 'Zerodha API key and access token are required.');
  }
  return setupProvider('none', 'Select an authorized market provider. No substitute market data is returned.');
}
