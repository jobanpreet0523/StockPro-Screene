import type { MarketDataEnvelope, MarketDataProvider } from './marketDataProvider';
import { dhanRestAdapter } from './providers/dhanRestAdapter';
import { upstoxRestAdapter } from './providers/upstoxRestAdapter';

export type BrokerRestProvider = 'dhan' | 'upstox';

export interface BrokerLiveDataSession {
  userId: string;
  provider: BrokerRestProvider;
  isConnected: boolean;
  tokenAvailable: boolean;
}

function envelope<T>(status: MarketDataEnvelope<T>['status'], source: string, message: string): MarketDataEnvelope<T> {
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

export function brokerSetupRequired<T>(message: string, source = 'broker_rest'): MarketDataEnvelope<T> {
  return envelope('setup_required', source, message);
}

export function brokerProviderUnavailable<T>(source: string, message: string): MarketDataEnvelope<T> {
  return envelope('provider_unavailable', source, message);
}

export function shouldUseBrokerRestData(env: { BROKER_DATA_PROVIDER?: string; MARKET_DATA_PROVIDER?: string } = {}) {
  const brokerSelection = String(env.BROKER_DATA_PROVIDER || '').trim().toLowerCase();
  const marketSelection = String(env.MARKET_DATA_PROVIDER || '').trim().toLowerCase();
  return brokerSelection === 'dhan' || brokerSelection === 'upstox' || marketSelection === 'broker';
}

export function brokerRequiredProvider(message: string): MarketDataProvider {
  const response = <T>() => Promise.resolve(brokerSetupRequired<T>(message));
  return {
    health: response,
    indices: response,
    stocks: response,
    quote: response,
    optionChain: response,
    marketStatus: response,
  };
}

export function createBrokerRestMarketDataProvider(session: BrokerLiveDataSession): MarketDataProvider {
  if (!session.isConnected) return brokerRequiredProvider('Connect broker for live data. No connected state was assumed.');
  if (session.provider === 'dhan') return dhanRestAdapter({ userId: session.userId, tokenAvailable: session.tokenAvailable });
  if (session.provider === 'upstox') return upstoxRestAdapter({ userId: session.userId, tokenAvailable: session.tokenAvailable });
  return brokerRequiredProvider('Unsupported broker provider. Configure an approved per-user broker connection.');
}
