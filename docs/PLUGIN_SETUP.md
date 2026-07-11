# Production Plugin Setup

All integrations are optional and fail closed when configuration is absent.

- Monitoring: Sentry and PostHog client keys, enabled explicitly.
- Anti-spam: Turnstile site key in the browser and secret key in the Worker.
- Data/auth: Supabase publishable browser key; secret key only in the Worker.
- Email: Resend server key and verified sender.
- Search: Algolia search-only browser key; admin key server-only.
- Market and broker: licensed provider gateway and encrypted per-user token vault.
- Billing: test readiness only. Live payment remains disabled.

After changing configuration, run the complete command list in `docs/TESTING_AND_AUDIT_SETUP.md` and inspect `/status`.
