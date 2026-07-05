# StockPro final phases A to F status

## Phase A — Build and CI

Current goal: keep GitHub Actions green before adding more live-data logic.

Completed:
- TypeScript Motion variant error in `MarketPulseHero.tsx` was fixed.
- Security scan, typecheck, production build, and launch verification remain in the `npm run ci` chain.
- Live-plan Worker wiring is checked by launch verification.
- Safe delayed/live wording is checked by launch verification.

Manual check:
- Open GitHub Actions after each commit and confirm the latest run passes.
- The GitHub connector is currently returning no workflow runs for the latest commits, so Actions must be checked manually in the GitHub UI.

## Phase B — Live-plan backend verification

Completed:
- Worker routes now exist for live-plan status, order setup, payment verification placeholder, provider setup placeholder, and live-feed status.
- These routes return setup/locked states only.
- Free users remain on delayed or cached data.

Expected behavior:
- `/api/live-plan/status` returns free delayed status.
- `/api/live-plan/create-order` returns setup required until real payment verification is enabled.
- `/api/live-feed/status` returns disabled until a live relay exists.

## Phase C — Payment system

Status: backend foundation only.

What remains:
- Add a real payment provider integration.
- Create server-side order creation.
- Verify payment server-side.
- Store paid-plan status in a database.
- Never unlock live mode from frontend-only state.

## Phase D — Provider setup

Status: route placeholders only.

What remains:
- Add official provider authorization flow.
- Add provider redirect and callback handling.
- Store provider authorization state server-side only.
- Do not ask users to paste access details into chat, email, screenshots, GitHub, or frontend code.

## Phase E — Live feed relay

Status: not active.

What remains:
- Build backend live-feed service.
- Normalize incoming provider ticks into the StockPro `MarketQuote` shape.
- Add reconnect, heartbeat, rate limiting, and fallback to delayed snapshots.
- Connect header ticker, screener, scanner, option chain, watchlist, alerts, signals, and heatmap to the live feed.

## Phase F — Final launch QA

Status: partially complete.

Completed:
- Route SEO manager exists.
- Analytics manager exists.
- Legal pages and risk disclosure exist.
- Sitemap and redirects include launch routes.
- Connect-broker page is included.
- Final launch checklist exists at `docs/LAUNCH_CHECKLIST.md`.
- Free-user wording was changed from fake live wording to delayed/cached wording.

What remains:
- Confirm latest GitHub Actions run is green.
- Deploy latest build.
- Test every page on desktop and mobile using `docs/LAUNCH_CHECKLIST.md`.
- Connect PagePulse, GA4, and Google Search Console.
- Submit sitemap.
- Confirm free users never see fake live-data labels.

## Launch rule

StockPro can launch with free delayed data first. The 299 live data plan should be promoted as setup-ready, but it should only be activated after real payment verification and secure provider authorization are connected.
