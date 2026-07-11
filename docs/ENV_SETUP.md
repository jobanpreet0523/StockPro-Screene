# Production Environment Setup

StockPro integrations are optional and fail closed. Missing configuration must report `setup_required`; it must never activate a substitute data source or synthetic success state.

## Browser-safe variables

- `VITE_ANALYTICS_ENABLED`
- `VITE_SENTRY_DSN`
- `VITE_SENTRY_ENVIRONMENT`
- `VITE_POSTHOG_KEY`
- `VITE_POSTHOG_HOST`
- `VITE_TURNSTILE_SITE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_ALGOLIA_APP_ID`
- `VITE_ALGOLIA_SEARCH_KEY`

Only publishable, site, DSN, or search-only credentials belong in browser variables.

## Worker-only secrets and bindings

- `TURNSTILE_SECRET_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `SUPPORT_EMAIL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY` or legacy `SUPABASE_SERVICE_ROLE_KEY`
- `ALGOLIA_ADMIN_KEY`
- `ALGOLIA_STOCK_INDEX`
- `ALGOLIA_CONTENT_INDEX`
- `ZERODHA_API_KEY`
- `ZERODHA_ACCESS_TOKEN`
- `AUTHORIZED_VENDOR_API_KEY`
- `AUTHORIZED_VENDOR_BASE_URL`
- `BROKER_ENCRYPTION_SECRET`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Store secrets with `wrangler secret put`. Never add secret values to `.env.example`, source code, logs, readiness responses, or frontend storage.

After configuration, deploy and inspect `/status`. Readiness responses expose only `configured`, `setup_required`, or `disabled`.
