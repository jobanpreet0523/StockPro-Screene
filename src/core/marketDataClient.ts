import { z } from 'zod';
import type { MarketDataEnvelope, MarketDataStatus } from './marketDataProvider';
import { validateProviderData } from './apiValidation';
import { marketDataEnvelopeSchema } from './schemas';

export async function fetchMarketData<T>(path: string, signal?: AbortSignal): Promise<MarketDataEnvelope<T>> {
  const response = await fetch(path, { signal });
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Market-data service returned an invalid response.');
  }

  const validated = validateProviderData(marketDataEnvelopeSchema(z.unknown()), payload);
  if (validated.ok === false) throw new Error(validated.message);
  const envelope = validated.data as unknown as MarketDataEnvelope<T>;
  if (!response.ok && envelope.status === 'error') throw new Error(envelope.message);
  return envelope;
}

export function providerLabel(status?: Pick<MarketDataStatus, 'status' | 'isLive' | 'providerStatus'> | null) {
  if (status?.isLive === true && status.status === 'ok') return 'Live provider connected';
  if (status?.status === 'setup_required' || status?.providerStatus === 'setup_required') return 'Live provider setup required';
  if (status?.status === 'provider_unavailable' || status?.providerStatus === 'provider_unavailable') return 'Provider unavailable';
  return '15-minute delayed/sample until provider setup';
}
