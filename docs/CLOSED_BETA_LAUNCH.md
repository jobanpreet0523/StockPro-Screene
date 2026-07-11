# Closed Beta Launch

StockPro closed beta access is invite-only or waitlist-based. The `/beta` page reports service readiness and accepts Turnstile-protected feedback; it does not grant access or fabricate adoption.

## Target metrics

- 100 beta users
- 20 daily active users
- 10 broker-connected users
- First paid interest

These are targets, never hardcoded achieved counts. Measure only consented, privacy-safe events when PostHog is explicitly enabled: `landing_visit`, `signup`, `start_trial_click`, `connect_broker_click`, `crt_scan_run`, `watchlist_created`, `alert_created`, and `pricing_click`.

Before invitations, configure Supabase Auth/RLS, waitlist storage, Turnstile, feedback storage, Resend, broker vault, authorized market provider, monitoring, and Razorpay test readiness. Live payment remains disabled. Use `/admin/beta-feedback` with the Worker admin token to review feedback; never store that token in browser storage.
