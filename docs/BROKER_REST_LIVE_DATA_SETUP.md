# Broker REST live data setup

Stage 22 adds a broker REST provider layer for future live data. It does not use owner/shared broker tokens, does not fake live data, and does not place orders.

## Required setup

Broker REST live data requires all of the following:

- Supabase Auth configured and a real authenticated user session.
- `broker_connections` table configured as described in `docs/BROKER_TOKEN_VAULT_SETUP.md`.
- A per-user broker connection row with `status = 'connected'`.
- An encrypted broker token stored server-side only.
- Approved provider credentials for Dhan or Upstox.

## Environment

```bash
BROKER_DATA_PROVIDER=dhan # or upstox
BROKER_TOKEN_STORAGE=supabase
BROKER_ENCRYPTION_SECRET=at-least-32-random-characters
DHAN_CLIENT_ID=
UPSTOX_CLIENT_ID=
UPSTOX_CLIENT_SECRET=
UPSTOX_REDIRECT_URI=https://stockpro1.qzz.io/api/broker/upstox/callback
```

`MARKET_DATA_PROVIDER=broker` can also be used to force broker mode, but the Worker still requires an authenticated user with a verified per-user broker row.

## Response behavior

- No authenticated user: `setup_required` / broker CTA state.
- No broker row: `setup_required` and "Connect broker for live data".
- Broker row not verified: `setup_required`; no connected state is shown.
- Broker REST provider unavailable: `provider_unavailable`.
- Live labels are allowed only when `isLive === true`.

## Safety

- No direct broker REST calls are made from frontend code.
- No broker WebSocket or REST secret is sent to the browser.
- No raw broker token is returned from any API response.
- No order placement, modification, or cancellation route is included.
