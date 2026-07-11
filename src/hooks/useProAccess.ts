import { useQuery } from '@tanstack/react-query';
import { useUserAccess } from './useUserAccess';

export function useProAccess() {
  const userAccess = useUserAccess();
  const readiness = useQuery({
    queryKey: ['pro-readiness'],
    queryFn: async () => {
      const response = await fetch('/api/pro/readiness');
      const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
      if (!response.ok || !payload) throw new Error('Pro readiness is unavailable.');
      return payload;
    },
    refetchInterval: false,
  });
  return { ...userAccess, readiness: readiness.data, readinessError: readiness.isError };
}
