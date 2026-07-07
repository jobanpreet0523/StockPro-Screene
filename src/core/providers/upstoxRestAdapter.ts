import type { MarketDataEnvelope, MarketDataProvider } from '../marketDataProvider';

export interface UpstoxRestAdapterConfig {
  userId: string;
  tokenAvailable: boolean;
}

function unavailable<T>(message: string): MarketDataEnvelope<T> {
  return {
    status: 'provider_unavailable',
    source: 'upstox_rest',
    timestamp: new Date().toISOString(),
    delayMinutes: 0,
    isLive: false,
    isStale: true,
    providerStatus: 'provider_unavailable',
    message,
    data: null,
  };
}

export function upstoxRestAdapter(config: UpstoxRestAdapterConfig): MarketDataProvider {
  const response = <T>(): Promise<MarketDataEnvelope<T>> => Promise.resolve(
    unavailable<T>(
      config.tokenAvailable
        ? 'Upstox REST live-data adapter scaffold is present, but token exchange and provider approval are not enabled. No fake live data is shown.'
        : 'Upstox REST live data requires an encrypted per-user token. No shared token is used.',
    ),
  );

  return {
    health: response,
    indices: response,
    stocks: response,
    quote: response,
    optionChain: response,
    marketStatus: response,
  };
}
