# StockPro quality plugin setup

This setup installs browser, accessibility, Lighthouse, bundle-analysis, web-vitals, validation, and Supabase client packages.

## Commands

```bash
npm run test:e2e
npm run test:a11y
npm run audit:lighthouse
npm run analyze:bundle
npm run quality:deps
```

## What each command does

- `test:e2e`: Playwright browser smoke tests.
- `test:a11y`: axe accessibility smoke tests for serious/critical issues.
- `audit:lighthouse`: Lighthouse CI performance, accessibility, best-practices, and SEO checks.
- `analyze:bundle`: creates `dist/bundle-report.html` for bundle inspection.
- `quality:deps`: dependency vulnerability audit.

## Safety rules

- Do not put secrets in Playwright tests.
- Do not test broker tokens or payment secrets in the browser.
- Keep payment live mode disabled until final approval.
- Keep broker data per-user only.
