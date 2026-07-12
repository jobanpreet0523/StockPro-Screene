import { useQuery } from '@tanstack/react-query';
import { readApi } from '../core/apiClient';
import { useUserAccess } from './useUserAccess';

export function useProAccess() {
  const userAccess = useUserAccess();
  const readiness = useQuery({
    queryKey: ['pro-readiness'],
    queryFn: () => readApi('/api/pro/readiness'),
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
  return {
    ...userAccess,
    readiness: readiness.data?.payload,
    readinessState: readiness.data?.state || 'unavailable',
    readinessError: readiness.isError,
  };
}
