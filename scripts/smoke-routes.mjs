import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const expectedRoutes = [
  '/contact',
  '/admin/waitlist',
  '/account',
  '/status',
  '/start-trial',
  '/connect-broker',
  '/pricing',
  '/news',
  '/blog',
  '/screener',
  '/option-chain',
];

const app = read('src/App.tsx');
const redirects = read('public/_redirects');
const distIndex = read('dist/index.html');

const missing = [];

for (const route of expectedRoutes) {
  if (!app.includes(`path="${route}"`)) missing.push(`React route missing: ${route}`);
  if (!redirects.includes(`${route} /index.html 200`)) missing.push(`Direct-route fallback missing: ${route}`);
}

if (!distIndex.includes('<div id="root"></div>')) missing.push('Built index is missing the React root');
if (!distIndex.includes('/assets/')) missing.push('Built index is missing bundled asset references');

if (missing.length) {
  console.error('Route smoke verification failed:');
  for (const issue of missing) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`Route smoke verification passed for ${expectedRoutes.length} direct routes.`);
