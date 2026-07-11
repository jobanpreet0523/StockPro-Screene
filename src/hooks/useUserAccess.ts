import { useQuery } from '@tanstack/react-query';
import { useAuthSession } from './useAuthSession';

export type UserAccessTier = 'visitor' | 'free' | 'trial' | 'pro' | 'setup_required';

async function loadAccess(token?: string) {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch('/api/trial/status', { headers });
  const payload = await response.json().catch(() => null) as { status?: string; subscription?: { status?: string }; message?: string } | null;
  if (!payload) throw new Error('Access status returned malformed data.');
  if (payload.status === 'setup_required') return { tier: 'setup_required' as const, message: payload.message || 'Access storage requires setup.' };
  if (payload.subscription?.status === 'active') return { tier: 'pro' as const, message: payload.message || 'Pro access is active.' };
  if (payload.subscription?.status === 'trialing') return { tier: 'trial' as const, message: payload.message || 'Trial access is active.' };
  return { tier: 'free' as const, message: payload.message || 'Free account access.' };
}

export function useUserAccess() {
  const { user, status } = useAuthSession();
  const query = useQuery({
    queryKey: ['user-access', user?.id || 'visitor'],
    queryFn: () => loadAccess(),
    enabled: status === 'authenticated',
    refetchInterval: false,
  });
  if (status === 'setup_required') return { tier: 'setup_required' as UserAccessTier, message: 'Authentication requires setup.', loading: false };
  if (!user) return { tier: 'visitor' as UserAccessTier, message: 'Log in to use saved account features.', loading: false };
  return { tier: query.data?.tier || 'free' as UserAccessTier, message: query.data?.message || 'Checking account access...', loading: query.isPending };
}
