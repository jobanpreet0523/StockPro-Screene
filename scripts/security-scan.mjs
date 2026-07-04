import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'build', '.wrangler']);
const ignoredFiles = new Set(['scripts/security-scan.mjs', 'package-lock.json']);
const extensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.md', '.yml', '.yaml', '.toml', '.env']);

const findings = [];
const patterns = [
  { name: 'legacy StockPro private token', regex: /StockProSecure[A-Za-z0-9!_-]*/g },
  { name: 'hardcoded bearer token assignment', regex: /AUTH_TOKEN\s*=\s*["'`]Bearer\s+[^"'`]+["'`]/g },
  { name: 'private key block', regex: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g },
  { name: 'client secret assignment', regex: /client[_-]?secret\s*[:=]\s*["'`][^"'`]{8,}["'`]/gi },
  { name: 'private key assignment', regex: /private[_-]?key\s*[:=]\s*["'`][^"'`]{16,}["'`]/gi },
];

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
    if (!extensions.has(path.extname(entry.name))) continue;

    const text = fs.readFileSync(full, 'utf8');
    for (const pattern of patterns) {
      const matches = text.match(pattern.regex);
      if (matches?.length) findings.push(`${rel}: ${pattern.name}`);
    }
  }
}

walk(root);

if (findings.length) {
  console.error('\nSecurity scan failed. Remove hardcoded secrets before launch:\n');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log('Security scan passed: no known hardcoded private tokens or secret patterns detected.');
