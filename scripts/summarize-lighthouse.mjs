import fs from 'node:fs';
import path from 'node:path';

const roots = ['lhci-report', '.lighthouseci'].map((directory) => path.join(process.cwd(), directory));
const files = [];

function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const resolved = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(resolved);
    else if (entry.name.endsWith('.json') && !/manifest/i.test(entry.name)) files.push(resolved);
  }
}

roots.forEach(walk);

const reports = [];
for (const file of files) {
  try {
    const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!payload?.audits?.['largest-contentful-paint'] || !payload?.audits?.['cumulative-layout-shift']) continue;
    reports.push({
      url: payload.requestedUrl || payload.finalDisplayedUrl || payload.finalUrl || 'unknown',
      lcpMs: Number(payload.audits['largest-contentful-paint'].numericValue),
      cls: Number(payload.audits['cumulative-layout-shift'].numericValue),
      performance: Number(payload.categories?.performance?.score ?? 0) * 100,
      accessibility: Number(payload.categories?.accessibility?.score ?? 0) * 100,
      bestPractices: Number(payload.categories?.['best-practices']?.score ?? 0) * 100,
      seo: Number(payload.categories?.seo?.score ?? 0) * 100,
      file: path.relative(process.cwd(), file).replaceAll('\\', '/'),
    });
  } catch {
    // Ignore LHCI metadata files and partial reports; only complete LHR payloads count.
  }
}

if (!reports.length) {
  console.error('No complete Lighthouse result JSON files were found. Run npm run audit:lighthouse first.');
  process.exit(1);
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const grouped = Map.groupBy(reports, (report) => report.url);
const summaries = [];
const errors = [];
for (const [url, runs] of grouped) {
  if (runs.length < 3) errors.push(`${url} has ${runs.length} Lighthouse run(s); at least 3 are required.`);
  const summary = {
    url,
    runs: runs.length,
    medianLcpMs: Number(median(runs.map((run) => run.lcpMs)).toFixed(1)),
    medianCls: Number(median(runs.map((run) => run.cls)).toFixed(4)),
    medianPerformance: Number(median(runs.map((run) => run.performance)).toFixed(1)),
    medianAccessibility: Number(median(runs.map((run) => run.accessibility)).toFixed(1)),
    medianBestPractices: Number(median(runs.map((run) => run.bestPractices)).toFixed(1)),
    medianSeo: Number(median(runs.map((run) => run.seo)).toFixed(1)),
  };
  if (summary.medianLcpMs > 2_500) errors.push(`${url} median LCP is ${summary.medianLcpMs} ms; limit is 2500 ms.`);
  if (summary.medianCls > 0.1) errors.push(`${url} median CLS is ${summary.medianCls}; limit is 0.1.`);
  summaries.push(summary);
}

console.log(JSON.stringify({ generatedAt: new Date().toISOString(), summaries }, null, 2));
if (errors.length) {
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
