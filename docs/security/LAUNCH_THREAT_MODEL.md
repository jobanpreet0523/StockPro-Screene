# StockPro Invite-Only Free-Beta Launch Threat Model

Status: security review complete for the inspected branch on 2026-07-16. This document is a release gate, not a declaration that production is ready.

## Executive outcome

The inspected code fails closed for missing integrations, keeps live payment and trade execution disabled, limits browser analytics, encrypts per-user broker tokens before persistence, and defines RLS on all 18 application tables. The production candidate is still **not launch-ready** because the deployed Worker is missing required bindings/routes and the protected live RLS run is not yet evidenced green.

The Supabase project and the deployed StockPro Worker are separate trust and readiness surfaces:

- Read-only control-plane evidence shows a healthy Supabase project with RLS enabled on all 18 public application tables.
- The production verifier at `2026-07-16T10:09Z` reports Auth, Supabase, broker provider/vault, CRT storage, saved research, and waitlist as `setup_required`; contact POST returns 404.
- Payment live mode is disabled and Turnstile is configured. Those two expected states do not compensate for the missing application bindings.

## Evidence meanings

| Label | Meaning |
| --- | --- |
| Static | Checked-in source or deterministic test proves a code invariant only. |
| Live control plane | Read-only provider/project inspection proves current external configuration. |
| Live data plane | A deployed endpoint or real disposable-user test proves end-to-end behavior. |
| Unverified | No current authoritative runtime evidence; never report as healthy. |

## Protected assets and data classes

| Asset | Classification | Required boundary |
| --- | --- | --- |
| Supabase secret/service-role key | Critical secret | Worker secret only; never browser, log, analytics, n8n payload, or support message. |
| Broker access/refresh tokens and OAuth state | Critical secret | Per-user, encrypted at rest, server-only, short-lived OAuth state, no shared owner token. |
| Razorpay key secret and webhook secret | Critical secret | Worker secret only; test mode only for this beta. |
| Admin access token and automation signing keys | Critical secret | Separate secret stores, scoped consumers, rotation and revocation. |
| Contact, waitlist, feedback, profile data | Personal data | Minimize collection, deny browser reads unless explicitly required, retention and deletion rules. |
| Billing/webhook payloads | Financial/personal operational data | Server-only storage, field minimization, immutable idempotency, restricted retention. |
| Watchlists, alerts, saved research, CRT runs | User research data | Authenticated owner-only RLS plus server checks; never treated as trade instructions. |
| Market/provider results | Financial data | Provider/source/time labels; no invented values or silent fallback. |
| Sentry/PostHog events | Telemetry | Allowlisted, bounded, no form bodies, tokens, emails, query strings, or financial payloads. |

## Trust boundaries and flows

1. Browser to Worker: untrusted input crosses same-origin API routes. Validate methods and bodies, require authentication where applicable, apply Turnstile/rate limits to public mutation routes, and return `no-store` for protected responses.
2. Browser to Supabase Auth/Data API: only publishable/anon credentials may exist in the browser. RLS and least-privilege grants remain mandatory because these credentials identify the project but do not authorize privileged rows.
3. Worker to Supabase: secret/service-role access bypasses RLS. Every Worker query must therefore scope user-owned rows explicitly and use validated table names.
4. Worker to broker/provider: OAuth and data-only provider calls cross an external boundary. Tokens stay encrypted in storage and decrypted only in trusted server code. There is no order endpoint.
5. Razorpay webhook to Worker: the exact raw body is HMAC verified before JSON parsing or storage. A provider event ID is the durable idempotency key.
6. Browser to PostHog/Sentry: optional telemetry crosses to third parties only when explicitly enabled. PostHog and Sentry public configuration values are not privileged secrets, but event contents remain privacy-sensitive.
7. n8n and support automation: future external services are separate production principals. They never inherit the StockPro service role, broker vault key, payment secret, admin token, or deploy credentials.

## Current Supabase evidence

Live read-only evidence on 2026-07-16:

- Project health: healthy.
- Public application tables: 18.
- RLS enabled: 18 of 18.
- Tables with owner/insert policies: `user_profiles`, `beta_feedback`, `crt_scan_runs`, `crt_scan_results`, `watchlists`, `watchlist_items`, `alerts`, `saved_screeners`, and `saved_research`.
- Intentional no-policy deny-all tables: `waitlist_leads`, `contact_messages`, `broker_connections`, `broker_connection_events`, `broker_oauth_states`, `market_instruments`, `trial_subscriptions`, `billing_events`, and `razorpay_webhook_events`.
- `anon` and `authenticated` table grants are revoked on `waitlist_leads` and `broker_oauth_states`.
- The other seven server-only tables still have broad table grants, while their lack of RLS policies currently denies rows.
- Live ownership policies call `auth.uid()` directly. The checked-in policy document uses `(select auth.uid())`, which matches current Supabase performance guidance. This is a performance/advisor issue, not evidence of an authorization bypass.

