import { useCallback, useEffect, useRef, useState } from 'react';
import type { BrokerStreamEvent, BrokerStreamStatusResponse } from '../core/brokerStreamTypes';

const initialStatus: BrokerStreamStatusResponse = {
  status: 'setup_required',
  source: 'broker_stream',
  provider: 'none',
  isLive: false,
  isStreaming: false,
  reconnectBackoffMs: 0,
  message: 'Stream setup required. REST polling remains the fallback.',
};

export function useBrokerLiveStream() {
  const [status, setStatus] = useState<BrokerStreamStatusResponse>(initialStatus);
  const [lastEvent] = useState<BrokerStreamEvent | null>(null);
  const retryRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const checkStatus = useCallback(async () => {
    clearTimer();
    try {
      const response = await fetch('/api/broker/stream/status', { headers: { Accept: 'application/json' } });
      const payload = await response.json().catch(() => initialStatus) as BrokerStreamStatusResponse;
      setStatus(payload);
      retryRef.current = payload.status === 'connected' ? 0 : Math.min(retryRef.current + 1, 6);
    } catch {
      retryRef.current = Math.min(retryRef.current + 1, 6);
      const backoff = Math.min(30_000, 1_000 * 2 ** retryRef.current);
      setStatus({
        ...initialStatus,
        status: 'provider_unavailable',
        reconnectBackoffMs: backoff,
        message: 'Live stream unavailable, using polling. No fake ticks are generated.',
      });
      timerRef.current = window.setTimeout(checkStatus, backoff);
    }
  }, [clearTimer]);

  useEffect(() => {
    void checkStatus();
    return () => clearTimer();
  }, [checkStatus, clearTimer]);

  return {
    status,
    lastEvent,
    usingPollingFallback: status.status !== 'connected',
    refreshStreamStatus: checkStatus,
  };
}
