export type BrokerStreamStatus = 'setup_required' | 'broker_required' | 'polling_fallback' | 'connected' | 'provider_unavailable' | 'error';

export interface BrokerStreamStatusResponse {
  status: BrokerStreamStatus;
  source: 'broker_stream';
  provider: 'none' | 'dhan' | 'upstox';
  isLive: boolean;
  isStreaming: boolean;
  reconnectBackoffMs: number;
  message: string;
}

export interface BrokerStreamEvent {
  symbol: string;
  price: number;
  timestamp: string;
  source: string;
  isLive: true;
}
