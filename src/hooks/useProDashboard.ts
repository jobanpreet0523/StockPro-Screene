import { useQuery } from '@tanstack/react-query';

async function read(endpoint: string) {
  const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
  const payload = await response.json().catch(() => null);
  return { ok: response.ok, payload };
}

export function useProDashboard() {
  return useQuery({
    queryKey: ['pro-dashboard'],
    queryFn: async () => {
      const [market, indices, broker, trial, billing] = await Promise.all([
        read('/api/live/health'), read('/api/live/indices'), read('/api/broker/status'),
        read('/api/trial/status'), read('/api/billing/readiness'),
      ]);
      return { market, indices, broker, trial, billing };
    },
    refetchInterval: false,
  });
}
