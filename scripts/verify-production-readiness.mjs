const baseUrl = String(process.env.STOCKPRO_PRODUCTION_URL || 'https://stockpro1.qzz.io').replace(/\/+$/, '');
const timeoutMs = 20_000;
const evidence = [];
const failures = [];

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
  failures.push(message);
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
    throw new Error(`returned non-JSON content with HTTP ${response.status}`);
  }
  assertNoSecretFields(payload, path);
  return { response, payload };
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

async function inspect(path, options = {}) {
  try {
    const result = await requestJson(path, options.init);
    const expectedHttp = options.expectedHttp ?? 200;
    if (result.response.status !== expectedHttp) fail(`${path} returned HTTP ${result.response.status}; expected ${expectedHttp}.`);
    options.validate?.(result);
    evidence.push(options.summary ? options.summary(result) : summarize(path, result));
    return result;
  } catch (error) {
    fail(`${path} could not be verified: ${error instanceof Error ? error.message : 'unexpected error'}.`);
    evidence.push({ path, status: 'unexpected_error' });
    return null;
  }
}

await inspect('/api/operations/readiness', {
  validate: ({ payload }) => {
    if (payload.status !== 'ok') fail('/api/operations/readiness did not report ok.');
    for (const service of requiredServices) {
      if (payload.services?.[service] !== 'configured') {
        fail(`/api/operations/readiness reports ${service}=${payload.services?.[service] || 'missing'}.`);
      }
    }
    if (payload.services?.paymentLive !== 'disabled') fail('Production readiness did not confirm paymentLive=disabled.');
  },
  summary: ({ response, payload }) => ({
    path: '/api/operations/readiness',
    http: response.status,
    status: payload.status,
    services: Object.fromEntries([...requiredServices, 'paymentLive'].map((key) => [key, payload.services?.[key]])),
  }),
});

await inspect('/api/database/readiness', {
  validate: ({ payload }) => {
    if (payload.status !== 'ok' || payload.configured !== true) fail('/api/database/readiness did not report configured.');
    const states = Object.values(payload.tables || {});
    if (!states.length || states.some((state) => state !== 'configured')) fail('/api/database/readiness contains a non-configured required table.');
  },
  summary: ({ response, payload }) => ({
    path: '/api/database/readiness',
    http: response.status,
    status: payload.status,
    configured: payload.configured,
    configuredTables: Object.values(payload.tables || {}).filter((state) => state === 'configured').length,
    totalTables: Object.keys(payload.tables || {}).length,
  }),
});

for (const [path, statuses] of Object.entries(allowedStatuses)) {
  await inspect(path, {
    validate: ({ payload }) => {
      if (!statuses.includes(payload.status)) fail(`${path} returned unexpected status ${payload.status}.`);
      if (path === '/api/broker/angelone/status' && payload.isConnected !== false) fail('Angel One must remain disconnected while approval is pending.');
      if (path === '/api/billing/readiness' && (payload.paymentEnabled !== false || payload.live_disabled !== true)) fail('Billing readiness did not keep live payment disabled.');
      if (path === '/api/trial/status' && payload.paymentEnabled !== false) fail('Trial status unexpectedly enabled payment.');
    },
  });
}

await inspect('/api/contact', {
  expectedHttp: 400,
  init: {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Production verifier', email: 'verifier@example.com', subject: 'Automated validation', message: 'Turnstile rejection check.', turnstileToken: '' }),
  },
  validate: ({ payload }) => {
    if (!['invalid', 'invalid_input'].includes(payload.status)) fail(`/api/contact missing-token check returned status ${payload.status}.`);
  },
  summary: ({ response, payload }) => ({ path: '/api/contact', case: 'missing_turnstile_token', http: response.status, status: payload.status }),
});

console.log(JSON.stringify({ baseUrl, checkedAt: new Date().toISOString(), evidence }, null, 2));
if (failures.length) {
  console.error(JSON.stringify({ failureCount: failures.length, failures }, null, 2));
  process.exitCode = 1;
} else {
  console.log('Production readiness verification passed without printing environment values or response secrets.');
}
