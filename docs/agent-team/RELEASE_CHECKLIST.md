# Invite-Only Free-Beta Release Checklist

## Code and scope

- [ ] PR #47 required checks green and scope reviewed.
- [ ] Homepage redesign is in its own draft PR.
- [ ] Existing product-route visual baselines unchanged.
- [ ] No fake prices, status, CRT/screener results, AI output, returns, testimonials, counts, or broker connection state.
- [ ] No order placement, trade execution, live payment, or shared broker token.

## Platform readiness

- [ ] Auth and required Supabase bindings configured in production and preview.
- [ ] Protected two-user RLS test passes; temporary rows and users are deleted.
- [ ] Contact storage and Turnstile behavior verified.
- [ ] Required provider/readiness endpoints are configured; optional endpoints return explicit 200 setup states.
- [ ] Upstox/Dhan manual external-auth actions are listed; Angel One approval state is honest.

## Homepage quality

- [ ] Essential hero and CTAs render before WebGL.
- [ ] Desktop, tablet, mobile portrait, mobile landscape, reduced-motion, save-data, low-memory, and WebGL-failure states verified.
- [ ] One renderer/context; hidden/offscreen pause; complete disposal on route change.
- [ ] 3D lazy chunk <= 250 KiB gzip; fallback assets <= 150 KiB each.
- [ ] LCP <= 2.5 s, CLS <= 0.1, target INP <= 200 ms; three-run median reported.
- [ ] Zero critical axe violations, uncaught errors, unhandled rejections, dead CTAs, and WebGL leaks.

## Operations and security

- [ ] Plugin readiness matrix completed with evidence.
- [ ] n8n service boundary, HMAC/replay/idempotency/rate limits, DLQ/retry/test/disable paths reviewed.
- [ ] Sentry/PostHog/support redaction and allowlists verified.
- [ ] Security scan passes; no secret values in logs, commits, assets, or client variables.
- [ ] Rollback plan and incident shutdown procedure reviewed.

## Decision

- [ ] `READY FOR INVITE-ONLY FREE BETA` only when every invite-only requirement has evidence.
- [ ] Public beta remains blocked until genuine per-user broker OAuth, profile, quote, candle, CRT, and support flow tests pass.
- [ ] Paid launch is not declared ready.
