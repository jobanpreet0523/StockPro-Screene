import { z } from 'zod';
import { getSupabaseServerConfig, type SupabaseServerEnv } from './supabaseServer';

interface ResearchEnv extends SupabaseServerEnv {
  SUPABASE_WATCHLISTS_TABLE?: string;
  SUPABASE_WATCHLIST_ITEMS_TABLE?: string;
  SUPABASE_ALERTS_TABLE?: string;
  SUPABASE_SAVED_SCREENS_TABLE?: string;
}

interface AuthResult { status: string; user?: { id: string } | null; message?: string }
type Authenticate = () => Promise<AuthResult>;

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const cleanTable = (value: unknown, fallback: string) => typeof value === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value) ? value : fallback;
const idSchema = z.uuid();
const watchlistSchema = z.object({ name: z.string().trim().min(1).max(80) }).strict();
const watchlistItemSchema = z.object({ symbol: z.string().trim().min(1).max(40).regex(/^[A-Z0-9._-]+$/), exchange: z.literal('NSE').default('NSE') }).strict();
const alertSchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: z.enum(['price', 'oi', 'scanner']),
  symbol: z.string().trim().min(1).max(40).optional(),
  condition: z.enum(['above', 'below', 'change', 'match']),
  threshold: z.number().finite().optional(),
  scannerId: z.string().trim().max(120).optional(),
  emailEnabled: z.boolean().default(false),
}).strict();
const savedScreenSchema = z.object({ name: z.string().trim().min(1).max(100), filters: z.record(z.string(), z.unknown()) }).strict();

function config(env: ResearchEnv) {
  return {
    db: getSupabaseServerConfig(env),
    watchlists: cleanTable(env.SUPABASE_WATCHLISTS_TABLE, 'watchlists'),
    items: cleanTable(env.SUPABASE_WATCHLIST_ITEMS_TABLE, 'watchlist_items'),
    alerts: cleanTable(env.SUPABASE_ALERTS_TABLE, 'alerts'),
    screens: cleanTable(env.SUPABASE_SAVED_SCREENS_TABLE, 'saved_screeners'),
  };
}

async function rest(env: ResearchEnv, table: string, init: RequestInit, query = '') {
  const { db } = config(env);
  return fetch(`${db.url}/rest/v1/${table}${query}`, {
    ...init,
    headers: { ...db.headers, 'Content-Type': 'application/json', Prefer: 'return=representation,resolution=merge-duplicates', ...(init.headers || {}) },
  });
}

async function body(request: Request) { return request.json().catch(() => null); }