Supabase documents grants and RLS as separate, complementary controls and recommends granting only the permissions each role needs: [Securing your API](https://supabase.com/docs/guides/api/securing-your-api) and [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

### Defense-in-depth migration candidate

Do not apply this from an agent or directly to production. Review it, run it in staging, run the protected two-user verifier, inspect Security and Performance Advisors, then promote through the normal migration process.

```sql
begin;

revoke all privileges on table public.contact_messages from anon, authenticated;
revoke all privileges on table public.broker_connections from anon, authenticated;
revoke all privileges on table public.broker_connection_events from anon, authenticated;
revoke all privileges on table public.market_instruments from anon, authenticated;
revoke all privileges on table public.trial_subscriptions from anon, authenticated;
revoke all privileges on table public.billing_events from anon, authenticated;
revoke all privileges on table public.razorpay_webhook_events from anon, authenticated;

grant select, insert, update, delete on table public.contact_messages to service_role;
grant select, insert, update, delete on table public.broker_connections to service_role;
grant select, insert, update, delete on table public.broker_connection_events to service_role;
grant select, insert, update, delete on table public.market_instruments to service_role;
grant select, insert, update, delete on table public.trial_subscriptions to service_role;
grant select, insert, update, delete on table public.billing_events to service_role;
grant select, insert, update, delete on table public.razorpay_webhook_events to service_role;

commit;
```

Before promotion, also align live owner policies with the checked-in `(select auth.uid())` form and verify indexes on policy filter columns. Do not change policy semantics merely to clear an advisor warning.

## Threat and control register

| ID | Threat | Existing control and evidence | Residual risk / required gate | Severity |
| --- | --- | --- | --- | --- |
| T-01 | Secret embedded in source or browser bundle | `security-scan.mjs` scans JS/TS/ESM/CJS, dotenv variants, known token patterns, and rejects secret-like non-allowlisted `VITE_` variables. Deterministic fixtures pass. | Pattern scanning cannot detect every encoded secret. Keep provider secret scanning and deployment-secret review. | P1 |
| T-02 | Service-role bypass exposes another user's data | Worker paths scope user-owned records; repository verifier covers two users, anonymous denial, cross-user read/update/delete, server-only tables, and cleanup. | Protected live CI must pass with an operator-owned test mailbox and current production schema. | P0 release gate |
| T-03 | Broad Data API grants weaken server-only tables | RLS is live on 18/18; nine no-policy tables deny all browser rows. | Revoke `anon`/`authenticated` grants on the remaining seven server-only tables in staging and retest. | P1 |
| T-04 | Broker token theft or cross-user decryption | AES-GCM uses a random IV and user/provider additional authenticated data; broker tests cover tampering and cross-user failure. | Rotate vault secrets with a documented re-encryption plan; do not log decrypted tokens. | P1 |
| T-05 | OAuth CSRF or replay | State is random, hashed in storage, tied to user/provider, bounded by expiry, and consumed. HttpOnly Secure SameSite cookies are used. | Verify live callback URLs, single-use behavior, and provider revocation for each approved broker. | P0 public-beta gate |
| T-06 | Trade execution is accidentally enabled | Static tests find `orderPlacementEnabled: false`; broker calls are profile, quote, candle, option-chain, instruments, auth, and logout only. No Upstox/Dhan order API appears. | Keep a deny test for order-like routes. Any order API requires a new threat model and explicit user authorization; it is out of scope. | P0 invariant |
| T-07 | Live payment is accidentally enabled | Razorpay accepts only `rzp_test_` IDs; every readiness shape fixes `live_disabled: true` and `paymentEnabled: false`; create/verify routes return setup-required and make no Razorpay API call. | Remove or rename legacy order-shaped placeholders before public launch; live payment requires a separate approved release. | P0 invariant |
| T-08 | Forged Razorpay webhook | Exact raw body is HMAC-SHA256 verified and constant-time compared before parsing. | Keep payment disabled until live provider tests and key rotation procedures exist. | P0 paid-launch gate |
| T-09 | Webhook replay or duplicate side effects | `event_id` is unique and writes use `on_conflict=event_id`. Static contract test passes. | Current merge-on-conflict can overwrite the stored duplicate payload and does not reject stale replay. Change to immutable insert/ignore, store a digest, allowlist event types, and define age/retention before payment activation. | P1 now; P0 before paid launch |
| T-10 | Full webhook payload retains unnecessary PII | Server-only deny-all RLS protects rows. | Minimize stored fields, redact nested customer/payment data, define retention/deletion, and restrict admin exports. | P1 |
| T-11 | PostHog captures personal or financial data | Autocapture/pageview/pageleave/session recording are off; memory persistence and no person profiles; events are allowlisted and carry only bounded pathname. Static test passes. | Project exists but `ingested_event=false`; production delivery, region, and resulting payload are not live-verified. | P1 |
| T-12 | Sentry leaks tokens or personal data | `sendDefaultPii=false`, traces off, and `beforeSend` removes user plus request cookies/data/headers. Non-Error objects are not serialized. | Exception messages, stacks, breadcrumbs, contexts, and URLs are not proven scrubbed. No Sentry token/project evidence was available for a live read. Add a centralized scrubber and canary test before enabling. | P1 |
| T-13 | Missing Worker binding is mistaken for safe readiness | Endpoints return explicit setup states; production verifier distinguishes optional and required services. | Current production has required setup gaps and contact POST 404. Do not invite users until required routes/bindings pass. | P0 release gate |
| T-14 | Public form abuse | Contact/waitlist use validation, Turnstile and rate-limit pathways; protected responses use no-store/same-origin CORS. | Contact route currently 404 in production; verify deployed method, Turnstile failure, rate limit, storage, and safe notification end to end. | P0 release gate |
| T-15 | Autonomous agent mutates production | Production agent boundary document prohibits deploys, secrets, migrations, external messages, payment/trade, and destructive actions without explicit approval. | Enforce with separate credentials, protected environments, audit logs, and human approval rather than prompt text alone. | P1 |

## Telemetry verification detail

### PostHog

Static evidence proves a narrow client configuration, not event ingestion. The connected project reports `ingested_event=false`, so no production funnel, delivery, or payload claim is supported. Before enabling:

1. Use a non-personal canary session.
2. Confirm only allowlisted names and a pathname without query/fragment arrive.
3. Confirm no email, broker symbol/search text, token, user ID, price, alert threshold, form body, or error message is present.
4. Confirm autocapture, replay, and person profiles remain off in both code and project settings.
5. Disable again if any payload violates the allowlist.

### Sentry

No `SENTRY_AUTH_TOKEN` or authoritative live project evidence was available, so production issues and received payloads remain unverified. Before enabling, add deterministic redaction for exception values, breadcrumbs, contexts, request URL query strings, and token-like strings; then send canary secrets and assert they do not appear in the captured event. Never paste the token into chat or logs.

## No-payment and no-trade boundary

The free beta is educational research software only:

- Broker integrations may authenticate a user's own account and read approved data. They do not place, modify, or cancel orders.
- No shared broker token, owner token, or browser token storage is permitted.
- Razorpay test scaffolding cannot create a charge or active subscription. `paymentEnabled` remains false even when test credentials are configured.
- Legacy routes named `create-order` and `verify-payment` are inert setup placeholders. Their names create unnecessary attack and expectation surface; remove them before public launch rather than repurposing them silently.
- Enabling any charge, mandate, subscription, order, or trade is a separate project requiring explicit product/legal/security approval and new end-to-end tests.

## Required evidence before invite-only free beta

- Production and preview readiness checks pass for required Worker bindings and routes.
- Contact POST no longer returns 404 and passes valid, invalid, Turnstile, rate-limit, persistence, and notification tests.
- Protected Supabase CI passes with two disposable real users, anonymous denial, cross-user denial, server-only denial, password reset, and unconditional cleanup.
- The seven remaining server-only tables have least-privilege grants, or an explicit time-bounded risk acceptance names the owner and deadline.
- PostHog is either disabled or its canary payload is verified. Sentry is either disabled or its redaction canary is verified.
- Security scan and invariant tests pass on the final commit.
- Payment and trade invariants remain disabled in source, deployed readiness responses, and user-visible actions.

## Incident shutdown

1. Disable optional analytics and affected feature flags/bindings.
2. Disable the affected Worker route or roll back the deployment.
3. Revoke/rotate the narrowest exposed secret first; never rotate by committing a replacement.
4. Revoke broker sessions/tokens when broker material may be exposed.
5. Preserve sanitized audit metadata, not raw secrets or personal payloads.
6. Notify the human incident owner; agents may draft but may not send external notices without approval.
7. Re-enable only after a reproducible test proves containment and the release owner approves.
