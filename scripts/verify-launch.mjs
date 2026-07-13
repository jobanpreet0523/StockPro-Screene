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
  'src/core/apiClient.ts',
  'src/core/authorizedMarketProvider.ts',
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
  'src/core/brokerProvider.ts',
  'src/core/brokerServer.ts',
  'src/core/crtScannerBrokerServer.ts',
  'src/pages/ConnectBrokerProductPage.tsx',
  'src/components/pro/ProLayout.tsx',
  'src/components/pro/ProDashboard.tsx',
  'src/hooks/useAuthSession.ts',
  'src/hooks/useUserAccess.ts',
  'src/hooks/useProAccess.ts',
  'src/pages/StatusPage.tsx',
  'scripts/seo-audit.mjs',
  'scripts/validate-sitemap.mjs',
  'scripts/verify-landing-links.mjs',
  'scripts/verify-production-sitemap.mjs',
  'docs/TESTING_AND_AUDIT_SETUP.md',
  'docs/BROKER_OAUTH_AND_DHAN_GATEWAY.md',
  'docs/SUPABASE_BROKER_OAUTH_MIGRATION.sql',
  'docs/LANDING_INTERACTION_INVENTORY.md',
  'docs/PRODUCTION_ANALYTICS_TEST_GUIDE.md',
  'docs/RESEND_DELIVERY_TEST.md',
  'docs/MONITORING_ANALYTICS_SETUP.md',
  'docs/PRODUCTION_LAUNCH_CHECKLIST.md',
  'docs/ENV_SETUP.md',
  'docs/CRT_SCANNER_DB_SETUP.md',
  'docs/BROKER_LIVE_DATA_SETUP.md',
  'docs/WATCHLIST_ALERTS_SETUP.md',
  'docs/BILLING_TEST_MODE_SETUP.md',
  'docs/CLOSED_BETA_LAUNCH.md',
  'docs/SUPABASE_FULL_SCHEMA.sql',
  'docs/SUPABASE_RLS_POLICIES.sql',
  'docs/SUPABASE_SETUP_CHECKLIST.md',
  'docs/SUPABASE_AUTH_SETUP.md',
  'docs/MARKET_PROVIDER_SETUP.md',
  'docs/BROKER_USER_TOKEN_TESTING.md',
  'docs/ALERTS_SETUP.md',
  'docs/PUBLIC_LAUNCH_V1_CHECKLIST.md',
  'docs/FRIEND_BROKER_TESTING_GUIDE.md',
  'tests/production-readiness.spec.ts',
  'tests/landing-product-experience.spec.ts',
  'tests/broker-integration.spec.ts',
  '.github/workflows/build.yml',
];

for (const file of requiredFiles) if (!exists(file)) errors.push(`Missing launch file: ${file}`);

