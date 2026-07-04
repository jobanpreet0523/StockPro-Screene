import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

const requiredFiles = [
  'public/robots.txt',
  'public/sitemap.xml',
  'public/_redirects',
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
  '/blog',
  '/signals',
  '/privacy',
  '/terms',
  '/risk-disclosure',
  '/contact',
];

const errors = [];

for (const file of requiredFiles) {
  if (!exists(file)) errors.push(`Missing required launch file: ${file}`);
}

const app = read('src/App.tsx');
for (const route of requiredRoutes) {
  if (route === '/') continue;
  if (!app.includes(`path="${route}"`)) errors.push(`Missing React route: ${route}`);
}

const redirects = read('public/_redirects');
for (const route of requiredRoutes.filter((route) => route !== '/')) {
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

const layout = read('src/components/Layout.tsx');
for (const label of ['Privacy Policy', 'Terms of Use', 'Risk Disclosure', 'Contact Us']) {
  if (!layout.includes(label)) errors.push(`Footer is missing launch trust link: ${label}`);
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

console.log('Launch verification passed: routes, redirects, sitemap, legal pages, footer links, and risk disclosure are present.');
