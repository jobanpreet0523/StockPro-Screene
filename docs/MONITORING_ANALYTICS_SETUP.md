# Monitoring and Analytics Setup

Monitoring is optional and disabled by default.

Set `VITE_ANALYTICS_ENABLED=true` and configure `VITE_SENTRY_DSN` and/or `VITE_POSTHOG_KEY`. `VITE_POSTHOG_HOST` defaults to the US ingestion host, `https://us.i.posthog.com`; override it only when the PostHog project assigns another region.

The browser integration disables autocapture, session recording, and person profiles. Only the allowlisted product events are accepted. Never attach broker tokens, payment secrets, Supabase secret keys, admin tokens, raw personal trading data, form bodies, or email addresses.

The status page reports only `configured`, `setup_required`, or `disabled`; it never returns credential values.
