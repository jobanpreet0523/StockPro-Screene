import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const errors = [];
const required = ['index.html', 'public/robots.txt', 'public/sitemap.xml', 'src/App.tsx', 'src/components/RouteSeo.tsx'];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`Missing SEO file: ${file}`);
}

if (errors.length === 0) {
  const index = read('index.html');
  const routeSeo = read('src/components/RouteSeo.tsx');
  const app = read('src/App.tsx');
  const robots = read('public/robots.txt');

  for (const token of ['meta name="description"', 'meta name="robots"', 'link rel="canonical"', 'property="og:title"', 'name="twitter:card"']) {
    if (!index.includes(token)) errors.push(`index.html is missing ${token}`);
  }
  for (const token of ['link[rel="canonical"]', 'meta[name="description"]', 'meta[name="robots"]']) {
    if (!routeSeo.includes(token)) errors.push(`RouteSeo is missing ${token}`);
  }

  const publicRoutes = ['/', '/screener', '/scanner', '/crt-scanner', '/option-chain', '/news', '/blog', '/daily-brief', '/pricing', '/start-trial', '/connect-broker', '/pro', '/contact', '/about', '/data-methodology', '/support-policy', '/refund-policy', '/risk-disclosure', '/privacy', '/terms', '/status'];
  for (const route of publicRoutes) {
    if (route !== '/' && !app.includes(`path="${route}"`)) errors.push(`Missing public route: ${route}`);
    if (!routeSeo.includes(`'${route}'`)) errors.push(`Missing route metadata: ${route}`);
  }

  for (const route of ['/admin/waitlist', '/admin/beta-feedback', '/account', '/login', '/signup', '/beta']) {
    const routeBlock = new RegExp(`['"]${route.replace('/', '\\/')}['"][\\s\\S]{0,500}?robots:\\s*['"]noindex, nofollow['"]`);
    if (!routeBlock.test(routeSeo)) errors.push(`Private/setup route must be noindex: ${route}`);
  }

  const titles = [...routeSeo.matchAll(/title:\s*'([^']+)'/g)].map((match) => match[1]);
  const duplicates = titles.filter((title, index) => titles.indexOf(title) !== index);
  if (duplicates.length) errors.push(`Duplicate route titles: ${[...new Set(duplicates)].join(', ')}`);

  if (!robots.includes('Sitemap: https://stockpro1.qzz.io/sitemap.xml')) {
    errors.push('robots.txt is missing the production sitemap URL');
  }
}

if (errors.length) {
  console.error('SEO audit failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('SEO audit passed: canonical metadata, unique route titles, public indexing, private noindex rules, robots, and sitemap references are valid.');
