export type LivePlanStatus = 'free_delayed' | 'payment_required' | 'setup_pending' | 'live_ready';

export interface LivePlanApiStatus {
  status: LivePlanStatus;
  priceInr: number;
  dataMode: 'delayed' | 'live';
  message: string;
  provider?: 'upstox' | 'zerodha';
}

export interface LivePlanOrderResponse {
  status: 'setup_required' | 'created';
  priceInr: number;
  orderId?: string;
  message: string;
}

const jsonHeaders = { 'Content-Type': 'application/json' };

export async function getLivePlanStatus(): Promise<LivePlanApiStatus> {
  try {
    const response = await fetch('/api/live-plan/status');
    if (!response.ok) throw new Error('Live plan status API is not ready');
    return await response.json();
  } catch {
    return {
      status: 'free_delayed',
      priceInr: 299,
      dataMode: 'delayed',
      message: 'Free delayed data is active. Payment verification is not connected yet.',
    };
  }
}

export async function createLivePlanOrder(): Promise<LivePlanOrderResponse> {
  try {
    const response = await fetch('/api/live-plan/create-order', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ plan: 'stockpro-live', priceInr: 299 }),
    });
    if (!response.ok) throw new Error('Live plan order API is not ready');
    return await response.json();
  } catch {
    return {
      status: 'setup_required',
      priceInr: 299,
      message: 'Payment order creation is not connected yet. Configure backend payment verification before accepting live users.',
    };
  }
}

export async function verifyLivePlanOrder(payload: Record<string, string>): Promise<LivePlanApiStatus> {
  try {
    const response = await fetch('/api/live-plan/verify-payment', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Live plan verification API is not ready');
    return await response.json();
  } catch {
    return {
      status: 'payment_required',
      priceInr: 299,
      dataMode: 'delayed',
      message: 'Payment verification is not connected yet. Live data remains locked.',
    };
  }
}

export function getProviderStartUrl(provider: 'upstox' | 'zerodha') {
  return `/api/provider/${provider}/start`;
}
