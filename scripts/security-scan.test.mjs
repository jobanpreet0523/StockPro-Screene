import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'security-scan.mjs');
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'stockpro-security-scan-'));

function runScan() {
  return spawnSync(process.execPath, [script], { cwd: fixtureRoot, encoding: 'utf8' });
}

try {
  fs.writeFileSync(path.join(fixtureRoot, '.env.example'), [
    'VITE_SUPABASE_PUBLISHABLE_KEY=',
    'VITE_POSTHOG_KEY=',
    'VITE_TURNSTILE_SITE_KEY=',
    'SUPABASE_SERVICE_ROLE_KEY=',
  ].join('\n'));
  fs.writeFileSync(path.join(fixtureRoot, 'safe.ts'), 'const endpoint = import.meta.env.VITE_SUPABASE_URL;\n');
  assert.equal(runScan().status, 0, 'publishable browser identifiers and empty server bindings must pass');

  fs.writeFileSync(path.join(fixtureRoot, '.env.production'), 'VITE_RAZORPAY_WEBHOOK_SECRET=must-never-be-public\n');
  let result = runScan();
  assert.equal(result.status, 1, 'dotenv variants with privileged VITE_ names must fail');
  assert.match(result.stderr, /secret-like browser variable VITE_RAZORPAY_WEBHOOK_SECRET/);

  fs.rmSync(path.join(fixtureRoot, '.env.production'));
  fs.writeFileSync(path.join(fixtureRoot, 'worker.cjs'), 'const private_key = ' + String.fromCharCode(34) + 'fixture-private-key-material' + String.fromCharCode(34) + ';\n');
  result = runScan();
  assert.equal(result.status, 1, 'CommonJS source must be scanned');
  assert.match(result.stderr, /worker\.cjs: private key assignment/);

  fs.rmSync(path.join(fixtureRoot, 'worker.cjs'));
  fs.writeFileSync(path.join(fixtureRoot, 'worker.mjs'), 'const client_secret = ' + String.fromCharCode(34) + 'fixture-client-secret' + String.fromCharCode(34) + ';\n');
  result = runScan();
  assert.equal(result.status, 1, 'ES module source must be scanned');
  assert.match(result.stderr, /worker\.mjs: client secret assignment/);

  fs.rmSync(path.join(fixtureRoot, 'worker.mjs'));
  fs.mkdirSync(path.join(fixtureRoot, 'node_modules'));
  fs.writeFileSync(path.join(fixtureRoot, 'node_modules', 'ignored.mjs'), 'const client_secret = ' + String.fromCharCode(34) + 'dependency-fixture-secret' + String.fromCharCode(34) + ';\n');
  assert.equal(runScan().status, 0, 'dependency trees must remain excluded from repository-owned findings');

  console.log('Security scan tests passed: public allowlist, VITE_ secret rejection, .env variants, ESM/CJS coverage, and ignored dependencies.');
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
