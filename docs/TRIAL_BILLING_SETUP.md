# Trial Billing Setup

Stage 16 adds disclosure, consent, and API foundations only. It does not create a Razorpay subscription, payment mandate, checkout session, or charge.

## Required server configuration

Configure these only as Cloudflare Worker bindings or secrets:

```text
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_PRO_PLAN_ID=
RAZORPAY_WEBHOOK_SECRET=
TRIAL_DAYS=7
PRO_PRICE_INR=299
```

Never prefix private values with `VITE_` or place them in browser code. Keep the production billing route disabled until authenticated per-user subscription storage, webhook verification, cancellation, support, and policy checks are implemented and tested.

## Consent and mandate requirements

The required disclosure is:

> ₹0 today. Auto-renews at ₹299/month after 7 days unless cancelled.

`POST /api/trial/start` rejects requests unless `autoRenewConsent` is exactly `true`. This application-level consent does not replace payment-provider authorization. Before real recurring charging is enabled, each user must also authorize the recurring payment mandate through the approved Razorpay flow.

Users must be able to cancel before the trial end. Cancellation must be bound to the authenticated user’s own provider subscription record; a client-supplied subscription identifier must never be trusted on its own.

## Current route behavior

- `GET /api/trial/status` reports `setup_required`; it never invents an active trial.
- `POST /api/trial/start` validates explicit consent, then reports `setup_required`; it creates no checkout or charge.
- `POST /api/trial/cancel` reports `setup_required` until authenticated subscription persistence exists.

No hidden auto-charge is present. Payment and checkout remain disabled.

## Before enabling real billing

1. Create the ₹299 monthly plan in Razorpay test mode.
2. Add authenticated, per-user subscription storage.
3. Create subscriptions only after the disclosure checkbox is accepted.
4. Require the user to complete Razorpay’s recurring mandate authorization.
5. Verify webhook signatures server-side and make webhook processing idempotent.
6. Implement cancellation and confirm it stops renewal before the next charge.
7. Exercise start, renewal, failure, cancellation, and webhook replay scenarios in test mode.
8. Complete legal, support, refund, privacy, and launch-readiness review before live mode.

StockPro remains an educational analytics product, not investment advice.
