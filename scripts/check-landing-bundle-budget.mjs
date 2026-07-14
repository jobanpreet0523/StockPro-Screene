import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const assets = path.join(process.cwd(), 'dist', 'assets');
if (!fs.existsSync(assets)) {
  console.error('Build dist before checking landing bundle budgets.');
  process.exit(1);
}

const sizes = fs.readdirSync(assets)
  .filter((file) => file.endsWith('.js'))
  .map((file) => {
    const bytes = fs.readFileSync(path.join(assets, file));
    return { file, raw: bytes.length, gzip: gzipSync(bytes).length };
  });

const main = sizes.find(({ file }) => /^main-.*\.js$/.test(file));
const hero = sizes.find(({ file }) => /^HeroFinancialScene-.*\.js$/.test(file));
const errors = [];
const baselineInitialGzip = Math.round(729.59 * 1024);
const initialIncreaseLimit = 180 * 1024;
const initialAbsoluteLimit = 350 * 1024;
const heroLimit = 300 * 1024;

if (!main) errors.push('Main JavaScript chunk was not found.');
if (!hero) errors.push('Lazy HeroFinancialScene chunk was not found.');
if (main && main.gzip - baselineInitialGzip > initialIncreaseLimit) {
  errors.push(`Initial JavaScript increased by ${((main.gzip - baselineInitialGzip) / 1024).toFixed(2)} KiB gzip; limit is 180 KiB.`);
}
if (main && main.gzip > initialAbsoluteLimit) {
  errors.push(`Initial JavaScript is ${(main.gzip / 1024).toFixed(2)} KiB gzip; absolute limit is 350 KiB.`);
}
if (hero && hero.gzip > heroLimit) {
  errors.push(`Hero scene is ${(hero.gzip / 1024).toFixed(2)} KiB gzip; limit is 300 KiB.`);
}

if (errors.length) {
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(JSON.stringify({
  baselineInitialGzipKiB: 729.59,
  currentInitialGzipKiB: Number((main.gzip / 1024).toFixed(2)),
  initialIncreaseGzipKiB: Number(((main.gzip - baselineInitialGzip) / 1024).toFixed(2)),
  heroLazyRawKiB: Number((hero.raw / 1024).toFixed(2)),
  heroLazyGzipKiB: Number((hero.gzip / 1024).toFixed(2)),
  status: 'pass',
}, null, 2));
