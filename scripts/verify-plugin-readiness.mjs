import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const errors = [];

function requireFile(file) {
  if (!exists(file)) errors.push(`Missing plugin-readiness evidence file: ${file}`);
}

function requireTokens(file, tokens) {
  if (!exists(file)) return errors.push(`Missing plugin-readiness evidence file: ${file}`);
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) errors.push(`${file} is missing required plugin-readiness evidence: ${token}`);
  }
}

const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const rootLock = lock.packages?.[''] || {};
const declared = { ...pkg.dependencies, ...pkg.devDependencies };
const locked = { ...rootLock.dependencies, ...rootLock.devDependencies };

const integrations = [
  { name: '@sentry/react', package: '@sentry/react', evidence: ['src/lib/sentry.ts'] },
  { name: 'posthog-js', package: 'posthog-js', evidence: ['src/lib/posthog.ts'] },
  { name: 'Cloudflare Turnstile direct implementation', package: null, evidence: ['src/core/turnstile.ts', 'src/components/security/TurnstileWidget.tsx'] },
  { name: '@playwright/test', package: '@playwright/test', evidence: ['playwright.config.ts', 'tests/stockpro-smoke.spec.ts'] },
  { name: '@axe-core/playwright', package: '@axe-core/playwright', evidence: ['tests/accessibility.spec.ts'] },
  { name: 'lighthouse', package: 'lighthouse', evidence: ['lighthouserc.cjs'] },
  { name: '@lhci/cli', package: '@lhci/cli', evidence: ['lighthouserc.cjs'] },
  { name: 'lightweight-charts', package: 'lightweight-charts', evidence: ['src/components/charts/LightweightStockChart.tsx'] },
  { name: 'zod', package: 'zod', evidence: ['src/core/schemas.ts'] },
  { name: '@supabase/supabase-js', package: '@supabase/supabase-js', evidence: ['src/core/supabaseClient.ts', 'scripts/verify-supabase-rls.mjs'] },
  { name: 'resend', package: 'resend', evidence: ['src/core/email.ts'] },
  { name: 'algoliasearch', package: 'algoliasearch', evidence: ['src/core/searchConfig.ts'] },
  { name: 'react-instantsearch', package: 'react-instantsearch', evidence: [] },
  { name: '@tanstack/react-query', package: '@tanstack/react-query', evidence: ['src/lib/queryClient.ts', 'src/main.tsx'] },
  { name: '@tanstack/react-table', package: '@tanstack/react-table', evidence: ['src/components/tables/StockProDataTable.tsx'] },
  { name: 'sitemap', package: 'sitemap', evidence: ['scripts/validate-sitemap.mjs', 'public/sitemap.xml'] },
  { name: 'robots-parser', package: 'robots-parser', evidence: ['scripts/seo-audit.mjs', 'public/robots.txt'] },
  { name: 'web-vitals', package: 'web-vitals', evidence: ['src/lib/webVitals.ts'] },
  { name: 'three', package: 'three', evidence: ['src/components/landing3d/HeroFinancialScene.ts'] },
  { name: 'motion', package: 'motion', evidence: [] },
];

for (const integration of integrations) {
  if (integration.package) {
    if (!declared[integration.package]) errors.push(`Dependency is not declared: ${integration.package}`);
    if (!locked[integration.package]) errors.push(`Dependency is not present in the root lockfile: ${integration.package}`);
  }
  for (const file of integration.evidence) requireFile(file);
}

if (pkg.scripts?.['verify:plugin-readiness'] !== 'node scripts/verify-plugin-readiness.mjs') {
  errors.push('package.json must expose the deterministic verify:plugin-readiness command.');
}

requireTokens('src/lib/sentry.ts', [
  "import('@sentry/react')",
  'sendDefaultPii: false',
  'tracesSampleRate: 0',
  'delete event.user',
  'delete event.request.cookies',
  'delete event.request.data',
  'delete event.request.headers',
]);

requireTokens('src/lib/posthog.ts', [
  "import('posthog-js')",
  "'web_vital'",
  'autocapture: false',
  'capture_pageview: false',
  'capture_pageleave: false',
  'disable_session_recording: true',
  "persistence: 'memory'",
  "person_profiles: 'never'",
  "posthog?.capture('web_vital'",
]);

requireTokens('src/components/analytics/AnalyticsProvider.tsx', [
  'void initPostHog().then((configured)',
  'if (!configured) return',
  "import('../../lib/webVitals')",
  'reportWebVitals(captureWebVital)',
]);

