import fs from 'node:fs';
import path from 'node:path';

const sitemapPath = path.join(process.cwd(), 'public/sitemap.xml');
const xml = fs.readFileSync(sitemapPath, 'utf8');
const expectedPaths = [
  '/',
  '/screener',
  '/scanner',
  '/crt-scanner',
  '/option-chain',
  '/news',
  '/blog',
  '/daily-brief',
  '/pricing',
  '/start-trial',
  '/connect-broker',
  '/pro',
  '/contact',
  '/about',
  '/data-methodology',
  '/support-policy',
  '/refund-policy',
  '/risk-disclosure',
  '/privacy',
  '/terms',
  '/status',
];
const privatePrefixes = ['/admin', '/api', '/account', '/login', '/signup', '/beta'];
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const expected = expectedPaths.map((route) => `https://stockpro1.qzz.io${route === '/' ? '/' : route}`);
const errors = [];

if (!xml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) errors.push('Sitemap namespace is missing.');
if (urls.length !== new Set(urls).size) errors.push('Sitemap contains duplicate URLs.');

for (const url of expected) {
  if (!urls.includes(url)) errors.push(`Missing public URL: ${url}`);
}

for (const url of urls) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    errors.push(`Invalid URL: ${url}`);
    continue;
  }
  if (parsed.origin !== 'https://stockpro1.qzz.io') errors.push(`Unexpected origin: ${url}`);
  if (privatePrefixes.some((prefix) => parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`))) {
    errors.push(`Private route in sitemap: ${url}`);
  }
  if (!expected.includes(url)) errors.push(`Unexpected sitemap URL: ${url}`);
}

if (errors.length) {
  console.error('Sitemap validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Sitemap validation passed for ${urls.length} public routes; private and API routes are excluded.`);
