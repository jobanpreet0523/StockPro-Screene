import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const name of required) {
  if (!process.env[name]) throw new Error(`Protected Supabase verification requires ${name}.`);
  if (process.env.GITHUB_ACTIONS === 'true') console.log(`::add-mask::${process.env[name]}`);
}

const url = process.env.SUPABASE_URL.replace(/\/+$/, '');
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authOptions = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };
const admin = createClient(url, serviceKey, { auth: authOptions });
const anonymous = createClient(url, anonKey, { auth: authOptions });
const run = randomBytes(8).toString('hex');
const password = `StockPro-${randomBytes(18).toString('base64url')}!9a`;
const emails = [`stockpro-e2e-user-a-${run}@example.invalid`, `stockpro-e2e-user-b-${run}@example.invalid`];
const users = [];
const canaries = [];

function ok(condition, message) {
  if (!condition) throw new Error(message);
}

function ensure(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.code || 'error'} ${result.error.message}`);
  return result.data;
}

async function expectNoRows(client, table, id, label) {
  const result = await client.from(table).select('id').eq('id', id);
  if (!result.error) ok(Array.isArray(result.data) && result.data.length === 0, `${label}: protected row was readable`);
}

async function insertCanary(table, row) {
  const data = ensure(await admin.from(table).insert(row).select('id').single(), `seed ${table}`);
  canaries.push({ table, id: data.id });
  return data.id;
}

async function cleanup() {
  for (const { table, id } of [...canaries].reverse()) {
    const result = await admin.from(table).delete().eq('id', id);
    if (result.error && result.error.code !== '42P01') throw new Error(`cleanup ${table}: ${result.error.message}`);
  }
  for (const user of users) ensure(await admin.auth.admin.deleteUser(user.id), 'delete temporary auth user');
  for (const { table, id } of canaries) {
    const result = await admin.from(table).select('id').eq('id', id);
    if (!result.error) ok(result.data.length === 0, `cleanup verification failed for ${table}`);
  }
}

try {
  for (const email of emails) {
    const created = ensure(await admin.auth.admin.createUser({ email, password, email_confirm: true }), 'create temporary auth user');
    users.push(created.user);
  }
  ok(users.length === 2 && users[0].id !== users[1].id, 'two distinct temporary users were not created');

  const clients = [];
  for (let index = 0; index < users.length; index += 1) {
    const client = createClient(url, anonKey, { auth: authOptions });
    const login = ensure(await client.auth.signInWithPassword({ email: emails[index], password }), 'temporary user login');
    ok(login.session?.access_token && login.user?.id === users[index].id, 'normal authenticated session was not created');
    const refreshed = ensure(await client.auth.refreshSession(), 'session refresh');
    ok(refreshed.session?.access_token, 'session refresh did not return an access token');
    clients.push(client);
  }

  const invalidAuth = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: 'Bearer invalid-stockpro-test-token' } });
  ok(invalidAuth.status === 401 || invalidAuth.status === 403, 'invalid token was not rejected');
  ensure(await anonymous.auth.resetPasswordForEmail(emails[0], { redirectTo: 'https://stockpro1.qzz.io/account' }), 'password reset request');

  const owned = [];
  for (let index = 0; index < clients.length; index += 1) {
    const client = clients[index];
    const userId = users[index].id;
    ensure(await client.from('user_profiles').insert({ id: userId, display_name: `RLS user ${index + 1}` }), 'create own profile');
    const watchlist = ensure(await client.from('watchlists').insert({ user_id: userId, name: `RLS ${run}-${index}` }).select('id').single(), 'create own watchlist');
    const item = ensure(await client.from('watchlist_items').insert({ user_id: userId, watchlist_id: watchlist.id, symbol: index ? 'TCS' : 'INFY' }).select('id').single(), 'create own watchlist item');
    const alert = ensure(await client.from('alerts').insert({ user_id: userId, name: `Paused RLS ${run}`, type: 'price', symbol: index ? 'TCS' : 'INFY', condition: 'above', threshold: 1, status: 'paused' }).select('id').single(), 'create own paused alert');
    const screener = ensure(await client.from('saved_screeners').insert({ user_id: userId, name: `RLS ${run}`, filters: { test: true } }).select('id').single(), 'create own saved screener');
    const research = ensure(await client.from('saved_research').insert({ user_id: userId, kind: 'note', title: `RLS ${run}`, payload: { test: true } }).select('id').single(), 'create own saved research');
    owned.push({
      user_profiles: userId,
      watchlists: watchlist.id,
      watchlist_items: item.id,
      alerts: alert.id,
      saved_screeners: screener.id,
      saved_research: research.id,
    });
  }

  const ownerTables = Object.keys(owned[0]);
  for (let index = 0; index < clients.length; index += 1) {
    const other = index === 0 ? 1 : 0;
    for (const table of ownerTables) {
      const own = ensure(await clients[index].from(table).select('id').eq('id', owned[index][table]), `read own ${table}`);
      ok(own.length === 1, `owner could not read ${table}`);
      await expectNoRows(clients[index], table, owned[other][table], `cross-user read ${table}`);
      const update = await clients[index].from(table).update(table === 'user_profiles' ? { display_name: 'blocked' } : { updated_at: new Date().toISOString() }).eq('id', owned[other][table]).select('id');
      if (!update.error) ok(update.data.length === 0, `cross-user update reached ${table}`);
      const deletion = await clients[index].from(table).delete().eq('id', owned[other][table]).select('id');
      if (!deletion.error) ok(deletion.data.length === 0, `cross-user delete reached ${table}`);
      await expectNoRows(anonymous, table, owned[index][table], `anonymous read ${table}`);
    }
  }

  const brokerConnection = await insertCanary('broker_connections', { user_id: users[0].id, provider: 'upstox', encrypted_token: `cipher-${run}`, token_iv: `iv-${run}`, status: 'pending_verification' });
  const scanRun = await insertCanary('crt_scan_runs', { user_id: users[0].id, provider: 'upstox', status: 'completed', filters: { test: true } });
  const protectedRows = [
    ['waitlist_leads', { name: 'StockPro RLS test', email: `waitlist-${run}@example.invalid`, interest: 'automated-rls' }],
    ['beta_feedback', { user_id: users[0].id, message: `Automated RLS ${run}` }],
    ['contact_messages', { user_id: users[0].id, name: 'StockPro RLS test', email: `contact-${run}@example.invalid`, message: 'Automated RLS verification' }],
    ['broker_connection_events', { user_id: users[0].id, broker_connection_id: brokerConnection, provider: 'upstox', event_type: 'test', outcome: 'blocked', safe_metadata: { test: true } }],
    ['broker_oauth_states', { user_id: users[0].id, provider: 'upstox', state_hash: `hash-${run}`, expires_at: new Date(Date.now() + 60_000).toISOString() }],
    ['market_instruments', { provider: 'rls-test', instrument_token: run, exchange: 'NSE', segment: 'EQ', symbol: 'RLS', trading_symbol: 'RLS' }],
    ['crt_scan_results', { scan_run_id: scanRun, symbol: 'RLS', timeframe: '1D', direction: 'bullish', mode: 'forming', score: 1 }],
    ['trial_subscriptions', { user_id: users[0].id, provider: 'razorpay', status: 'pending', test_mode: true }],
    ['billing_events', { event_id: `rls-${run}`, event_type: 'test', provider: 'razorpay', payload_json: { test: true } }],
    ['razorpay_webhook_events', { event_id: `rls-${run}`, event_type: 'test', signature_verified: false, payload_json: { test: true } }],
  ];
  for (const [table, row] of protectedRows) await insertCanary(table, row);

  const ownRun = ensure(await clients[0].from('crt_scan_runs').select('id').eq('id', scanRun), 'read own CRT run');
  ok(ownRun.length === 1, 'owner could not read own CRT run');
  await expectNoRows(clients[1], 'crt_scan_runs', scanRun, 'cross-user CRT run read');

  for (const { table, id } of canaries) {
    if (table === 'crt_scan_runs') {
      await expectNoRows(clients[1], table, id, 'cross-user CRT run read');
      await expectNoRows(anonymous, table, id, 'anonymous CRT run read');
      continue;
    }
    if (table === 'crt_scan_results') {
      const own = ensure(await clients[0].from(table).select('id').eq('id', id), 'read own CRT result');
      ok(own.length === 1, 'owner could not read own CRT result');
      await expectNoRows(clients[1], table, id, 'cross-user CRT result read');
      await expectNoRows(anonymous, table, id, 'anonymous CRT result read');
      continue;
    }
    await expectNoRows(clients[0], table, id, `browser read ${table}`);
    await expectNoRows(clients[1], table, id, `second browser read ${table}`);
    await expectNoRows(anonymous, table, id, `anonymous read ${table}`);
  }

  for (const client of clients) ensure(await client.auth.signOut(), 'temporary user logout');
  console.log('Protected Supabase verification passed: auth lifecycle, two-user owner isolation, anonymous denial, server-only table denial, and password-reset redirect request.');
} finally {
  await cleanup();
  console.log('Protected Supabase cleanup passed: all temporary rows and Auth users removed.');
}