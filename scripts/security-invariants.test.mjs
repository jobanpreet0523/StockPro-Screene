import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
function readSourceTree(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return readSourceTree(full);
    return entry.isFile() && /\.(?:js|jsx|ts|tsx)$/.test(entry.name) ? [fs.readFileSync(full, 'utf8')] : [];
  }).join('\n');
}
const sourceTree = readSourceTree(path.join(root, 'src'));
const posthog = read('src/lib/posthog.ts');
const sentry = read('src/lib/sentry.ts');
const worker = read('src/_worker.js');
const readiness = read('src/core/razorpayReadiness.ts');
const schema = read('docs/SUPABASE_FULL_SCHEMA.sql');
const policies = read('docs/SUPABASE_RLS_POLICIES.sql');
const rlsVerifier = read('scripts/verify-supabase-rls.mjs');
const productionVerifier = read('scripts/verify-production-readiness.mjs');
const deployWorkflow = read('.github/workflows/deploy.yml');
const wrangler = read('wrangler.toml');

// Browser telemetry must be explicit, low-cardinality, and privacy-minimized.
assert.match(posthog, /autocapture:\s*false/);
assert.match(posthog, /capture_pageview:\s*false/);
assert.match(posthog, /capture_pageleave:\s*false/);
assert.match(posthog, /disable_session_recording:\s*true/);
assert.match(posthog, /persistence:\s*'memory'/);
assert.match(posthog, /person_profiles:\s*'never'/);
assert.match(posthog, /posthog\?\.capture\(event,\s*\{\s*path:/);
assert.match(sentry, /sendDefaultPii:\s*false/);
assert.match(sentry, /tracesSampleRate:\s*0/);
for (const deletion of ['event.user', 'event.request.cookies', 'event.request.data', 'event.request.headers']) {
  assert.ok(sentry.includes('delete ' + deletion), 'Sentry must remove ' + deletion);
}

// Invite-only free beta must not call a live payment or order API.
assert.match(readiness, /live_disabled:\s*true;/);
assert.match(readiness, /paymentEnabled:\s*false;/);
assert.match(readiness, /!keyId\.startsWith\('rzp_test_'\)/);
assert.doesNotMatch(sourceTree, /https:\/\/api\.razorpay\.com/i);
const inertOrderRoute = worker.match(/if \(path === '\/api\/live-plan\/create-order'[\s\S]{0,240}/)?.[0] || '';
assert.match(inertOrderRoute, /status:\s*'setup_required'/);
assert.match(worker, /orderPlacementEnabled:\s*false/);
assert.doesNotMatch(sourceTree, /api\.(?:upstox|dhan)\.co[^'\s]*(?:place|modify|cancel)[-_\/]?order/i);

// The test-mode webhook authenticates the exact body and has a durable unique id.
assert.match(worker, /const rawBody = await request\.text\(\)/);
assert.match(worker, /hmacSha256Hex\(rawBody/);
assert.match(worker, /safeTokenEquals\(signature, expected\)/);
assert.match(worker, /on_conflict=event_id/);
assert.match(schema, /create table if not exists public\.billing_events[\s\S]*?event_id text not null unique/);

// Every application table in the checked-in schema must have RLS enabled.
const tables = new Set([...schema.matchAll(/create table if not exists public\.([a-z_]+)/g)].map((match) => match[1]));
const rlsTables = new Set([...policies.matchAll(/alter table public\.([a-z_]+) enable row level security/g)].map((match) => match[1]));
assert.equal(tables.size, 18, 'Expected 18 application tables in the launch schema');
assert.deepEqual([...rlsTables].sort(), [...tables].sort(), 'Every application table must enable RLS');

const policyTables = new Set([...policies.matchAll(/create policy [^\n]+ on public\.([a-z_]+)/g)].map((match) => match[1]));
const expectedDenyAllTables = [
  'billing_events',
  'broker_connection_events',
  'broker_connections',
  'broker_oauth_states',
  'contact_messages',
  'market_instruments',
  'razorpay_webhook_events',
  'trial_subscriptions',
  'waitlist_leads',
].sort();
const denyAllTables = [...tables].filter((table) => !policyTables.has(table)).sort();
assert.deepEqual(denyAllTables, expectedDenyAllTables, 'Server-only tables must remain deny-all through RLS');

// The protected verifier must exercise every table and cross-user/anonymous denial.
for (const table of tables) assert.match(rlsVerifier, new RegExp('\\b' + table + '\\b'), 'RLS verifier must cover ' + table);
for (const evidence of ['cross-user read', 'cross-user update', 'cross-user delete', 'anonymous read', 'finally', 'cleanup']) {
  assert.ok(rlsVerifier.includes(evidence), 'RLS verifier must retain ' + evidence + ' evidence');
}
assert.match(policies, /watchlist_items_own_all[\s\S]*exists \(select 1 from public\.watchlists/);
assert.match(rlsVerifier, /cross-user watchlist parent accepted an item/);

assert.match(rlsVerifier, /auth\.admin\.generateLink/);
assert.doesNotMatch(rlsVerifier, /resetPasswordForEmail/);

// Production deploys must synchronize server secrets without exposing them to Vite.
for (const secret of ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'TURNSTILE_SECRET_KEY', 'BROKER_TOKEN_ENCRYPTION_KEY']) {
  assert.match(deployWorkflow, new RegExp(`\\n\\s+${secret}: \\$\\{\\{ secrets\\.${secret} \\}\\}`));
}
assert.match(deployWorkflow, /VITE_SUPABASE_PUBLISHABLE_KEY: \$\{\{ secrets\.SUPABASE_ANON_KEY \}\}/);
assert.doesNotMatch(deployWorkflow, /VITE_[A-Z_]*SERVICE_ROLE/);
assert.match(wrangler, /SUPABASE_AUTH_ENABLED = "true"/);
for (const table of ['waitlist_leads', 'contact_messages', 'broker_connections', 'broker_oauth_states', 'crt_scan_runs', 'saved_research']) {
  assert.ok(wrangler.includes(`= "${table}"`), `Wrangler must declare the ${table} binding`);
}
assert.match(worker, /\['broker_oauth_states', 'SUPABASE_BROKER_OAUTH_STATES_TABLE'\]/);
assert.match(worker, /probeSupabaseTable\(env, 'crt_scan_results', 'SUPABASE_CRT_SCAN_RESULTS_TABLE'\)/);
assert.match(worker, /probeSupabaseTable\(env, 'saved_research', 'SUPABASE_SAVED_RESEARCH_TABLE'\)/);
assert.match(deployWorkflow, /node-version: '22'/);
assert.match(deployWorkflow, /environment: production/);
assert.match(deployWorkflow, /group: stockpro-production-deploy/);

// Optional provider/broker setup states are honest gates, not invite-beta failures.
assert.match(productionVerifier, /const requiredServices = \['auth', 'turnstile', 'supabase', 'crtStorage', 'savedResearch'\]/);
assert.match(productionVerifier, /const optionalServices = \['brokerProvider', 'brokerVault'\]/);
assert.match(productionVerifier, /'\/api\/broker\/upstox\/status': \['login_required', 'setup_required'/);

console.log('Security invariant tests passed: telemetry baseline, free-beta payment/trade lock, webhook authentication/idempotency, and 18-table RLS coverage.');
