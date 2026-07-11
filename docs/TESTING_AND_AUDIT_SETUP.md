# Testing and Audit Setup

Required checks:

```bash
npm ci
npm run typecheck
npm run security:scan
npm run build
npm run verify:launch
npm run smoke:routes
npm run seo:audit
npm run seo:sitemap
npm run quality:deps
```

Browser checks are optional because Chromium and Lighthouse may be unavailable in restricted environments:

```bash
npx playwright install chromium
npm run test:e2e
npm run test:a11y
npm run audit:lighthouse
```

A missing browser is an environment limitation, not a passing test. Keep the required command set green and record the exact optional-test error.