export async function handleSavedResearchRequest(request: Request, path: string, env: ResearchEnv, authenticate: Authenticate) {
  const cfg = config(env);
  if (!cfg.db.configured) return json({ status: 'setup_required', configured: false, severity: 'info', data: [], message: 'Authenticated Supabase storage is required.' });
  const auth = await authenticate();
  if (auth.status === 'setup_required') return json({ status: 'setup_required', configured: false, severity: 'info', data: [], message: auth.message || 'Authentication requires setup.' });
  if (auth.status !== 'authenticated' || !auth.user?.id) return json({ status: 'unauthenticated', configured: false, severity: 'info', data: [], message: 'Log in to use private saved research.' });
  const userId = auth.user.id;

  if (path === '/api/watchlists') {
    if (request.method === 'GET') {
      const response = await rest(env, cfg.watchlists, { method: 'GET' }, `?user_id=eq.${encodeURIComponent(userId)}&select=id,name,created_at,updated_at&order=created_at.asc`);
      return json({ status: response.ok ? 'ok' : 'error', data: response.ok ? await response.json() : [], message: response.ok ? 'Private watchlists loaded.' : 'Watchlists unavailable.' }, response.ok ? 200 : 502);
    }
    if (request.method === 'POST') {
      const parsed = watchlistSchema.safeParse(await body(request));
      if (!parsed.success) return json({ status: 'error', message: 'A valid watchlist name is required.' }, 400);
      const response = await rest(env, cfg.watchlists, { method: 'POST', body: JSON.stringify({ user_id: userId, name: parsed.data.name }) });
      return json({ status: response.ok ? 'created' : 'error', data: response.ok ? await response.json() : null, message: response.ok ? 'Watchlist created.' : 'Watchlist could not be created.' }, response.ok ? 201 : 502);
    }
  }

  const watchlistMatch = path.match(/^\/api\/watchlists\/([0-9a-f-]+)$/i);
  const itemMatch = path.match(/^\/api\/watchlists\/([0-9a-f-]+)\/items(?:\/([A-Z0-9._-]+))?$/i);
  if (watchlistMatch && !idSchema.safeParse(watchlistMatch[1]).success) return json({ status: 'error', message: 'Invalid watchlist id.' }, 400);
  if (watchlistMatch && request.method === 'PATCH') {
    const parsed = watchlistSchema.safeParse(await body(request));
    if (!parsed.success) return json({ status: 'error', message: 'A valid watchlist name is required.' }, 400);
    const response = await rest(env, cfg.watchlists, { method: 'PATCH', body: JSON.stringify({ name: parsed.data.name, updated_at: new Date().toISOString() }) }, `?id=eq.${watchlistMatch[1]}&user_id=eq.${encodeURIComponent(userId)}`);
    return json({ status: response.ok ? 'ok' : 'error', message: response.ok ? 'Watchlist updated.' : 'Watchlist update failed.' }, response.ok ? 200 : 502);
  }
  if (watchlistMatch && request.method === 'DELETE') {
    const response = await rest(env, cfg.watchlists, { method: 'DELETE' }, `?id=eq.${watchlistMatch[1]}&user_id=eq.${encodeURIComponent(userId)}`);
    return json({ status: response.ok ? 'ok' : 'error', message: response.ok ? 'Watchlist deleted.' : 'Watchlist deletion failed.' }, response.ok ? 200 : 502);
  }
  if (itemMatch && request.method === 'GET') {
    const response = await rest(env, cfg.items, { method: 'GET' }, `?watchlist_id=eq.${itemMatch[1]}&user_id=eq.${encodeURIComponent(userId)}&select=id,symbol,exchange,created_at&order=created_at.asc`);
    return json({ status: response.ok ? 'ok' : 'error', data: response.ok ? await response.json() : [], message: response.ok ? 'Saved watchlist symbols loaded. Prices are not synthesized.' : 'Watchlist symbols unavailable.' }, response.ok ? 200 : 502);
  }
  if (itemMatch && request.method === 'POST') {
    const parsed = watchlistItemSchema.safeParse(await body(request));
    if (!parsed.success) return json({ status: 'error', message: 'A valid NSE equity symbol is required.' }, 400);
    const response = await rest(env, cfg.items, { method: 'POST', body: JSON.stringify({ user_id: userId, watchlist_id: itemMatch[1], ...parsed.data }) }, '?on_conflict=watchlist_id,symbol');
    return json({ status: response.ok ? 'created' : 'error', message: response.ok ? 'Stock saved to watchlist.' : 'Stock could not be saved.' }, response.ok ? 201 : 502);
  }
  if (itemMatch && itemMatch[2] && request.method === 'DELETE') {
    const response = await rest(env, cfg.items, { method: 'DELETE' }, `?watchlist_id=eq.${itemMatch[1]}&user_id=eq.${encodeURIComponent(userId)}&symbol=eq.${encodeURIComponent(itemMatch[2])}`);
    return json({ status: response.ok ? 'ok' : 'error', message: response.ok ? 'Stock removed.' : 'Stock could not be removed.' }, response.ok ? 200 : 502);
  }

  if (path === '/api/alerts') {
    if (request.method === 'GET') {
      const response = await rest(env, cfg.alerts, { method: 'GET' }, `?user_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc`);
      return json({ status: response.ok ? 'ok' : 'error', data: response.ok ? await response.json() : [], message: response.ok ? 'Alerts loaded.' : 'Alerts unavailable.' }, response.ok ? 200 : 502);
    }
    if (request.method === 'POST') {
      const parsed = alertSchema.safeParse(await body(request));
      if (!parsed.success) return json({ status: 'error', message: 'Alert configuration is invalid.' }, 400);
      const response = await rest(env, cfg.alerts, { method: 'POST', body: JSON.stringify({ user_id: userId, ...parsed.data, status: 'active', delivery_status: 'pending_configuration' }) });
      return json({ status: response.ok ? 'created' : 'error', data: response.ok ? await response.json() : null, delivery: 'not_sent', message: response.ok ? 'Alert saved. No delivery is claimed until a verified observation triggers it.' : 'Alert could not be saved.' }, response.ok ? 201 : 502);
    }
  }
  const alertMatch = path.match(/^\/api\/alerts\/([0-9a-f-]+)$/i);
  if (alertMatch && request.method === 'DELETE') {
    const response = await rest(env, cfg.alerts, { method: 'DELETE' }, `?id=eq.${alertMatch[1]}&user_id=eq.${encodeURIComponent(userId)}`);
    return json({ status: response.ok ? 'ok' : 'error', message: response.ok ? 'Alert deleted.' : 'Alert deletion failed.' }, response.ok ? 200 : 502);
  }

  if (path === '/api/saved-screens') {
    if (request.method === 'GET') {
      const response = await rest(env, cfg.screens, { method: 'GET' }, `?user_id=eq.${encodeURIComponent(userId)}&select=id,name,filters,created_at,updated_at&order=created_at.desc`);
      return json({ status: response.ok ? 'ok' : 'error', data: response.ok ? await response.json() : [], message: response.ok ? 'Saved screeners loaded.' : 'Saved screeners unavailable.' }, response.ok ? 200 : 502);
    }
    if (request.method === 'POST') {
      const parsed = savedScreenSchema.safeParse(await body(request));
      if (!parsed.success) return json({ status: 'error', message: 'Saved screener configuration is invalid.' }, 400);
      const response = await rest(env, cfg.screens, { method: 'POST', body: JSON.stringify({ user_id: userId, ...parsed.data }) });
      return json({ status: response.ok ? 'created' : 'error', message: response.ok ? 'Screener saved.' : 'Screener could not be saved.' }, response.ok ? 201 : 502);
    }
  }

  if (path === '/api/saved-work' && request.method === 'GET') {
    const [screens, alerts] = await Promise.all([
      rest(env, cfg.screens, { method: 'GET' }, `?user_id=eq.${encodeURIComponent(userId)}&select=id,name,created_at`),
      rest(env, cfg.alerts, { method: 'GET' }, `?user_id=eq.${encodeURIComponent(userId)}&select=id,name,type,status,created_at`),
    ]);
    return json({ status: screens.ok && alerts.ok ? 'ok' : 'error', data: { screens: screens.ok ? await screens.json() : [], alerts: alerts.ok ? await alerts.json() : [], charts: [], notes: [], exports: [] }, message: screens.ok && alerts.ok ? 'Saved work loaded.' : 'Some saved work is unavailable.' }, screens.ok && alerts.ok ? 200 : 502);
  }

  return json({ status: 'error', message: 'Saved research route not found.' }, 404);
}
