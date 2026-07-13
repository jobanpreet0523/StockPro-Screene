# Production Analytics Test Guide

Use a temporary non-personal browser profile. Never place broker tokens, emails, order data, payment values, or search text in analytics properties.

1. Confirm `VITE_ANALYTICS_ENABLED=true`, a valid `VITE_POSTHOG_KEY`, and `VITE_POSTHOG_HOST=https://us.i.posthog.com`.
2. Open production and verify `landing_visit` once.
3. Click Pricing, Start Trial, Connect Broker, CRT Scanner, and a Pro tab.
4. Confirm only allowlisted event names arrive with the bounded `path` property.
5. Confirm autocapture, session recording, and person profiles remain disabled.
6. Confirm setup-required API responses do not produce repeated error events.
7. Remove the temporary test activity from any operational dashboard before measuring real funnels.

Expected events are defined in `src/lib/posthog.ts`. A missing key must leave analytics disabled rather than reporting a synthetic success state.
