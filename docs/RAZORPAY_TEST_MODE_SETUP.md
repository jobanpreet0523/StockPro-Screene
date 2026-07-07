# Razorpay test-mode setup

Stage 24 prepares Razorpay test-mode subscription readiness only. Live payment remains disabled. No live checkout, hidden auto-charge, or real subscription is created by this stage.

## Required Worker environment

Use Razorpay test credentials only:

```bash
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your-test-key-secret
RAZORPAY_PRO_PLAN_ID=plan_your_test_plan_id
RAZORPAY_WEBHOOK_SECRET=your-test-webhook-secret
SUPABASE_BILLING_EVENTS_TABLE=billing_events
```

If `RAZORPAY_KEY_ID` does not start with `rzp_test_`, `/api/billing/readiness` returns `setup_required`. Live mode is intentionally blocked.

## Test subscription readiness

Routes added:

- `GET /api/billing/readiness`
- `POST /api/billing/create-test-subscription`
- `POST /api/billing/cancel-test-subscription`
- `POST /api/razorpay/webhook`

The create/cancel routes require an authenticated user and `autoRenewConsent=true` for creation. In Stage 24 they remain test-mode scaffolds and do not create a live charge. The webhook route verifies Razorpay signatures before storing test events.

## Webhook setup

In the Razorpay test dashboard:

1. Create a test subscription plan for StockPro Pro.
2. Add a webhook pointing to `/api/razorpay/webhook`.
3. Configure the webhook secret as `RAZORPAY_WEBHOOK_SECRET`.
4. Send test events and confirm they are stored idempotently in `billing_events`.

Do not enable live mode until account access, support, refund, legal, cancellation, and monitoring checks are complete.
