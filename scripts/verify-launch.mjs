import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const errors = [];

const requiredFiles = [
  'public/robots.txt',
  'public/sitemap.xml',
  'public/_redirects',
  'src/_worker.js',
  'src/components/RouteSeo.tsx',
  'src/components/analytics/AnalyticsProvider.tsx',
  'src/components/security/TurnstileWidget.tsx',
  'src/components/search/StockProSearch.tsx',
  'src/components/tables/StockProDataTable.tsx',
  'src/components/charts/LightweightStockChart.tsx',
  'src/core/schemas.ts',
  'src/core/apiValidation.ts',
  'src/core/supabaseClient.ts',
  'src/core/supabaseServer.ts',
  'src/core/turnstile.ts',
  'src/core/email.ts',
  'src/core/notifications.ts',
  'src/core/searchConfig.ts',
  'src/lib/sentry.ts',
  'src/lib/posthog.ts',
  'src/lib/webVitals.ts',
  'src/lib/queryClient.ts',
  'src/pages/ProPage.tsx',
  'src/pages/CrtScannerPage.tsx',
  'src/pages/AdminBetaFeedbackPage.tsx',
  'src/core/crtScanner.ts',
  'src/core/crtScannerServer.ts',
  'src/core/savedResearchServer.ts',
  'src/components/pro/ProLayout.tsx',
  'src/components/pro/ProDashboard.tsx',
  'src/hooks/useAuthSession.ts',
  'src/hooks/useUserAccess.ts',
  'src/hooks/useProAccess.ts',
  'src/pages/StatusPage.tsx',
  'scripts/seo-audit.mjs',
  'scripts/validate-sitemap.mjs',
  'docs/TESTING_AND_AUDIT_SETUP.md',
  'docs/MONITORING_ANALYTICS_SETUP.md',
  'docs/PRODUCTION_LAUNCH_CHECKLIST.md',
  'docs/ENV_SETUP.md',
  'docs/CRT_SCANNER_DB_SETUP.md',
  'docs/BROKER_LIVE_DATA_SETUP.md',
  'docs/WATCHLIST_ALERTS_SETUP.md',
  'docs/BILLING_TEST_MODE_SETUP.md',
  'docs/CLOSED_BETA_LAUNCH.md',
  '.github/workflows/build.yml',
];

for (const file of requiredFiles) if (!exists(file)) errors.push(`Missing launch file: ${file}`);

const app = read('src/App.tsx');
const redirects = read('public/_redirects');
const routeSeo = read('src/components/RouteSeo.tsx');
const worker = read('src/_worker.js');
const envExample = read('.env.example');
const requiredRoutes = ['/', '/screener', '/scanner', '/crt-scanner', '/option-chain', '/news', '/blog', '/daily-brief', '/pricing', '/start-trial', '/connect-broker', '/pro', '/contact', '/about', '/data-methodology', '/support-policy', '/refund-policy', '/risk-disclosure', '/privacy', '/terms', '/status', '/account', '/login', '/signup', '/beta', '/admin/waitlist', '/admin/beta-feedback'];

for (const route of requiredRoutes) {
  if (route !== '/' && !app.includes(`path="${route}"`)) errors.push(`Missing React route: ${route}`);
  if (route !== '/' && !redirects.includes(`${route} /index.html 200`)) errors.push(`Missing direct-route fallback: ${route}`);
}
for (const component of ['<RouteSeo />', '<AnalyticsProvider>']) {
  if (!app.includes(component)) errors.push(`App is missing ${component}`);
}

for (const token of [
  '/api/operations/readiness',
  '/api/search/config',
  '/api/pro/readiness',
  '/api/notifications/request',
  '/api/market/provider-status',
  '/api/crt-scanner/run',
  '/api/watchlists',
  '/api/alerts',
  '/api/auth/signup-check',
  'verifyTurnstileToken',
  'allowPublicRequest',
  'waitlistLeadSchema',
  'betaFeedbackSchema',
  'paymentEnabled: false',
  'live_disabled: true',
]) {
  if (!worker.includes(token)) errors.push(`Worker integration is missing: ${token}`);
}

