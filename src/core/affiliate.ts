import type { BrokerProvider } from './brokerConnection';

export type BrokerAffiliateProvider = BrokerProvider;

export interface AffiliateClickPayload {
  broker: BrokerAffiliateProvider;
  sourcePage: string;
  userId?: string;
  timestamp: string;
}

export interface AffiliateClickResponse {
  status: 'ok' | 'setup_required' | 'error';
  trackingStatus?: 'click_recorded';
  conversion: false;
  destinationUrl?: string;
  message: string;
}

export const brokerAffiliateProviders: BrokerAffiliateProvider[] = ['dhan', 'upstox', 'angel', 'zerodha'];

export const emptyAffiliateLinks: Record<BrokerAffiliateProvider, string> = {
  dhan: '',
  upstox: '',
  angel: '',
  zerodha: '',
};

export function getAffiliateFallbackLink(
  broker: BrokerAffiliateProvider,
  configuredLinks: Partial<Record<BrokerAffiliateProvider, string>> = emptyAffiliateLinks,
) {
  return configuredLinks[broker]?.trim() || null;
}
