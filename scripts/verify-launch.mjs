import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

const requiredFiles = [
  'public/robots.txt',
  'public/sitemap.xml',
  'public/_redirects',
  'src/_worker.js',
  'src/components/RouteSeo.tsx',
  'src/components/AnalyticsManager.tsx',
  'src/components/DataSourceBadge.tsx',
  'src/core/marketData.ts',
  'src/core/dataReality.ts',
  'src/services/livePlanApi.ts',
  'src/pages/ConnectBrokerPage.tsx',
  'src/pages/AccountPage.tsx',
  'src/pages/LoginPage.tsx',
  'src/pages/SignupPage.tsx',
  'src/pages/BetaLaunchPage.tsx',
  'src/pages/StatusPage.tsx',
  'src/pages/PrivacyPage.tsx',
  'src/pages/TermsPage.tsx',
  'src/pages/RiskDisclosurePage.tsx',
  'src/pages/ContactPage.tsx',
  '.github/workflows/build.yml',
];

const requiredRoutes = [
  '/',
  '/screener',
  '/scanner',
  '/option-chain',
  '/us-markets',
  '/strategy-builder',
  '/greeks-calculator',
  '/risk-calculator',
  '/heatmap',
  '/fii-dii',
  '/deals',
  '/news',
  '/pricing',
  '/start-trial',
  '/blog',
  '/daily-brief',
  '/signals',
  '/connect-broker',
  '/account',
  '/login',
  '/signup',
  '/beta',
  '/status',
  '/privacy',
  '/terms',
  '/risk-disclosure',
  '/contact',
  '/about',
  '/data-methodology',
  '/support-policy',
  '/refund-policy',
];

const requiredDirectRoutes = [...requiredRoutes.filter((route) => route !== '/'), '/admin/waitlist'];

const errors = [];

for (const file of requiredFiles) {
  if (!exists(file)) errors.push(`Missing required launch file: ${file}`);
}

const app = read('src/App.tsx');
for (const route of requiredRoutes) {
  if (route === '/') continue;
  if (!app.includes(`path="${route}"`)) errors.push(`Missing React route: ${route}`);
}

for (const component of ['<RouteSeo />', '<AnalyticsManager />']) {
  if (!app.includes(component)) errors.push(`App is missing ${component}`);
}

const redirects = read('public/_redirects');
for (const route of requiredDirectRoutes) {
  if (!redirects.includes(route)) errors.push(`Missing SPA redirect: ${route}`);
}

const sitemap = read('public/sitemap.xml');
for (const route of requiredRoutes) {
  const expected = route === '/' ? 'https://stockpro1.qzz.io/' : `https://stockpro1.qzz.io${route}`;
  if (!sitemap.includes(expected)) errors.push(`Missing sitemap URL: ${expected}`);
}

const robots = read('public/robots.txt');
if (!robots.includes('Sitemap: https://stockpro1.qzz.io/sitemap.xml')) {
  errors.push('robots.txt is missing the production sitemap reference');
}

const routeSeo = read('src/components/RouteSeo.tsx');
for (const route of requiredRoutes) {
  if (!routeSeo.includes(`'${route}'`)) errors.push(`RouteSeo is missing metadata config: ${route}`);
}
if (!routeSeo.includes('link[rel="canonical"]')) errors.push('RouteSeo is missing canonical link management');
if (!routeSeo.includes('og:title')) errors.push('RouteSeo is missing Open Graph title management');

const analytics = read('src/components/AnalyticsManager.tsx');
if (!analytics.includes('VITE_GA_MEASUREMENT_ID')) {
  errors.push('AnalyticsManager is missing VITE_GA_MEASUREMENT_ID support');
}

const layout = read('src/components/Layout.tsx');
for (const label of ['Privacy Policy', 'Terms of Use', 'Broker live setup', 'Contact Us']) {
  if (!layout.includes(label)) errors.push(`Footer is missing launch trust link: ${label}`);
}
if (!layout.includes('<DataSourceBadge')) errors.push('Layout is missing the data-source badge');

