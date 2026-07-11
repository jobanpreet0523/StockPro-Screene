# Production Launch Checklist

- [ ] Required CI commands pass from a clean `npm ci`.
- [ ] Analytics is disabled or both consent and provider configuration are approved.
- [ ] Sentry and PostHog contain no personal trading data or credentials.
- [ ] Turnstile is configured on public forms and verified only on the Worker.
- [ ] Supabase exposed tables have RLS and least-privilege grants.
- [ ] Email sender is verified and public endpoints are rate limited.
- [ ] Algolia browser key is search-only; admin key is server-only.
- [ ] Market data labels reflect the real provider and delay.
- [ ] Broker tokens are per-user, encrypted, and never stored in browser storage.
- [ ] Billing is test-ready only and live payment remains disabled.
- [ ] SEO and sitemap audits pass; private routes are noindex and excluded.
- [ ] Optional browser and Lighthouse outcomes are recorded honestly.
- [ ] `/status` shows only configured, setup_required, or disabled states.
- [ ] No secrets, `node_modules`, `dist`, `.npm-cache`, or local reports are committed.