for (const key of [
  'VITE_ANALYTICS_ENABLED',
  'VITE_SENTRY_DSN',
  'VITE_POSTHOG_KEY',
  'VITE_TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'RESEND_API_KEY',
  'VITE_ALGOLIA_SEARCH_KEY',
  'ALGOLIA_ADMIN_KEY',
  'ZERODHA_API_KEY',
  'AUTHORIZED_VENDOR_API_KEY',
  'SUPABASE_CRT_SCAN_RUNS_TABLE',
  'SUPABASE_WATCHLISTS_TABLE',
]) {
  if (!envExample.includes(key)) errors.push(`.env.example is missing ${key}`);
}

for (const route of ['/account', '/login', '/signup', '/beta', '/admin/waitlist', '/admin/beta-feedback']) {
  const start = routeSeo.indexOf(`'${route}'`);
  const block = start >= 0 ? routeSeo.slice(start, start + 500) : '';
  if (!block.includes("robots: 'noindex, nofollow'")) errors.push(`Private/setup route is not noindex: ${route}`);
}

const posthog = read('src/lib/posthog.ts');
for (const event of ['landing_visit', 'pricing_click', 'start_trial_click', 'connect_broker_click', 'waitlist_submit', 'crt_scan_click', 'pro_tab_click', 'route_load_error', 'signup', 'crt_scan_run', 'watchlist_created', 'alert_created']) {
  if (!posthog.includes(`'${event}'`)) errors.push(`Analytics allowlist is missing: ${event}`);
}
for (const setting of ['autocapture: false', 'disable_session_recording: true', "person_profiles: 'never'"]) {
  if (!posthog.includes(setting)) errors.push(`PostHog privacy setting is missing: ${setting}`);
}

const turnstile = read('src/core/turnstile.ts');
if (!turnstile.includes('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit')) errors.push('Official Turnstile script URL is missing.');
if (read('package.json').includes('@cloudflare/turnstile-react')) errors.push('Nonexistent Turnstile React package must not be installed.');

const main = read('src/main.tsx');
if (!main.includes('<QueryClientProvider client={queryClient}>')) errors.push('Query client provider is not mounted.');

const crt = read('src/pages/CrtScannerPage.tsx');
for (const unsafe of ['BUY', 'SELL', 'demo badge', 'sample badge', 'fake live']) if (crt.includes(unsafe)) errors.push(`CRT Scanner contains prohibited label: ${unsafe}`);
for (const required of ['Run CRT Scan', 'Refresh Market Data & Scan Again', 'Filters will apply on next scan.', 'Data Captured At']) if (!crt.includes(required)) errors.push(`CRT Scanner is missing: ${required}`);

const landing = read('src/components/LandingPage.tsx');
for (const unsafe of ['421K Cr', '198K Cr', 'BSE LIVE FEED', 'NSE LIVE FEED']) {
  if (landing.includes(unsafe)) errors.push(`Landing still contains unsafe fake-live token: ${unsafe}`);
}
if (!landing.includes('Payment live mode is disabled')) errors.push('Landing must keep payment-live-disabled wording.');
if (!landing.includes('No shared broker token')) errors.push('Landing must keep no-shared-broker-token wording.');

const billing = read('src/core/razorpayReadiness.ts');
if (!billing.includes('live_disabled: true') || !billing.includes('paymentEnabled: false')) errors.push('Payment live mode is not locked off.');

const marketData = read('src/core/marketDataClient.ts');
if (!marketData.includes('validateProviderData')) errors.push('Market provider responses are not schema validated.');

if (errors.length) {
  console.error('Launch verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Launch verification passed for stages 26-45: production foundations, real auth readiness, persisted free CRT scans, light Pro workspace, private saved research, billing-test safeguards, and closed beta readiness are present.');
