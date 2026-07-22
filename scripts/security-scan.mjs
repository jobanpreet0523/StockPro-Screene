import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'build', '.wrangler']);
const ignoredFiles = new Set(['scripts/security-scan.mjs', 'scripts/security-scan.test.mjs', 'package-lock.json']);
const extensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.json', '.html', '.css', '.md', '.yml', '.yaml', '.toml', '.env']);

const findings = [];
const patterns = [
  { name: 'legacy StockPro private token', regex: /StockProSecure[A-Za-z0-9!_-]*/g },
  { name: 'hardcoded bearer token assignment', regex: /AUTH_TOKEN\s*=\s*["'`]Bearer\s+[^"'`]+["'`]/g },
  { name: 'private key block', regex: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g },
  { name: 'client secret assignment', regex: /client[_-]?secret\s*[:=]\s*["'`][^"'`]{8,}["'`]/gi },
  { name: 'private key assignment', regex: /private[_-]?key\s*[:=]\s*["'`][^"'`]{16,}["'`]/gi },
];

// Vite replaces VITE_* values into the browser bundle. This explicit list is
// limited to public endpoints, feature flags, and publishable/site/search keys.
const allowedBrowserVariables = new Set([
  'VITE_ALGOLIA_APP_ID',
  'VITE_ALGOLIA_SEARCH_KEY',
  'VITE_ANALYTICS_ENABLED',
  'VITE_AUTH_ENABLED',
  'VITE_POSTHOG_HOST',
  'VITE_POSTHOG_KEY',
  'VITE_SENTRY_DSN',
  'VITE_SENTRY_ENVIRONMENT',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_AUTH_REDIRECT_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_URL',
  'VITE_TURNSTILE_SITE_KEY',
]);
const viteVariablePattern = /\bVITE_[A-Z][A-Z0-9_]*\b/g;
const secretLikeBrowserName = /(?:^|_)(?:ADMIN|API_KEY|API_SECRET|CLIENT_SECRET|ENCRYPTION|PASSWORD|PRIVATE|REFRESH_TOKEN|SECRET|SERVICE_ROLE|TOKEN|WEBHOOK)(?:_|$)/;

function shouldScan(entryName) {
  if (entryName === '.env' || entryName.startsWith('.env.')) return true;
  return extensions.has(path.extname(entryName).toLowerCase());
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).replaceAll('\\', '/');

    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) walk(full);
      continue;
    }

    if (!entry.isFile()) continue;
    if (ignoredFiles.has(rel)) continue;
    if (!shouldScan(entry.name)) continue;

    const text = fs.readFileSync(full, 'utf8');
    for (const pattern of patterns) {
      const matches = text.match(pattern.regex);
      if (matches?.length) findings.push(`${rel}: ${pattern.name}`);
    }

    viteVariablePattern.lastIndex = 0;
    for (const match of text.matchAll(viteVariablePattern)) {
      const variable = match[0];
      if (!allowedBrowserVariables.has(variable) && secretLikeBrowserName.test(variable)) {
        findings.push(rel + ': secret-like browser variable ' + variable);
      }
    }
  }
}

walk(root);

if (findings.length) {
  console.error('\nSecurity scan failed. Remove hardcoded secrets or privileged VITE_ variables before launch:\n');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log('Security scan passed: no known hardcoded private tokens, secret patterns, or privileged VITE_ variables detected.');
