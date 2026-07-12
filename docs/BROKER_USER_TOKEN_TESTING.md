# Per-user broker token testing

This flow is for real beta users testing read-only market data from their own broker account.

## Before testing

1. Configure Supabase Auth, `broker_connections`, and `broker_connection_events`.
2. Set `BROKER_TOKEN_STORAGE=supabase`.
3. Store a random `BROKER_ENCRYPTION_SECRET` of at least 32 characters as a Worker secret.
4. Configure the approved broker application and callback.
5. Confirm order placement is disabled.

## Tester flow

1. Create and verify a StockPro account.
2. Log in and open `/connect-broker`.
3. Enter the credentials requested by the selected broker. Never enter a password or OTP.
4. Save credentials. The browser form clears the token after the Worker encrypts it.
5. Run profile, quote, historical-candle, and option-chain tests as supported.
6. A connected state appears only after the provider accepts a read-only test.
7. Disconnect when testing is complete.

## Isolation guarantees

- The encrypted record is keyed to the authenticated Supabase user ID.
- AES-GCM additional authenticated data binds the token to that user and provider.
- The Worker loads a connection using the current verified user ID.
- Tokens are decrypted only inside the Worker for the duration of a provider request.
- No token is returned to the frontend, analytics, logs, Sentry, or PostHog.
- Friends must connect their own token. There is no owner/shared public token.
- StockPro has no route for placing, modifying, or cancelling orders.

Dhan access tokens may expire under current broker rules. An invalid or expired token is reported as `reconnect_required`, never as connected.
