# Authorized market-provider setup

StockPro never scrapes NSE, Investing.com, or another unlicensed website. Provider calls run in the Worker, and credentials never use a `VITE_` prefix.

## Provider selection

Set exactly one `MARKET_DATA_PROVIDER` value:

- `authorized_vendor`: licensed vendor implementing StockPro's normalized HTTPS contract.
- `zerodha`: Kite Connect backend adapter.
- `dhan`: DhanHQ backend or per-user broker adapter.
- `upstox`: Upstox backend or per-user broker adapter.

Required credential names are listed in `.env.example`. Keep all access tokens in Cloudflare secrets.

## Normalized provider contract

The backend interface exposes:

- `getProviderStatus()`
- `getInstrumentMaster()`
- `refreshInstrumentMaster()`
- `getQuotes()`
- `getHistoricalCandles()`
- `getOptionChain()` when the provider supports it

Responses are validated with Zod before application code consumes them. Malformed provider data is rejected; StockPro never substitutes generated values.

## Operational rules

- Refresh the instrument master at most once per day and persist it in `market_instruments`.
- Batch quotes to the provider's documented limit and apply Worker rate limits.
- Capture historical candles once for a CRT run, persist them, and never refetch during result GET requests.
- Public redistribution requires a separately licensed market-data account.
- A personal broker token belongs to one authenticated user and cannot be used as the public feed.
- No adapter exposes order placement.

Official references: DhanHQ v2 data APIs, Upstox Market Data APIs, and Kite Connect v3 market-data/instrument APIs. Confirm current provider entitlements and rate limits before enabling production.
