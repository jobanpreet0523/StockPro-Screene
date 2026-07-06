import type { MarketDataEnvelope, MarketDataStatus } from './marketDataProvider';

export async function fetchMarketData<T>(path: string, signal?: AbortSignal): Promise<MarketDataEnvelope<T>> {
  const response = await fetch(path, { signal });
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Market-data service returned an invalid response.');
  }

  const envelope = payload as Partial<MarketDataEnvelope<T>>;
  if (!envelope.status || typeof envelope.source !== 'string' || typeof envelope.message !== 'string') {
    throw new Error('Market-data response metadata is incomplete.');
  }
  if (!response.ok && envelope.status === 'error') throw new Error(envelope.message);
  return envelope as MarketDataEnvelope<T>;
}

export function providerLabel(status?: Pick<MarketDataStatus, 'status' | 'isLive' | 'providerStatus'> | null) {
  if (status?.isLive === true && status.status === 'ok') return 'Live provider connected';
  if (status?.status === 'setup_required' || status?.providerStatus === 'setup_required') return 'Live provider setup required';
  if (status?.status === 'provider_unavailable' || status?.providerStatus === 'provider_unavailable') return 'Provider unavailable';
  return '15-minute delayed/sample until provider setup';
}
