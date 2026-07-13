# Broker OAuth and Dhan gateway

## Upstox

Configure these Worker secrets and bindings:

```text
UPSTOX_CLIENT_ID=
UPSTOX_CLIENT_SECRET=
UPSTOX_REDIRECT_URI=https://stockpro1.qzz.io/api/broker/upstox/callback
```

`GET /api/broker/upstox/start` requires a StockPro login, stores a hash of a
random one-time state value, and returns the official Upstox authorization URL.
The callback consumes state once, exchanges the code server-to-server, and
stores only AES-GCM ciphertext. Raw tokens are never returned to the browser.

## Dhan modes

Use exactly one explicit mode:

```text
DHAN_MODE=sandbox
DHAN_MODE=live
DHAN_AUTH_MODE=individual
DHAN_AUTH_MODE=partner
```

Sandbox developer validation uses `DHAN_SANDBOX_CLIENT_ID` and
`DHAN_SANDBOX_ACCESS_TOKEN` only behind the admin-protected sandbox test route.
It never creates a user connection and never unlocks live CRT.

Individual live consent uses:

```text
DHAN_CLIENT_ID=
DHAN_API_KEY=
DHAN_API_SECRET=
DHAN_REDIRECT_URI=https://stockpro1.qzz.io/api/broker/dhan/callback
```

Partner mode remains inactive until `DHAN_PARTNER_ID` and
`DHAN_PARTNER_SECRET` are approved and configured.

## Data API readiness

The Worker checks these explicit server-side flags:

```text
DHAN_DATA_API_SUBSCRIPTION_ACTIVE=false
DHAN_STATIC_IP_CONFIGURED=false
DHAN_QUOTE_PERMISSION=false
DHAN_HISTORICAL_PERMISSION=false
DHAN_OPTION_CHAIN_PERMISSION=false
DHAN_LIVE_FEED_PERMISSION=false
```

Cloudflare Workers do not provide a dedicated static outbound IP. When Dhan
requires one, deploy a separate HTTPS read-only gateway with a static outbound
IP and configure:

```text
DHAN_PROVIDER_GATEWAY_URL=
DHAN_PROVIDER_GATEWAY_SECRET=
```

The gateway must authenticate every StockPro request, validate provider
responses, return read-only market data only, and expose no credential or order
endpoint. Until the subscription, permissions, and static-IP path are real,
StockPro returns HTTP 200 `setup_required` states.

## Token storage

Configure `BROKER_TOKEN_STORAGE=supabase` and a high-entropy
`BROKER_ENCRYPTION_SECRET`. AES-GCM appends its authentication tag to the
ciphertext returned by Web Crypto. Each access or refresh token receives a
unique IV. Apply `docs/SUPABASE_BROKER_OAUTH_MIGRATION.sql` before testing.
