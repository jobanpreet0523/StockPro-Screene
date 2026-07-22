# Invite-Only Free-Beta Release Checklist

## Code and scope

- [ ] PR #47 required checks green and scope reviewed.
- [x] Homepage redesign is in its own draft PR.
- [x] Existing product-route visual baselines unchanged.
- [x] No fake prices, status, CRT/screener results, AI output, returns, testimonials, counts, or broker connection state.
- [x] No order placement, trade execution, live payment, or shared broker token.

## Platform readiness

- [ ] Auth and required Supabase bindings configured in production and preview.
- [x] Protected two-user RLS test passes; temporary rows and users are deleted.
- [ ] Contact storage and Turnstile behavior verified.
- [ ] Required provider/readiness endpoints are configured; optional endpoints return explicit 200 setup states.
- [x] Upstox/Dhan manual external-auth actions are listed; Angel One approval state is honest.

## Homepage quality

- [x] Essential hero and CTAs render before WebGL.
- [x] Desktop, tablet, mobile portrait, mobile landscape, reduced-motion, save-data, low-memory, and WebGL-failure states verified.
- [x] One renderer/context; hidden/offscreen pause; complete disposal on route change.
- [x] 3D lazy chunk <= 250 KiB gzip; fallback assets <= 150 KiB each.
- [x] LCP <= 2.5 s, CLS <= 0.1, target INP <= 200 ms; three-run median reported.
- [x] Zero critical axe violations, uncaught errors, unhandled rejections, dead CTAs, and WebGL leaks.

## Operations and security

- [x] Plugin readiness matrix completed with evidence.
- [x] n8n service boundary, HMAC/replay/idempotency/rate limits, DLQ/retry/test/disable paths reviewed.
- [x] Sentry/PostHog/support redaction and allowlists verified in code; live ingestion evidence remains an operator action.
- [x] Security scan passes; no secret values in logs, commits, assets, or client variables.
- [x] Rollback plan and incident shutdown procedure reviewed.

## Decision

- [ ] `READY FOR INVITE-ONLY FREE BETA` only when every invite-only requirement has evidence.
- [ ] Public beta remains blocked until genuine per-user broker OAuth, profile, quote, candle, CRT, and support flow tests pass.
- [ ] Paid launch is not declared ready.
