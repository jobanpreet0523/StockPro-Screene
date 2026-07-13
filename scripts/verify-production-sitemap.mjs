const sitemapUrl = process.env.SITEMAP_PRODUCTION_URL || 'https://stockpro1.qzz.io/sitemap.xml';
const robotsUrl = new URL('/robots.txt', sitemapUrl).toString();
const privatePrefixes = ['/admin', '/api', '/account', '/login', '/signup', '/beta'];

async function request(url, userAgent) {
  return fetch(url, { headers: { 'User-Agent': userAgent, Accept: 'application/xml,text/xml;q=0.9,*/*;q=0.1' }, redirect: 'manual', signal: AbortSignal.timeout(15_000) });
}

const normal = await request(sitemapUrl, 'StockProSitemapVerifier/1.0');
const googlebot = await request(sitemapUrl, 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
const normalBody = await normal.text();
const googleBody = await googlebot.text();
const robots = await fetch(robotsUrl, { signal: AbortSignal.timeout(15_000) });
const robotsBody = await robots.text();
const errors = [];

for (const [label, response, body] of [['normal', normal, normalBody], ['Googlebot', googlebot, googleBody]]) {
  if (response.status !== 200) errors.push(`${label} sitemap HTTP ${response.status}`);
  if (response.status >= 300 && response.status < 400) errors.push(`${label} sitemap redirected`);
  if (!/(application|text)\/xml/i.test(response.headers.get('content-type') || '')) errors.push(`${label} sitemap content type is not XML`);
  if (/<!doctype html|<html/i.test(body)) errors.push(`${label} received HTML instead of XML`);
  if (!/^\s*<\?xml[\s\S]*<urlset\b/i.test(body)) errors.push(`${label} sitemap XML is malformed`);
}
if (normalBody !== googleBody) errors.push('Googlebot receives a different sitemap body');
if (!robots.ok || !robotsBody.includes(`Sitemap: ${sitemapUrl}`)) errors.push('robots.txt is missing the canonical Sitemap directive');

const urls = [...normalBody.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
for (const value of urls) {
  try {
    const parsed = new URL(value);
    if (parsed.origin !== new URL(sitemapUrl).origin) errors.push(`Non-canonical origin in sitemap: ${value}`);
    if (privatePrefixes.some((prefix) => parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`))) errors.push(`Private route in sitemap: ${value}`);
  } catch { errors.push(`Invalid sitemap URL: ${value}`); }
}

if (errors.length) {
  console.error('Production sitemap verification failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log(`Production sitemap passed for normal and Googlebot requests with ${urls.length} canonical public URLs.`);
console.log('Search Console must be resubmitted and allowed time to reprocess.');
