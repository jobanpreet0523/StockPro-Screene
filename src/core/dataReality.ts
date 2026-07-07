import type { MarketDataStatus } from './marketDataProvider';

export type DataRealityInput = Partial<MarketDataStatus> | null | undefined;

export function isRealProviderData(envelope: DataRealityInput) {
  return envelope?.status === 'ok' && envelope.isLive === true;
}

export function isBrokerRequired(envelope: DataRealityInput) {
  return envelope?.status === 'setup_required'
    || envelope?.providerStatus === 'setup_required'
    || envelope?.providerStatus === 'provider_unavailable';
}

export function getDataLabel(envelope: DataRealityInput) {
  if (isRealProviderData(envelope)) return 'Live provider connected';
  if (envelope?.status === 'setup_required' || envelope?.providerStatus === 'setup_required') return 'Live provider setup required';
  if (envelope?.status === 'provider_unavailable' || envelope?.providerStatus === 'provider_unavailable') return 'Connect broker for live data';
  return '15-minute delayed/sample until provider setup';
}

export function formatTimestamp(timestamp?: string | null) {
  if (!timestamp) return 'Timestamp unavailable';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Timestamp unavailable';
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });
}

export function dataRealityMessage(envelope: DataRealityInput) {
  const source = envelope?.source || 'provider unknown';
  const label = getDataLabel(envelope);
  const timestamp = formatTimestamp(envelope?.timestamp);
  return `${label}. Source: ${source}. Updated: ${timestamp}.`;
}
