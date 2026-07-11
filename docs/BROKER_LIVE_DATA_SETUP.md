# Broker Live Data Setup

StockPro supports per-user broker authorization only. The current foundation supports Upstox OAuth and Dhan token verification scaffolds.

## Required server bindings

- `BROKER_DATA_PROVIDER=upstox` or `dhan`
- `BROKER_TOKEN_STORAGE=supabase`
- `BROKER_ENCRYPTION_SECRET`
- Supabase server URL and secret key
- Upstox client ID, client secret, and exact HTTPS redirect URI; or Dhan client ID

Raw access and refresh tokens are accepted only by the Worker, encrypted with the server-side vault secret, and stored against the authenticated Supabase user ID. Responses expose connection status and provider name only.

Never use a shared owner token, browser storage, query-string token, or `VITE_` broker secret. The connection foundation provides market-data access only; it does not place, modify, or cancel orders.

Before enabling a provider, configure the database schema in the existing broker setup documentation, confirm RLS, rotate the encryption secret through a planned migration, and verify disconnect/revocation behavior.
