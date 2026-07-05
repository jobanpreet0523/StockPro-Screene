# StockPro launch checklist

## GitHub Actions

Open GitHub Actions and confirm the latest Build Verification run passes before launch.

CI runs:
- security scan
- TypeScript typecheck
- production build
- launch verification

## Data labels

Free users must see delayed or cached data wording only.

Allowed free-user labels:
- Delayed Free Data
- Data Sync
- Free delayed data is active

Avoid wording that implies free public real-time data.

## Live-plan backend routes

After deployment, test:
- /api/live-plan/status
- /api/live-plan/create-order
- /api/live-plan/verify-payment
- /api/live-feed/status

Expected before real payment integration:
- status returns free_delayed
- create-order returns setup required
- verify-payment keeps live mode locked
- live-feed returns disabled

## Broker setup routes

After deployment, test:
- /api/provider/upstox/start
- /api/provider/upstox/callback
- /api/provider/zerodha/start
- /api/provider/zerodha/callback

Expected before real provider integration:
- setup required
- no live data activation
- no manual credential sharing

## Pages to test manually

Test desktop and mobile:
- /
- /screener
- /scanner
- /option-chain
- /us-markets
- /strategy-builder
- /greeks-calculator
- /risk-calculator
- /heatmap
- /fii-dii
- /deals
- /news
- /pricing
- /blog
- /signals
- /connect-broker
- /privacy
- /terms
- /risk-disclosure
- /contact

## Payment setup later

Do not enable the 299 live plan until real server-side payment verification exists.

Required later:
- order creation
- server-side verification
- paid-plan database record
- user session verification

## Broker and live feed setup later

Do not enable live mode until provider authorization and live feed relay are active.

Required later:
- official provider redirect
- official provider callback
- secure server-side authorization storage
- live-feed backend service
- normalized MarketQuote output
- fallback from live feed to delayed data

## SEO and analytics

Before public launch:
- connect PagePulse
- connect GA4
- connect Google Search Console
- submit sitemap
- request indexing for priority pages

Priority URLs:
- /
- /screener
- /option-chain
- /scanner
- /pricing
- /connect-broker
- /risk-disclosure

## Launch rule

StockPro can launch with free delayed/cached data first.

The 299 live data plan can be shown as setup-ready, but it must not be activated until real payment verification and secure provider authorization are connected.
