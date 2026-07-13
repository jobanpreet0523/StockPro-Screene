# Angel One Provider Readiness

Angel One remains `setup_pending` until application approval and current official credentials are available. The Connect Broker page disables its action and does not request a password, PIN, OTP, or TOTP secret.

Future server-only placeholders are documented in `.env.example`:

- `ANGELONE_API_KEY`
- `ANGELONE_CLIENT_ID`
- `ANGELONE_CLIENT_SECRET`
- `ANGELONE_REDIRECT_URI`

After approval, implement the shared `ReadOnlyBrokerAdapter` contract, provider-response validation, per-user encrypted storage, disconnect behavior, and mocked official response-shape tests. Do not add order routes or enable a connected state from credential presence alone.

