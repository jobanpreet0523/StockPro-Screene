import fs from 'node:fs';
import { spawn } from 'node:child_process';

const files = ['src/components/LandingProductPage.tsx', 'src/components/landing/LandingDeferredSections.tsx'];
const source = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const routes = new Set(['/']);
for (const match of source.matchAll(/(?:to:\s*|to=)["'`]([^"'`?#]+)[^"'`]*["'`]/g)) {
  if (match[1].startsWith('/')) routes.add(match[1]);
}

const required = ['/screener','/scanner','/crt-scanner','/option-chain','/signals','/heatmap','/news','/daily-brief','/pro','/connect-broker','/pricing','/account','/contact'];
const missing = required.filter((route) => !routes.has(route));
if (missing.length) {
  console.error(`Landing link inventory is missing: ${missing.join(', ')}`);
  process.exit(1);
}
if (!fs.existsSync('dist/index.html')) {
  console.error('Build dist before running landing link verification.');
  process.exit(1);
}

const port = 4174;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

try {
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await sleep(250);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`, { redirect: 'manual' });
      if (response.status === 200) { ready = true; break; }
    } catch { /* Preview is still starting. */ }
  }
  if (!ready) throw new Error('Vite preview did not start.');

  const failures = [];
  for (const route of [...routes].sort()) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`, { redirect: 'manual' });
    if (response.status !== 200) failures.push(`${route}: HTTP ${response.status}`);
    if ((response.headers.get('content-type') || '').includes('text/html') === false) failures.push(`${route}: expected HTML`);
  }
  if (failures.length) throw new Error(failures.join('\n'));
  console.log(`Landing link verification passed for ${routes.size} public routes.`);
} finally {
  server.kill('SIGTERM');
}

