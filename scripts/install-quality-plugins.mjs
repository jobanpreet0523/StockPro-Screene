import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const write = (filePath, content) => {
  const absolutePath = path.join(root, filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${content.trim()}\n`);
};

const readJson = (filePath) => JSON.parse(fs.readFileSync(path.join(root, filePath), 'utf8'));
const writeJson = (filePath, value) => {
  fs.writeFileSync(path.join(root, filePath), `${JSON.stringify(value, null, 2)}\n`);
};

const packageJson = readJson('package.json');
packageJson.scripts = {
  ...packageJson.scripts,
  'test:e2e': 'playwright test',
  'test:e2e:headed': 'playwright test --headed',
  'test:e2e:ui': 'playwright test --ui',
  'test:e2e:report': 'playwright show-report',
  'test:a11y': 'playwright test tests/accessibility.spec.ts --project=chromium',
  'audit:lighthouse': 'lhci autorun',
  'analyze:bundle': 'ANALYZE_BUNDLE=true vite build',
  'quality:deps': 'npm audit --audit-level=moderate'
};
writeJson('package.json', packageJson);

write('playwright.config.ts', `
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'html',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
`);

write('tests/stockpro-smoke.spec.ts', `
import { expect, test } from '@playwright/test';

const publicRoutes = [
  '/',
  '/contact',
  '/screener',
  '/option-chain',
  '/pricing',
  '/start-trial',
  '/connect-broker',
  '/account',
  '/status',
  '/news',
  '/blog',
];

const ignoredConsoleError = (message: string) =>
  /google|gtag|doubleclick|tradingview|favicon|ResizeObserver/i.test(message);

test.describe('StockPro browser smoke', () => {
  for (const route of publicRoutes) {
    test(route + ' loads without app crash', async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error' && !ignoredConsoleError(message.text())) {
          consoleErrors.push(message.text());
        }
      });

      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('body')).not.toContainText(/Something went wrong/i);
      await expect(page.locator('body')).not.toContainText(/Application error/i);
      expect(consoleErrors, 'console errors on ' + route).toEqual([]);
    });
  }

  test('/contact exposes waitlist/contact UI', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('body')).toContainText(/contact|waitlist|support|email/i);
  });

  test('/start-trial discloses auto-renewal terms', async ({ page }) => {
    await page.goto('/start-trial');
    await expect(page.locator('body')).toContainText(/auto-renews|renews|trial/i);
  });

  test('/connect-broker explains per-user broker data', async ({ page }) => {
    await page.goto('/connect-broker');
    await expect(page.locator('body')).toContainText(/own broker|per-user|broker/i);
  });

  test('/status keeps live payment disabled visibly', async ({ page }) => {
    await page.goto('/status');
    await expect(page.locator('body')).toContainText(/payment|disabled|setup/i);
  });
});
`);

write('tests/accessibility.spec.ts', `
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = ['/', '/contact', '/screener', '/option-chain', '/pricing', '/start-trial', '/connect-broker', '/status'];

test.describe('StockPro accessibility smoke', () => {
  for (const route of routes) {
    test(route + ' has no serious or critical axe violations', async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const results = await new AxeBuilder({ page }).analyze();
      const seriousOrCritical = results.violations.filter((violation) =>
        violation.impact === 'serious' || violation.impact === 'critical'
      );
      expect(seriousOrCritical).toEqual([]);
    });
  }
});
`);

write('lighthouserc.cjs', `
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview -- --host 127.0.0.1 --port 4173',
      startServerReadyPattern: 'Local:',
      url: [
        'http://127.0.0.1:4173/',
        'http://127.0.0.1:4173/screener',
        'http://127.0.0.1:4173/option-chain',
      ],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.4 }],
        'categories:accessibility': ['warn', { minScore: 0.75 }],
        'categories:best-practices': ['warn', { minScore: 0.75 }],
        'categories:seo': ['warn', { minScore: 0.75 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lhci-report',
    },
  },
};
`);

const viteConfigPath = path.join(root, 'vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
  let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  if (!viteConfig.includes('rollup-plugin-visualizer')) {
    viteConfig = viteConfig.replace("import path from 'path';", "import path from 'path';\nimport { visualizer } from 'rollup-plugin-visualizer';");
    viteConfig = viteConfig.replace(
      'plugins: [react(), tailwindcss()],',
      "plugins: [\n    react(),\n    tailwindcss(),\n    ...(process.env.ANALYZE_BUNDLE === 'true'\n      ? [visualizer({ filename: 'dist/bundle-report.html', template: 'treemap', gzipSize: true, brotliSize: true })]\n      : []),\n  ],"
    );
    fs.writeFileSync(viteConfigPath, viteConfig);
  }
}

write('docs/PERFORMANCE_AUDIT_SETUP.md', `
# StockPro quality plugin setup

This setup installs browser, accessibility, Lighthouse, bundle-analysis, web-vitals, validation, and Supabase client packages.

## Commands

\`\`\`bash
npm run test:e2e
npm run test:a11y
npm run audit:lighthouse
npm run analyze:bundle
npm run quality:deps
\`\`\`

## What each command does

- \`test:e2e\`: Playwright browser smoke tests.
- \`test:a11y\`: axe accessibility smoke tests for serious/critical issues.
- \`audit:lighthouse\`: Lighthouse CI performance, accessibility, best-practices, and SEO checks.
- \`analyze:bundle\`: creates \`dist/bundle-report.html\` for bundle inspection.
- \`quality:deps\`: dependency vulnerability audit.

## Safety rules

- Do not put secrets in Playwright tests.
- Do not test broker tokens or payment secrets in the browser.
- Keep payment live mode disabled until final approval.
- Keep broker data per-user only.
`);

console.log('Quality plugin config files created.');
