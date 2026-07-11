export interface SupabaseServerEnv {
  SUPABASE_URL?: string;
  SUPABASE_SECRET_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

export interface SupabaseServerConfig {
  url: string;
  key: string;
  configured: boolean;
  headers: Record<string, string>;
}

export function getSupabaseServerConfig(env: SupabaseServerEnv): SupabaseServerConfig {
  const url = String(env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const key = String(env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  let validUrl = false;
  try {
    validUrl = new URL(url).protocol === 'https:';
  } catch {}

  const headers: Record<string, string> = key ? { apikey: key } : {};
  if (key && !key.startsWith('sb_secret_')) headers.Authorization = `Bearer ${key}`;

  return { url, key, configured: validUrl && Boolean(key), headers };
}

export function serverSetupState(env: SupabaseServerEnv) {
  return getSupabaseServerConfig(env).configured ? 'configured' as const : 'setup_required' as const;
}
