export type MarketDataSource = 'broker_live' | 'delayed' | 'fallback' | 'demo' | 'market_closed';
export type BrokerProvider = 'upstox' | 'zerodha';

export interface MarketQuote {
  symbol: string;
  ltp: number;
  change: number;
  changePercent: number;
  volume?: number;
  openInterest?: number;
  bid?: number;
  ask?: number;
  timestamp: string;
  source: MarketDataSource;
  provider: string;
}

export interface BrokerConnectionState {
  provider: BrokerProvider;
  connectedAt: string;
  displayName: string;
}

export interface MarketDataStatus {
  source: MarketDataSource;
  label: string;
  provider: string;
  isRealtime: boolean;
  canUpgradeToBrokerLive: boolean;
  timestamp: string;
  message: string;
}

const BROKER_STORAGE_KEY = 'stockpro_broker_connection';
const isBrowser = () => typeof window !== 'undefined';

export const LIVE_PLAN_PRICE_INR = 299;

export const getStoredBrokerConnection = (): BrokerConnectionState | null => {
  if (!isBrowser()) return null;

  try {
    const raw = window.localStorage.getItem(BROKER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BrokerConnectionState;
    if (!parsed?.provider || !parsed?.connectedAt) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const saveBrokerConnectionPreview = (provider: BrokerProvider) => {
  if (!isBrowser()) return;

  const displayName = provider === 'upstox' ? 'Upstox' : 'Zerodha';
  const payload: BrokerConnectionState = {
    provider,
    displayName,
    connectedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(BROKER_STORAGE_KEY, JSON.stringify(payload));
};

export const clearBrokerConnectionPreview = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(BROKER_STORAGE_KEY);
};

export const getMarketDataStatus = (hasError = false): MarketDataStatus => {
  const broker = getStoredBrokerConnection();

  if (hasError) {
    return {
      source: 'fallback',
      label: 'Fallback Data',
      provider: 'Cached / fallback snapshot',
      isRealtime: false,
      canUpgradeToBrokerLive: true,
      timestamp: new Date().toISOString(),
      message: 'The free market snapshot is not available right now. Showing cached or fallback data where possible.',
    };
  }

  if (broker) {
    return {
      source: 'delayed',
      label: 'Live Plan Setup Pending',
      provider: broker.displayName,
      isRealtime: false,
      canUpgradeToBrokerLive: true,
      timestamp: broker.connectedAt,
      message: `${broker.displayName} has been selected for setup. Free public mode still uses delayed data until payment verification and the backend live service are active.`,
    };
  }

  return {
    source: 'delayed',
    label: 'Delayed Free Data',
    provider: 'Yahoo / server snapshot',
    isRealtime: false,
    canUpgradeToBrokerLive: true,
    timestamp: new Date().toISOString(),
    message: `Free public mode uses delayed or cached snapshots. The ₹${LIVE_PLAN_PRICE_INR} live plan requires payment verification and secure broker setup.`,
  };
};

export const DATA_SOURCE_HELP = {
  broker_live: 'Live mode is enabled only after paid-plan verification and backend setup.',
  delayed: 'Free public mode using delayed or cached snapshots.',
  fallback: 'Backup mode when a live/snapshot source fails.',
  demo: 'Demo or simulated data; not suitable for trading decisions.',
  market_closed: 'Market is closed; values may show last available close.',
} satisfies Record<MarketDataSource, string>;
