import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
  const publishableKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();
  if (!url || !publishableKey) return null;

  if (!client) {
    client = createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

export function getSupabaseClientReadiness() {
  return getSupabaseClient()
    ? { status: 'configured' as const, message: 'Supabase browser client is configured with a publishable key.' }
    : { status: 'setup_required' as const, message: 'Supabase browser URL and publishable key are required.' };
}
