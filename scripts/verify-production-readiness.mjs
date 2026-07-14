const baseUrl = String(process.env.STOCKPRO_PRODUCTION_URL || 'https://stockpro1.qzz.io').replace(/\/+$/, '');
const timeoutMs = 20_000;

const allowedStatuses = {
  '/api/auth/session': ['unauthenticated'],
  '/api/live/health': ['ok', 'configured', 'setup_required', 'provider_required', 'provider_unavailable', 'unavailable'],
  '/api/market/provider-status': ['configured', 'setup_required', 'provider_required', 'unavailable'],
  '/api/broker/status': ['not_connected', 'login_required', 'setup_required'],
  '/api/broker/upstox/status': ['login_required'],
  '/api/broker/dhan/status': ['login_required'],
  '/api/broker/angelone/status': ['setup_pending'],
  '/api/crt-scanner/readiness': ['login_required'],
  '/api/pro/readiness': ['setup_required'],
  '/api/trial/status': ['setup_required', 'ready'],
  '/api/billing/readiness': ['setup_required', 'test_ready'],
  '/api/waitlist/health': ['ok'],
};

const requiredServices = ['auth', 'turnstile', 'supabase', 'brokerProvider', 'brokerVault', 'crtStorage', 'savedResearch'];
const forbiddenResponseKeys = /^(access_?token|refresh_?token|service_?role(_?key)?|authorization|password|cookie|client_?secret|api_?key)$/i;

function fail(message) {
  throw new Error(message);
}

function assertNoSecretFields(value, path = 'response') {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSecretFields(item, `${path}[${index}]`));
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenResponseKeys.test(key)) fail(`${path} exposed forbidden field ${key}.`);
    assertNoSecretFields(nested, `${path}.${key}`);
  }
}

async function requestJson(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: 'error',
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Accept: 'application/json', ...(init.headers || {}) },
    ...init,
  });
  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    fail(`${path} returned non-JSON content with HTTP ${response.status}.`);
  }
  assertNoSecretFields(payload, path);
  return { response, payload };
}

function requireHttp200(path, result) {
  if (result.response.status !== 200) fail(`${path} returned HTTP ${result.response.status}; expected 200.`);
}

function summarize(path, result) {
  const { payload, response } = result;
  const summary = { path, http: response.status, status: payload.status };
  if (typeof payload.configured === 'boolean') summary.configured = payload.configured;
  if (payload.provider) summary.provider = payload.provider;
  if (payload.mode) summary.mode = payload.mode;
  if (payload.reason) summary.reason = payload.reason;
  if (typeof payload.paymentEnabled === 'boolean') summary.paymentEnabled = payload.paymentEnabled;
  if (typeof payload.live_disabled === 'boolean') summary.liveDisabled = payload.live_disabled;
  return summary;
}

const evidence = [];

const operations = await requestJson('/api/operations/readiness');
requireHttp200('/api/operations/readiness', operations);
if (operations.payload.status !== 'ok') fail('/api/operations/readiness did not report ok.');
for (const service of requiredServices) {
  if (operations.payload.services?.[service] !== 'configured') {
    fail(`/api/operations/readiness reports ${service}=${operations.payload.services?.[service] || 'missing'}.`);
  }
}
if (operations.payload.services?.paymentLive !== 'disabled') fail('Production readiness did not confirm paymentLive=disabled.');
evidence.push({
  path: '/api/operations/readiness',
  http: operations.response.status,
  status: operations.payload.status,
  services: Object.fromEntries([...requiredServices, 'paymentLive'].map((key) => [key, operations.payload.services?.[key]])),
});

const database = await requestJson('/api/database/readiness');
requireHttp200('/api/database/readiness', database);
if (database.payload.status !== 'ok' || database.payload.configured !== true) fail('/api/database/readiness did not report configured.');
const tableStates = Object.values(database.payload.tables || {});
if (!tableStates.length || tableStates.some((state) => state !== 'configured')) fail('/api/database/readiness contains a non-configured required table.');
evidence.push({ path: '/api/database/readiness', http: 200, status: 'ok', configuredTables: tableStates.length });

for (const [path, statuses] of Object.entries(allowedStatuses)) {
  const result = await requestJson(path);
  requireHttp200(path, result);
  if (!statuses.includes(result.payload.status)) fail(`${path} returned unexpected status ${result.payload.status}.`);
  if (path === '/api/broker/angelone/status' && result.payload.isConnected !== false) fail('Angel One must remain disconnected while approval is pending.');
  if (path === '/api/billing/readiness' && (result.payload.paymentEnabled !== false || result.payload.live_disabled !== true)) fail('Billing readiness did not keep live payment disabled.');
  if (path === '/api/trial/status' && result.payload.paymentEnabled !== false) fail('Trial status unexpectedly enabled payment.');
  evidence.push(summarize(path, result));
}

const invalidContact = await requestJson('/api/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Production verifier', email: 'verifier@example.com', subject: 'Automated validation', message: 'Turnstile rejection check.', turnstileToken: '' }),
});
if (invalidContact.response.status !== 400 || invalidContact.payload.status !== 'invalid') {
  fail(`/api/contact missing-token check returned HTTP ${invalidContact.response.status} and status ${invalidContact.payload.status}.`);
}
evidence.push({ path: '/api/contact', case: 'missing_turnstile_token', http: 400, status: 'invalid' });

console.log(JSON.stringify({ baseUrl, checkedAt: new Date().toISOString(), evidence }, null, 2));
console.log('Production readiness verification passed without printing environment values or response secrets.');
