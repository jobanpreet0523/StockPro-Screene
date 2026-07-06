# Market Data Provider

StockPro routes market quotes, indices, option chains, and market status through one Worker-side provider interface in `src/core/marketDataProvider.ts`. The browser never receives provider credentials.

## Modes

### Delayed/sample mode (default)

Set `MARKET_DATA_PROVIDER=delayed`. This uses the existing bundled sample snapshot through `existingDelayedAdapter`.

- Responses use `source: "delayed_sample"`, `delayMinutes: 15`, `isLive: false`, and `isStale: true`.
- The UI labels the feed **15-minute delayed/sample until provider setup**.
- Values are educational samples and must not be treated as current exchange observations or investment advice.
- Unsupported symbols return `provider_unavailable`; the adapter does not invent a quote.

### External provider mode

Set these server-side Cloudflare Worker bindings/secrets:

```text
MARKET_DATA_PROVIDER=external
MARKET_DATA_API_BASE_URL=https://licensed-provider-gateway.example
MARKET_DATA_API_KEY=<secret>
MARKET_DATA_PROVIDER_NAME=<display-name>
```

Use `wrangler secret put MARKET_DATA_API_KEY` for the key. Never prefix the key with `VITE_`, commit it, or expose it to frontend code. `MARKET_DATA_API_BASE_URL` and `MARKET_DATA_PROVIDER_NAME` may be ordinary Worker bindings when they are not sensitive.

If the URL or key is missing, every market route returns `status: "setup_required"` with **Live provider setup required**. Network or upstream failures return `provider_unavailable`; StockPro does not silently relabel sample values as live.

## External gateway contract

`externalProviderAdapter` is a scaffold for a licensed/approved provider gateway. It sends `Authorization: Bearer <MARKET_DATA_API_KEY>` to:

- `GET /health`
- `GET /indices`
- `GET /stocks`
- `GET /quote/:symbol`
- `GET /option-chain/:symbol`
- `GET /market-status`

The gateway must return the same standardized envelope as StockPro:

```json
{
  "status": "ok",
  "source": "licensed-provider-name",
  "timestamp": "2026-07-06T10:00:00.000Z",
  "delayMinutes": 0,
  "isLive": true,
  "isStale": false,
  "providerStatus": "connected",
  "message": "Live provider connected",
  "data": {}
}
```

Allowed statuses are `ok`, `setup_required`, `provider_unavailable`, and `error`. StockPro displays **Live provider connected** only when `status` is `ok` and `isLive` is exactly `true`.

Real live exchange data requires licensed, approved provider credentials and an adapter/gateway that complies with the provider's authentication, redistribution, CORS, rate-limit, and market-data terms. StockPro does not scrape NSE/BSE pages or bypass provider controls.

## StockPro Worker routes

- `GET /api/live/health`
- `GET /api/live/indices`
- `GET /api/live/stocks`
- `GET /api/live/quote/:symbol`
- `GET /api/live/option-chain/:symbol`
- `GET /api/live/market-status`

Legacy market endpoints are compatibility aliases backed by the same selected provider. New frontend work should use `/api/live/*`.

## Verification

After configuring bindings, check `/api/live/health` first. Then verify quote and option-chain timestamps, `isLive`, `isStale`, and provider status before enabling any live label. Run `npm run typecheck` and `npm run build` after adapter changes.
