export type BrokerProvider = 'dhan' | 'upstox' | 'angel' | 'zerodha';

export type BrokerConnectionStatus =
  | 'not_connected'
  | 'setup_required'
  | 'connected'
  | 'expired'
  | 'provider_unavailable';

export interface BrokerConnectionResponse {
  status: BrokerConnectionStatus | 'error';
  provider: BrokerProvider | 'none';
  isConnected: boolean;
  dataAccess: 'none' | 'market_data_only';
  userId?: string;
  connectedAt?: string;
  expiresAt?: string;
  message: string;
}

export const brokerLabels: Record<BrokerProvider, string> = {
  dhan: 'Dhan',
  upstox: 'Upstox',
  angel: 'Angel One',
  zerodha: 'Zerodha',
};
