# Public launch v1 checklist

## Infrastructure

- [ ] Cloudflare direct routes preserve the requested SPA path.
- [ ] `/api/*` routes execute in the Worker and static assets bypass it.
- [ ] Supabase schema and RLS policies are applied.
- [ ] Email Auth and production redirects are configured.
- [ ] Worker secrets are present and no secret uses a `VITE_` prefix.
- [ ] Turnstile protects public write endpoints.
- [ ] Resend sender/domain is verified.
- [ ] Sentry and PostHog privacy settings are reviewed.
- [ ] Payment live mode is disabled.

## Market data and broker isolation

- [ ] An authorized public provider is configured or public values remain unavailable.
- [ ] CRT instrument master and scan tables are reachable.
- [ ] Broker vault encryption is configured with a 32+ character secret.
- [ ] Every test user connects their own broker credentials.
- [ ] Invalid/expired broker credentials render `reconnect_required`.
- [ ] No shared personal broker token exists.
- [ ] No order, modify-order, cancel-order, or portfolio-return endpoint exists.

## Product QA

- [ ] Direct-load all routes listed in the Stage 59 suite.
- [ ] Browser console has zero unhandled application errors.
- [ ] Expected setup states return HTTP 200 informational payloads.
- [ ] Landing CTAs reach CRT, Pro, pricing, account, broker, news, and contact flows.
- [ ] Pro tabs switch and show honest empty/setup states.
- [ ] CRT never auto-runs and never generates substitute results.
- [ ] Watchlist and alert CRUD is isolated per authenticated user.
- [ ] Alert delivery says not sent until Resend accepts a real triggered notification.
- [ ] Trial requires explicit consent and remains test-only.
- [ ] Risk disclosure is visible.

StockPro provides educational analytics only. It is not SEBI-registered investment advice. Broker live data is shown only from the user's own connected broker account. StockPro does not place trades.
