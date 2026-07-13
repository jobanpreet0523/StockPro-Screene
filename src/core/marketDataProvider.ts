export type MarketApiStatus = 'ok' | 'setup_required' | 'provider_unavailable' | 'error';
export type ProviderStatus = 'connected' | 'delayed' | 'setup_required' | 'provider_unavailable' | 'error';

export interface MarketDataStatus {
  symbol?: string;
  status: MarketApiStatus;
  source: string;
  timestamp: string;
  delayMinutes: number;
  isLive: boolean;
  isStale: boolean;
  providerStatus: ProviderStatus;
  message: string;
}

export interface MarketDataEnvelope<T> extends MarketDataStatus {
  data: T | null;
}

export interface MarketQuote extends MarketDataStatus {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  exchange?: string;
  sector?: string;
  marketCap?: number;
  peRatio?: number;
  rsi?: number;
  dividendYield?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  isFoEnabled?: boolean;
  buildup?: 'Long Build-up' | 'Short Build-up' | 'Long Unwinding' | 'Short Covering';
}

export interface MarketIndex extends MarketDataStatus {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sparkline: number[];
  isPositive: boolean;
}

export interface MarketOptionRow {
  strikePrice: number;
  callLtp: number;
  callChange: number;
  callVol: number;
  callOi: number;
  callOiChg: number;
  callIv: number;
  callDelta: number;
  putLtp: number;
  putChange: number;
  putVol: number;
  putOi: number;
  putOiChg: number;
  putIv: number;
  putDelta: number;
}

export interface OptionChainResponse extends MarketDataStatus {
  symbol: string;
  spotPrice: number;
  pcr: number;
  totalCallOi: number;
  totalPutOi: number;
  maxPain: number;
  expiryDate: string;
  options: MarketOptionRow[];
}

export interface ProviderHealth extends MarketDataStatus {
  provider: string;
  configured: boolean;
}

export interface MarketStatusSnapshot extends MarketDataStatus {
  market: 'OPEN' | 'PRE_MARKET' | 'CLOSED';
  ist: string;
}

export interface MarketDataProvider {
  health(): Promise<MarketDataEnvelope<ProviderHealth>>;
  indices(): Promise<MarketDataEnvelope<MarketIndex[]>>;
  stocks(): Promise<MarketDataEnvelope<MarketQuote[]>>;
  quote(symbol: string): Promise<MarketDataEnvelope<MarketQuote>>;
  optionChain(symbol: string): Promise<MarketDataEnvelope<OptionChainResponse>>;
  marketStatus(): Promise<MarketDataEnvelope<MarketStatusSnapshot>>;
}

export interface MarketDataEnv {
  MARKET_DATA_PROVIDER?: string;
  MARKET_DATA_API_BASE_URL?: string;
  MARKET_DATA_API_KEY?: string;
  MARKET_DATA_PROVIDER_NAME?: string;
}

export const SETUP_REQUIRED_MESSAGE = 'Live provider setup required';
export const LIVE_CONNECTED_MESSAGE = 'Live provider connected';

function cleanSymbol(value: string) {
  return decodeURIComponent(value || '').trim().toUpperCase().replace(/^NSE:/, '').replace(/\.NS$|\.BO$/i, '');
}

function unavailableEnvelope<T>(source: string, message: string, status: MarketApiStatus = 'provider_unavailable'): MarketDataEnvelope<T> {
  return {
    status,
    source,
    timestamp: new Date().toISOString(),
    delayMinutes: 0,
    isLive: false,
    isStale: true,
    providerStatus: status === 'setup_required' ? 'setup_required' : status === 'error' ? 'error' : 'provider_unavailable',
    message,
    data: null,
  };
}

function setupRequiredProvider(provider: string, detail: string): MarketDataProvider {
  const response = <T>() => Promise.resolve(unavailableEnvelope<T>(provider, `${SETUP_REQUIRED_MESSAGE}. ${detail}`, 'setup_required'));
  return {
    health: response,
    indices: response,
    stocks: response,
    quote: response,
    optionChain: response,
    marketStatus: response,
  };
}

const allowedStatuses = new Set<MarketApiStatus>(['ok', 'setup_required', 'provider_unavailable', 'error']);

export function externalProviderAdapter(env: MarketDataEnv): MarketDataProvider {
  const baseUrl = env.MARKET_DATA_API_BASE_URL?.trim().replace(/\/+$/, '');
  const apiKey = env.MARKET_DATA_API_KEY?.trim();
  const providerName = env.MARKET_DATA_PROVIDER_NAME?.trim() || 'external';

  if (!baseUrl || !apiKey) {
    return setupRequiredProvider(providerName, 'Configure MARKET_DATA_API_BASE_URL and MARKET_DATA_API_KEY as Worker secrets/bindings.');
  }

  const request = async <T>(path: string): Promise<MarketDataEnvelope<T>> => {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${apiKey}` },
      });
      if (!response.ok) return unavailableEnvelope(providerName, `External provider returned HTTP ${response.status}.`);

      const payload = await response.json() as Partial<MarketDataEnvelope<T>>;
      const status = allowedStatuses.has(payload.status as MarketApiStatus) ? payload.status as MarketApiStatus : 'provider_unavailable';
      const isLive = payload.isLive === true && status === 'ok';
      const metadata: MarketDataStatus = {
        status,
        source: String(payload.source || providerName),
        timestamp: String(payload.timestamp || new Date().toISOString()),
        delayMinutes: Number.isFinite(Number(payload.delayMinutes)) ? Number(payload.delayMinutes) : 0,
        isLive,
        isStale: payload.isStale === true,
        providerStatus: status === 'ok' ? (isLive ? 'connected' : 'delayed') : status === 'setup_required' ? 'setup_required' : status === 'error' ? 'error' : 'provider_unavailable',
        message: String(payload.message || (isLive ? LIVE_CONNECTED_MESSAGE : status === 'setup_required' ? SETUP_REQUIRED_MESSAGE : 'External provider response received.')),
      };
      const rawData = payload.data;
      const data = Array.isArray(rawData)
        ? rawData.map((item) => typeof item === 'object' && item !== null ? { ...item, ...metadata } : item)
        : typeof rawData === 'object' && rawData !== null
          ? { ...rawData, ...metadata }
          : null;
      return { ...metadata, data: data as T | null };
    } catch {
      return unavailableEnvelope(providerName, 'External market-data provider is unavailable.');
    }
  };

  return {
    health: () => request('/health'),
    indices: () => request('/indices'),
    stocks: () => request('/stocks'),
    quote: (symbol) => request(`/quote/${encodeURIComponent(cleanSymbol(symbol))}`),
    optionChain: (symbol) => request(`/option-chain/${encodeURIComponent(cleanSymbol(symbol) || 'NIFTY')}`),
    marketStatus: () => request('/market-status'),
  };
}

export function createMarketDataProvider(env: MarketDataEnv = {}): MarketDataProvider {
  const selection = (env.MARKET_DATA_PROVIDER || '').trim().toLowerCase();
  if (selection === 'external' || selection === 'authorized_vendor') return externalProviderAdapter(env);
  if (selection === 'broker' || selection === 'dhan' || selection === 'upstox' || selection === 'zerodha') {
    return setupRequiredProvider(selection, 'This provider requires an authenticated backend or per-user broker adapter. No shared public token is used.');
  }
  return setupRequiredProvider(selection || 'none', 'Authorized market provider setup is required. No delayed, demo, sample, or synthetic values are returned.');
}
