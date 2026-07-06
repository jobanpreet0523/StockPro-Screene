export type MarketApiStatus = 'ok' | 'setup_required' | 'provider_unavailable' | 'error';
export type ProviderStatus = 'connected' | 'delayed_sample' | 'setup_required' | 'provider_unavailable' | 'error';

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

export const DELAYED_SAMPLE_MESSAGE = '15-minute delayed/sample until provider setup';
export const SETUP_REQUIRED_MESSAGE = 'Live provider setup required';
export const LIVE_CONNECTED_MESSAGE = 'Live provider connected';

const SAMPLE_TIMESTAMP = '2026-06-30T10:00:00.000Z';

const delayedMeta = (): MarketDataStatus => ({
  status: 'ok',
  source: 'delayed_sample',
  timestamp: SAMPLE_TIMESTAMP,
  delayMinutes: 15,
  isLive: false,
  isStale: true,
  providerStatus: 'delayed_sample',
  message: DELAYED_SAMPLE_MESSAGE,
});

const delayedIndices = (): MarketIndex[] => {
  const meta = delayedMeta();
  return [
    { ...meta, symbol: '^NSEI', name: 'NIFTY 50', price: 24750.9, change: 84.35, changePercent: 0.34, sparkline: [24700, 24730, 24750], isPositive: true },
    { ...meta, symbol: '^NSEBANK', name: 'BANK NIFTY', price: 52560.15, change: -112.45, changePercent: -0.21, sparkline: [52650, 52600, 52560], isPositive: false },
  ];
};

function sampleStock(symbol: string, name: string, price: number, change: number, changePercent: number, sector: string): MarketQuote {
  return {
    ...delayedMeta(),
    symbol,
    name,
    price,
    change,
    changePercent,
    sector,
    exchange: 'NSE',
    isFoEnabled: true,
    volume: 1_000_000,
    marketCap: 100_000_000_000,
    peRatio: 25,
    rsi: 50,
    dividendYield: 0,
    open: price - change,
    high: price * 1.01,
    low: price * 0.99,
    close: price - change,
    buildup: changePercent >= 0 ? 'Long Build-up' : 'Short Build-up',
  };
}

const delayedStocks = (): MarketQuote[] => [
  sampleStock('RELIANCE.NS', 'Reliance Industries', 2932.15, 18.35, 0.63, 'Energy'),
  sampleStock('TCS.NS', 'Tata Consultancy Services', 3864.4, -21.2, -0.55, 'Technology'),
  sampleStock('INFY.NS', 'Infosys', 1512.8, 8.75, 0.58, 'Technology'),
  sampleStock('HDFCBANK.NS', 'HDFC Bank', 1658.25, 6.4, 0.39, 'Banking'),
  sampleStock('ICICIBANK.NS', 'ICICI Bank', 1144.9, 12.1, 1.07, 'Banking'),
];

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

function sampleOptionChain(symbolValue: string): OptionChainResponse {
  const symbol = cleanSymbol(symbolValue) || 'NIFTY';
  const knownStock = delayedStocks().find((stock) => cleanSymbol(stock.symbol) === symbol);
  const spotPrice = symbol === 'BANKNIFTY' ? 52560 : symbol === 'NIFTY' ? 24750 : knownStock?.price ?? 0;
  const step = symbol === 'BANKNIFTY' ? 100 : symbol === 'NIFTY' ? 50 : Math.max(5, Math.round(spotPrice * 0.01 / 5) * 5);
  const atm = Math.round(spotPrice / step) * step;
  const options = Array.from({ length: 11 }, (_, index): MarketOptionRow => {
    const strikePrice = atm + (index - 5) * step;
    return {
      strikePrice,
      callLtp: Math.max(1, spotPrice - strikePrice + step * 2.4),
      callChange: 0,
      callVol: 0,
      callOi: 50_000 + index * 3_000,
      callOiChg: 0,
      callIv: 0,
      callDelta: 0,
      putLtp: Math.max(1, strikePrice - spotPrice + step * 2.4),
      putChange: 0,
      putVol: 0,
      putOi: 52_000 + index * 2_800,
      putOiChg: 0,
      putIv: 0,
      putDelta: 0,
    };
  });
  const totalCallOi = options.reduce((sum, option) => sum + option.callOi, 0);
  const totalPutOi = options.reduce((sum, option) => sum + option.putOi, 0);
  return {
    ...delayedMeta(),
    symbol,
    spotPrice,
    pcr: totalCallOi > 0 ? totalPutOi / totalCallOi : 0,
    totalCallOi,
    totalPutOi,
    maxPain: atm,
    expiryDate: 'Sample snapshot',
    options,
  };
}

function scheduleStatus(): MarketStatusSnapshot {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const minutes = ist.getHours() * 60 + ist.getMinutes();
  const weekday = ist.getDay() >= 1 && ist.getDay() <= 5;
  const market = weekday && minutes >= 555 && minutes < 930 ? 'OPEN' : weekday && minutes >= 540 && minutes < 555 ? 'PRE_MARKET' : 'CLOSED';
  return {
    status: 'ok',
    source: 'market_schedule',
    timestamp: now.toISOString(),
    delayMinutes: 0,
    isLive: false,
    isStale: false,
    providerStatus: 'delayed_sample',
    message: 'Schedule-based market-hours status; not an exchange status feed.',
    market,
    ist: now.toISOString(),
  };
}

export const existingDelayedAdapter: MarketDataProvider = {
  async health() {
    const meta = delayedMeta();
    return { ...meta, data: { ...meta, provider: 'existing-delayed-adapter', configured: true } };
  },
  async indices() {
    return { ...delayedMeta(), data: delayedIndices() };
  },
  async stocks() {
    return { ...delayedMeta(), data: delayedStocks() };
  },
  async quote(symbolValue) {
    const symbol = cleanSymbol(symbolValue);
    const quote = delayedStocks().find((stock) => cleanSymbol(stock.symbol) === symbol);
    return quote
      ? { ...delayedMeta(), data: quote }
      : unavailableEnvelope('delayed_sample', `No delayed/sample quote is available for ${symbol || 'this symbol'}.`);
  },
  async optionChain(symbolValue) {
    const symbol = cleanSymbol(symbolValue) || 'NIFTY';
    const supported = symbol === 'NIFTY' || symbol === 'BANKNIFTY' || delayedStocks().some((stock) => cleanSymbol(stock.symbol) === symbol);
    return supported
      ? { ...delayedMeta(), data: sampleOptionChain(symbol) }
      : unavailableEnvelope('delayed_sample', `No delayed/sample option chain is available for ${symbol}.`);
  },
  async marketStatus() {
    const data = scheduleStatus();
    return { ...data, data };
  },
};

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
        providerStatus: status === 'ok' ? (isLive ? 'connected' : 'delayed_sample') : status === 'setup_required' ? 'setup_required' : status === 'error' ? 'error' : 'provider_unavailable',
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
  const selection = (env.MARKET_DATA_PROVIDER || 'delayed').trim().toLowerCase();
  if (selection === 'delayed') return existingDelayedAdapter;
  if (selection === 'external') return externalProviderAdapter(env);
  return setupRequiredProvider(selection || 'unknown', 'MARKET_DATA_PROVIDER must be either delayed or external.');
}
