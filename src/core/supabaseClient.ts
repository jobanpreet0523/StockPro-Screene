import type { SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let loading: Promise<SupabaseClient | null> | null = null;

function browserConfig() {
  const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
  const publishableKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  return { url, publishableKey };
}

export async function getSupabaseClient(): Promise<SupabaseClient | null> {
  const { url, publishableKey } = browserConfig();
  if (!url || !publishableKey) return null;
  if (client) return client;
  if (loading) return loading;

  loading = import('@supabase/supabase-js').then(({ createClient }) => {
    client = createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return client;
  }).catch(() => null);

  return loading;
}

export function getSupabaseClientReadiness() {
  const { url, publishableKey } = browserConfig();
  return url && publishableKey
    ? { status: 'configured' as const, message: 'Supabase browser client is configured with a publishable key.' }
    : { status: 'setup_required' as const, message: 'Supabase browser URL and publishable key are required.' };
}

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const supabase = await getSupabaseClient();
  const token = supabase ? (await supabase.auth.getSession()).data.session?.access_token : '';
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
