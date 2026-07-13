# Resend Delivery Test

Configure `RESEND_API_KEY`, a verified `RESEND_FROM_EMAIL`, and `SUPPORT_EMAIL` as server-only Worker secrets. Use a controlled recipient and non-sensitive test content.

1. Verify the sender domain in Resend.
2. Submit one notification through the protected production endpoint.
3. Confirm the endpoint reports a real provider message ID only after Resend accepts the request.
4. Confirm the message arrives and inspect spam placement, sender alignment, subject, and links.
5. Repeat one intentional provider rejection and verify the UI reports an error rather than success.
6. Remove test recipient data from application storage when the audit is complete.

When configuration is missing, the endpoint must return an informational `setup_required` response and must not claim delivery.

