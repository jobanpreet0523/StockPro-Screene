# CRT Scanner Database Setup

The CRT Scanner uses the canonical `market_instruments`, `crt_scan_runs`, and `crt_scan_results` definitions in `docs/SUPABASE_FULL_SCHEMA.sql`. Apply that schema together with `docs/SUPABASE_RLS_POLICIES.sql`; do not create a second, divergent CRT schema.

Canonical storage uses these contracts:

- `market_instruments`: provider-scoped `instrument_token`, `trading_symbol`, `name`, and `provider_payload` fields.
- `crt_scan_runs`: `created_at` and `completed_at` lifecycle timestamps with no separate `started_at` requirement.
- `crt_scan_results`: numeric score/price/risk columns, `candles`, and the complete result in `result_payload`.

Configure every table binding from `.env.example`. Refresh the instrument master through an authenticated admin process. `POST /api/crt-scanner/run` captures authorized-provider data once; GET endpoints read the persisted run and `result_payload` without provider refetches.

The authorized-vendor adapter requires HTTPS JSON endpoints for `GET /instruments?exchange=NSE&segment=EQ` and `POST /crt-snapshot`. The Zerodha adapter uses official Kite instrument and historical-candle APIs. No public scraping or substitute data source is permitted.