const app = read('src/App.tsx');
const redirects = read('public/_redirects');
const routeSeo = read('src/components/RouteSeo.tsx');
const worker = read('src/_worker.js');
const workerIntegrations = worker + read('src/core/crtScannerServer.ts') + read('src/core/crtScannerBrokerServer.ts') + read('src/core/brokerServer.ts') + read('src/core/savedResearchServer.ts');
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
  '/api/database/readiness',
  '/api/search/config',
  '/api/pro/readiness',
  '/api/notifications/request',
  '/api/market/provider-status',
  '/api/crt-scanner/run',
  '/api/watchlists',
  '/api/broker/upstox/start',
  '/api/broker/upstox/callback',
  'startDhan(',
  '/api/broker/dhan/sandbox/test',
  '/api/broker/angelone/status',
  '/api/crt-scanner/providers',
  '/api/alerts',
  '/api/auth/signup-check',
  'verifyTurnstileToken',
  'allowPublicRequest',
  'waitlistLeadSchema',
  'betaFeedbackSchema',
  'paymentEnabled: false',
  'live_disabled: true',
]) {
  if (!workerIntegrations.includes(token)) errors.push(`Worker integration is missing: ${token}`);
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
  'BROKER_ENCRYPTION_SECRET',
  'UPSTOX_REDIRECT_URI',
  'DHAN_API_KEY',
  'DHAN_API_SECRET',
  'DHAN_REDIRECT_URI',
  'DHAN_MODE',
  'DHAN_STATIC_IP_CONFIGURED',
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
for (const event of ['landing_visit', 'pricing_click', 'start_trial_click', 'trial_click', 'connect_broker_click', 'waitlist_submit', 'crt_scan_click', 'pro_tab_click', 'route_load_error', 'signup', 'crt_scan_run', 'watchlist_created', 'alert_created']) {
  if (!posthog.includes(`'${event}'`)) errors.push(`Analytics allowlist is missing: ${event}`);
}
for (const setting of ['https://us.i.posthog.com', 'autocapture: false', 'disable_session_recording: true', "person_profiles: 'never'"]) {
  if (!posthog.includes(setting)) errors.push(`PostHog privacy setting is missing: ${setting}`);
}

const turnstile = read('src/core/turnstile.ts');
if (!turnstile.includes('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit')) errors.push('Official Turnstile script URL is missing.');
if (read('package.json').includes('@cloudflare/turnstile-react')) errors.push('Nonexistent Turnstile React package must not be installed.');

const main = read('src/main.tsx');
if (!main.includes('<QueryClientProvider client={queryClient}>')) errors.push('Query client provider is not mounted.');

const crt = read('src/pages/CrtScannerPage.tsx');
for (const unsafe of ['BUY', 'SELL', 'demo badge', 'sample badge', 'fake live']) if (crt.includes(unsafe)) errors.push(`CRT Scanner contains prohibited label: ${unsafe}`);
for (const required of ['Run CRT Scan', 'Refresh Market Data &amp; Scan Again', 'Filters will apply on next scan.', 'Data Captured At']) if (!crt.includes(required)) errors.push(`CRT Scanner is missing: ${required}`);

const landing = read('src/components/LandingProductPage.tsx') + read('src/components/landing/LandingDeferredSections.tsx');
for (const unsafe of ['421K Cr', '198K Cr', 'BSE LIVE FEED', 'NSE LIVE FEED']) {
  if (landing.includes(unsafe)) errors.push(`Landing still contains unsafe fake-live token: ${unsafe}`);
}
for (const required of ['lazy(', 'data-landing-section="hero"', 'data-landing-section="market-status"', 'data-landing-section="product-grid"', 'data-landing-section="crt-scanner"', 'data-landing-section="pro-workspace"', 'data-landing-section="broker-connect"', 'data-landing-section="screening-analytics"', 'data-landing-section="saved-work"', 'data-landing-section="trust"', 'data-landing-section="pricing"', 'data-landing-section="education"', 'data-landing-section="faq"']) {
  if (!landing.includes(required)) errors.push(`Complete landing is missing: ${required}`);
}
if (!landing.includes('Payment live disabled')) errors.push('Landing must keep payment-live-disabled wording.');
if (!landing.includes('No shared broker tokens')) errors.push('Landing must keep no-shared-broker-token wording.');
if (!landing.includes("/(sample|demo|synthetic|fallback|none)/i")) errors.push('Landing must reject unverified market sources.');

const billing = read('src/core/razorpayReadiness.ts');
if (!billing.includes('live_disabled: true') || !billing.includes('paymentEnabled: false')) errors.push('Payment live mode is not locked off.');

const marketData = read('src/core/marketDataClient.ts');
if (!marketData.includes('validateProviderData')) errors.push('Market provider responses are not schema validated.');
const providerImplementation = read('src/core/marketDataProvider.ts');
for (const unsafe of ['sampleStock(', 'delayedStocks(', 'existingDelayedAdapter', 'Sample snapshot']) {
  if (providerImplementation.includes(unsafe)) errors.push(`Market provider contains prohibited embedded data: ${unsafe}`);
}

if (errors.length) {
  console.error('Launch verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const wrangler = read('wrangler.toml');
const brokerProviderInterface = read('src/core/brokerProvider.ts');
for (const method of ['getProviderStatus', 'getProfile', 'getInstrumentMaster', 'getQuotes', 'getHistoricalCandles', 'getOptionChain', 'testConnection', 'disconnect']) if (!brokerProviderInterface.includes(method)) errors.push(`Broker provider interface is missing: ${method}`);

if (!wrangler.includes('not_found_handling = "single-page-application"') || !wrangler.includes('run_worker_first = true')) errors.push('Cloudflare SPA/API routing hardening is missing.');
const providerInterface = read('src/core/authorizedMarketProvider.ts');
for (const method of ['getProviderStatus', 'getInstrumentMaster', 'refreshInstrumentMaster', 'getQuotes', 'getHistoricalCandles', 'getOptionChain']) if (!providerInterface.includes(method)) errors.push(`Authorized provider interface is missing: ${method}`);

if (errors.length) {
  console.error('Stage 46-60 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Launch verification passed for stages 26-60: direct routing, normalized readiness states, real auth/database/provider foundations, per-user broker isolation, persisted CRT scans, complete saved research CRUD, test-only billing, privacy-safe monitoring, and public launch QA are present.');