requireTokens('src/lib/webVitals.ts', [
  "from 'web-vitals'",
  'let reportingStarted = false',
  'if (!reporter || reportingStarted) return',
  'reportingStarted = true',
  'onCLS(send)',
  'onFCP(send)',
  'onINP(send)',
  'onLCP(send)',
  'onTTFB(send)',
]);

requireTokens('src/core/turnstile.ts', [
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
  'https://challenges.cloudflare.com/turnstile/v0/siteverify',
]);
requireTokens('src/_worker.js', ['verifyTurnstileToken', 'env?.TURNSTILE_SECRET_KEY']);
if (declared['@cloudflare/turnstile-react']) errors.push('Do not add a duplicate Turnstile React wrapper.');

requireTokens('src/core/supabaseClient.ts', ["import('@supabase/supabase-js')", 'VITE_SUPABASE_PUBLISHABLE_KEY']);
requireTokens('scripts/verify-supabase-rls.mjs', ['SUPABASE_SERVICE_ROLE_KEY', 'Protected Supabase cleanup passed']);
requireTokens('src/core/email.ts', ['RESEND_API_KEY', 'https://api.resend.com/emails', "status: 'setup_required'"]);
requireTokens('src/core/searchConfig.ts', ["from 'algoliasearch/lite'", 'VITE_ALGOLIA_SEARCH_KEY', "status: 'setup_required'"]);
requireTokens('src/main.tsx', ['<QueryClientProvider client={queryClient}>']);
requireTokens('src/components/tables/StockProDataTable.tsx', ["from '@tanstack/react-table'"]);
requireTokens('src/components/charts/LightweightStockChart.tsx', ["from 'lightweight-charts'"]);
requireTokens('src/core/schemas.ts', ["from 'zod'"]);
requireTokens('src/components/landing3d/HeroFinancialScene.ts', ["from 'three'", 'dispose()']);

const browserAndExample = [
  '.env.example',
  ...fs.readdirSync(path.join(root, 'src'), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(?:js|jsx|ts|tsx)$/.test(entry.name))
    .map((entry) => path.relative(root, path.join(entry.parentPath || entry.path, entry.name)))
    .filter((file) => !file.endsWith('_worker.js') && !/[\\/]core[\\/].*Server\.(?:js|ts)$/.test(file)),
];
const forbiddenClientSecrets = [
  'VITE_SUPABASE_SERVICE_ROLE_KEY',
  'VITE_TURNSTILE_SECRET_KEY',
  'VITE_RESEND_API_KEY',
  'VITE_ALGOLIA_ADMIN_KEY',
  'VITE_SENTRY_AUTH_TOKEN',
  'VITE_POSTHOG_PERSONAL_API_KEY',
];
for (const file of browserAndExample) {
  const content = read(file);
  for (const key of forbiddenClientSecrets) {
    if (content.includes(key)) errors.push(`Server secret must not be exposed through client configuration: ${key} in ${file}`);
  }
}

const matrixFile = 'docs/plugins/PLUGIN_READINESS_MATRIX.md';
requireFile(matrixFile);
if (exists(matrixFile)) {
  const matrix = read(matrixFile);
  const header = '| integration | dependency installed | actually imported | configured | production variable present | server/client boundary correct | health check | test coverage | current status | missing action | launch blocking | owner agent |';
  if (!matrix.includes(header)) errors.push('Plugin readiness matrix is missing the required columns.');
  for (const integration of integrations) {
    if (!matrix.includes(`| ${integration.name} |`)) errors.push(`Plugin readiness matrix is missing: ${integration.name}`);
  }
  for (const fact of [
    'all 18 tables have RLS',
    '9 tables have no-policy notices',
    '0/17 tables',
    'ingested_event=false',
    'live Sentry read was available',
    'production `/api/contact` currently returns 404',
    'AG Grid is intentionally not added',
    'Novu is intentionally not added',
  ]) {
    if (!matrix.includes(fact)) errors.push(`Plugin readiness matrix is missing current evidence/guardrail: ${fact}`);
  }
}

if (errors.length) {
  console.error('Plugin readiness verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Plugin readiness structural verification passed for ${integrations.length} audited integrations.`);
console.log('Static checks confirm declarations, lockfile coverage, source evidence, privacy controls, secret boundaries, and the evidence matrix.');
console.log('Production bindings and provider health remain external runtime facts and are not inferred from package presence or local environment variables.');
