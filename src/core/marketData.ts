import type { MarketDataStatus as ProviderMarketDataStatus } from './marketDataProvider';

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

export const LIVE_PLAN_PRICE_INR = 299;
export const FREE_DATA_DELAY_LABEL = 'Provider setup required';

export const getStoredBrokerConnection = (): BrokerConnectionState | null => {
  return null;
};

export const saveBrokerConnectionPreview = (_provider: BrokerProvider) => {};

export const clearBrokerConnectionPreview = () => {};

export const getMarketDataStatus = (hasError = false, providerStatus?: ProviderMarketDataStatus | null): MarketDataStatus => {
  if (providerStatus?.isLive === true && providerStatus.status === 'ok') {
    return {
      source: 'broker_live',
      label: 'Live provider connected',
      provider: providerStatus.source,
      isRealtime: true,
      canUpgradeToBrokerLive: false,
      timestamp: providerStatus.timestamp,
      message: providerStatus.message,
    };
  }

  if (providerStatus?.status === 'setup_required') {
    return {
      source: 'fallback',
      label: 'Live provider setup required',
      provider: providerStatus.source,
      isRealtime: false,
      canUpgradeToBrokerLive: true,
      timestamp: providerStatus.timestamp,
      message: providerStatus.message,
    };
  }

  if (providerStatus?.status === 'provider_unavailable' || providerStatus?.status === 'error') {
    return {
      source: 'fallback',
      label: 'Provider unavailable',
      provider: providerStatus.source,
      isRealtime: false,
      canUpgradeToBrokerLive: true,
      timestamp: providerStatus.timestamp,
      message: providerStatus.message,
    };
  }

  if (providerStatus) {
    return {
      source: 'fallback',
      label: 'Provider setup required',
      provider: providerStatus.source,
      isRealtime: false,
      canUpgradeToBrokerLive: true,
      timestamp: providerStatus.timestamp,
      message: providerStatus.message,
    };
  }

  if (hasError) {
    return {
      source: 'fallback',
      label: 'Provider unavailable',
      provider: 'market-data provider',
      isRealtime: false,
      canUpgradeToBrokerLive: true,
      timestamp: new Date().toISOString(),
      message: 'Market data is unavailable. No substitute values are shown.',
    };
  }

  return {
    source: 'fallback',
    label: FREE_DATA_DELAY_LABEL,
    provider: 'none',
    isRealtime: false,
    canUpgradeToBrokerLive: true,
    timestamp: '',
    message: 'Authorized market provider setup is required. No substitute market values are shown.',
  };
};

export const DATA_SOURCE_HELP = {
  broker_live: 'Realtime data is available only to the authenticated user through their own verified broker connection.',
  delayed: 'Delayed provider data is shown only when a configured authorized provider explicitly supplies it.',
  fallback: 'The selected market-data provider is unavailable or requires setup. No substitute values are shown.',
  demo: 'Disabled. StockPro does not generate demo or simulated market values.',
  market_closed: 'Market is closed; values may show last available close.',
} satisfies Record<MarketDataSource, string>;
