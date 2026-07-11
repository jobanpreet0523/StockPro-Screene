# Billing Test Mode Setup

The billing foundation is test mode only. Configure Razorpay test credentials, the test plan ID, webhook secret, Supabase billing/trial tables, `TRIAL_DAYS=7`, and the explicit renewal price.

`/api/billing/readiness` must report `paymentEnabled: false` and `live_disabled: true`. Trial start requires an authenticated user, Turnstile, and explicit auto-renew consent. Cancellation is available through `/api/trial/cancel` and `/api/billing/cancel-test-subscription`. Webhooks are signature-verified and stored idempotently.

Do not add live credentials, open checkout, create real charges, infer an active subscription, or conceal renewal terms. A configured test scaffold is not payment enablement.
