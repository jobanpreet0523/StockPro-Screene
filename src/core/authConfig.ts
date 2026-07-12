export const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
export const SUPABASE_ANON_KEY = String(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
).trim();
export const AUTH_ENABLED = String(import.meta.env.VITE_AUTH_ENABLED || '').toLowerCase() === 'true'
  || (SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 20);
export const SUPABASE_AUTH_REDIRECT_URL = String(
  import.meta.env.VITE_SUPABASE_AUTH_REDIRECT_URL || 'https://stockpro1.qzz.io/account',
).trim();

export function getFrontendAuthReadiness() {
  const configured = AUTH_ENABLED && /^https:\/\//.test(SUPABASE_URL) && SUPABASE_ANON_KEY.length > 20;
  return {
    configured,
    status: configured ? 'configured' as const : 'setup_required' as const,
    message: configured
      ? 'Frontend Supabase Auth settings are present. Server session verification remains the source of truth.'
      : 'Supabase Auth frontend settings are not configured. Login and signup stay disabled until setup is complete.',
  };
}

export function getSupabaseHostedAuthUrl(mode: 'login' | 'signup') {
  const readiness = getFrontendAuthReadiness();
  if (!readiness.configured) return null;
  const params = new URLSearchParams({ provider: 'email', redirect_to: SUPABASE_AUTH_REDIRECT_URL });
  if (mode === 'signup') params.set('mode', 'signup');
  return `${SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/authorize?${params.toString()}`;
}