const marketData = read('src/core/marketData.ts');
for (const token of ['broker_live', 'delayed', 'fallback', 'MarketQuote', 'MarketDataStatus']) {
  if (!marketData.includes(token)) errors.push(`Market data model is missing: ${token}`);
}

const livePlanApi = read('src/services/livePlanApi.ts');
for (const token of ['/api/live-plan/status', '/api/live-plan/create-order', '/api/live-plan/verify-payment', '/api/provider/', 'free_delayed', 'live_ready']) {
  if (!livePlanApi.includes(token)) errors.push(`Live plan API client is missing: ${token}`);
}

const worker = read('src/_worker.js');
for (const token of ['/api/live-plan/status', '/api/live-plan/create-order', '/api/live-plan/verify-payment', '/api/provider', '/api/live-feed/status', '/api/waitlist/health', '/api/live/health', '/api/broker/health', '/api/broker/stream/status', '/api/billing/readiness', '/api/beta/feedback', 'handlePlanRoutes(path, request)']) {
  if (!worker.includes(token)) errors.push(`Worker route wiring is missing: ${token}`);
}

const landing = read('src/components/LandingPage.tsx');
if (landing.includes('<script src="/live-data.js"')) errors.push('LandingPage still injects legacy live-data.js DOM patcher');
for (const unsafe of ['421K Cr', '198K Cr', 'BSE LIVE FEED', 'NSE LIVE FEED']) {
  if (landing.includes(unsafe)) errors.push(`LandingPage still has unsafe fake-live/static token: ${unsafe}`);
}
if (!landing.includes('Payment live mode is disabled')) errors.push('LandingPage is missing payment-live-disabled journey wording');
if (!landing.includes('No shared broker token')) errors.push('LandingPage is missing no-shared-broker-token wording');
if (!landing.includes('isRealProviderData(indicesStatus)')) errors.push('LandingPage must not label LIVE unless provider is live');

const landing3d = read('public/landing-3d-elements.js');
for (const unsafe of ['24,270.85', '57,038.50', '+1.35%', '+1.10%', 'AI Market Cockpit Active']) {
  if (landing3d.includes(unsafe)) errors.push(`landing-3d-elements still has fake market/live token: ${unsafe}`);
}

const index = read('index.html');
if (index.includes('/landing-3d-elements.js" defer')) errors.push('landing-3d-elements should not be globally loaded before landing paint');

const billingReadiness = read('src/core/razorpayReadiness.ts');
if (!billingReadiness.includes('live_disabled: true') || !billingReadiness.includes('paymentEnabled: false')) {
  errors.push('Razorpay readiness must keep live payment disabled');
}

const authContext = read('src/contexts/AuthContext.tsx');
if (authContext.includes('setIsPro(true)') || authContext.includes('isPro: true')) {
  errors.push('AuthContext must not fake paid/pro entitlement');
}

const betaPage = read('src/pages/BetaLaunchPage.tsx');
for (const eventName of ['beta_feedback_submit', 'status_check']) {
  if (!betaPage.includes(eventName)) errors.push(`Beta page is missing analytics event: ${eventName}`);
}

const hero = read('src/components/MarketPulseHero.tsx');
for (const unsafe of ['Live Sync', 'live breadth']) {
  if (hero.includes(unsafe)) errors.push(`Hero still has unsafe wording: ${unsafe}`);
}
for (const unsafe of ['Real-time NIFTY', 'Scan NSE stocks with live prices', 'Broker Live Data Mode', 'Buy Live Data Plan']) {
  if (routeSeo.includes(unsafe)) errors.push(`RouteSeo still has unsafe wording: ${unsafe}`);
}

const risk = read('src/pages/RiskDisclosurePage.tsx');
if (!risk.includes('not a SEBI registered investment advisor')) {
  errors.push('Risk disclosure page is missing SEBI/non-advisory wording');
}

if (errors.length) {
  console.error('\nLaunch verification failed:\n');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Launch verification passed: routes, redirects, sitemap, SEO metadata, analytics hook, setup API client, worker route wiring, conservative data wording, data-source foundation, legal pages, footer links, and risk disclosure are present.');
