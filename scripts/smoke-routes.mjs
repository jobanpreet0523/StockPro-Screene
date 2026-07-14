import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const expectedRoutes = [
  '/',
  '/login',
  '/signup',
  '/account',
  '/contact',
  '/admin/waitlist',
  '/admin/beta-feedback',
  '/status',
  '/beta',
  '/start-trial',
  '/connect-broker',
  '/pricing',
  '/pro',
  '/news',
  '/blog',
  '/screener',
  '/scanner',
  '/signals',
  '/heatmap',
  '/daily-brief',
  '/crt-scanner',
  '/option-chain',
];

const app = read('src/App.tsx');
const redirects = read('public/_redirects');
const distIndex = read('dist/index.html');
const wrangler = read('wrangler.toml');

const missing = [];

for (const route of expectedRoutes) {
  if (!app.includes(`path="${route}"`)) missing.push(`React route missing: ${route}`);
  if (route !== '/' && !redirects.includes(`${route} /index.html 200`)) missing.push(`Direct-route fallback missing: ${route}`);
}

if (!/<div id="root"(?:\s[^>]*)?>/.test(distIndex)) missing.push('Built index is missing the React root');
if (!distIndex.includes("const isStaticLanding = location.pathname === '/' || location.pathname === '/landing'") || !distIndex.includes('if (isStaticLanding)')) missing.push('Static landing shell is not guarded from direct application routes');
if (!distIndex.includes('/assets/')) missing.push('Built index is missing bundled asset references');
if (!wrangler.includes('not_found_handling = "single-page-application"')) missing.push('Cloudflare SPA not-found handling is missing');
if (!wrangler.includes('run_worker_first = true')) missing.push('Cloudflare API worker-first routing is missing');

if (missing.length) {
  console.error('Route smoke verification failed:');
  for (const issue of missing) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`Route smoke verification passed for ${expectedRoutes.length} direct routes.`);
