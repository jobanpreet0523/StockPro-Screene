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
export const FREE_DATA_DELAY_LABEL = '15-Min Delayed Data';

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
      source: 'delayed',
      label: FREE_DATA_DELAY_LABEL,
      provider: '15-minute delayed market feed',
      isRealtime: false,
      canUpgradeToBrokerLive: true,
      timestamp: new Date().toISOString(),
      message: 'Free mode shows 15-minute delayed market data.',
    };
  }

  if (broker) {
    return {
      source: 'delayed',
      label: 'Live Setup Pending',
      provider: broker.displayName,
      isRealtime: false,
      canUpgradeToBrokerLive: true,
      timestamp: broker.connectedAt,
      message: `${broker.displayName} setup is selected. Until payment verification and broker setup are active, free users still see 15-minute delayed data.`,
    };
  }

  return {
    source: 'delayed',
    label: FREE_DATA_DELAY_LABEL,
    provider: '15-minute delayed market feed',
    isRealtime: false,
    canUpgradeToBrokerLive: true,
    timestamp: new Date().toISOString(),
    message: `Free mode includes 15-minute delayed market data. The ₹${LIVE_PLAN_PRICE_INR} live plan requires payment verification and secure broker setup before realtime data is enabled.`,
  };
};

export const DATA_SOURCE_HELP = {
  broker_live: 'Realtime mode is enabled only after paid-plan verification and secure broker setup.',
  delayed: 'Free mode uses 15-minute delayed market data.',
  fallback: 'Internal backup status only; user-facing labels stay as 15-minute delayed data.',
  demo: 'Demo or simulated data; not suitable for trading decisions.',
  market_closed: 'Market is closed; values may show last available close.',
} satisfies Record<MarketDataSource, string>;
