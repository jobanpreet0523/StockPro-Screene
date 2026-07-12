# Alerts setup

Alerts are per-user definitions stored in Supabase. Creating an alert does not claim that an email was sent.

## Required setup

- Apply the `alerts` table and RLS policy.
- Set `SUPABASE_ALERTS_TABLE=alerts`.
- Configure Supabase Auth and the Worker service role.
- Configure an authorized market provider or require each user to connect their own broker.
- For email delivery, set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `SUPPORT_EMAIL`.

## Supported definitions

- Price above, below, or change threshold.
- CRT saved-scan match.
- OI threshold when the connected provider supplies OI.

Users can create, edit, pause, resume, and delete alerts. An alert with missing data remains unevaluated.

## Evaluation job

Deploy a separate scheduled Worker or queue consumer that:

1. Loads only active alerts.
2. Resolves the owning user's authorized data source.
3. Evaluates a source-backed observation with a capture timestamp.
4. Writes `last_evaluated_at`.
5. Sends via Resend only after a real trigger.
6. Writes `last_triggered_at` and a provider message ID after Resend accepts the request.
7. Uses idempotency keys to avoid duplicate notifications.

Do not run the evaluator with a shared personal broker token. Do not mark delivery as sent when Resend is unavailable or rejects a request.
