# PagePulse SEO Audit — Launch Status

## Current PagePulse status

Project: stock pro  
Project UUID: `019f2e3d-c379-702a-8942-325c87552224`

PagePulse currently reports:

- GA4 connected
- Google Search Console connected
- 1 tracked page
- 0 tags
- 0 organic clicks and impressions in the current reporting window
- 0 page views in the current reporting window

## Critical PagePulse issue

The PagePulse project website URL is currently set to:

```text
https://search.google.com/search-console/about
```

This should be changed inside PagePulse to:

```text
https://stockpro1.qzz.io/
```

Until the project website URL is corrected and the latest deployment is recrawled, PagePulse may show stale or confusing diagnostics.

## Tracked page issue

PagePulse has tracked the homepage:

```text
https://stockpro1.qzz.io/
```

But it still shows an older homepage title:

```text
StockPro — Free NSE F&O Screener | NIFTY Option Chain Live
```

The GitHub code has already been updated to launch-safe delayed/cached wording. Deploy the latest build, then recrawl in PagePulse so the tracked title updates.

## GitHub changes completed

- Added `src/components/RouteSeo.tsx` for route-level title, description, robots, canonical, Open Graph, and Twitter metadata.
- Added `src/components/AnalyticsManager.tsx` for optional GA4 page-view tracking via `VITE_GA_MEASUREMENT_ID`.
- Mounted both managers inside `BrowserRouter` in `src/App.tsx`.
- Added safe delayed/live wording checks to `scripts/verify-launch.mjs`.
- Added launch checklist at `docs/LAUNCH_CHECKLIST.md`.

## Manual PagePulse setup required now

1. Open the PagePulse project `stock pro`.
2. Change the project website URL from `https://search.google.com/search-console/about` to `https://stockpro1.qzz.io/`.
3. Confirm GA4 is connected to the same website property.
4. Confirm Google Search Console is connected to the same website property.
5. Deploy the latest GitHub build.
6. Recrawl or refresh the tracked homepage in PagePulse.
7. Add/check priority routes:
   - `/`
   - `/screener`
   - `/option-chain`
   - `/scanner`
   - `/pricing`
   - `/connect-broker`
   - `/risk-disclosure`
8. Submit `https://stockpro1.qzz.io/sitemap.xml` in Google Search Console.
9. Request indexing for priority URLs.

## GA4 environment setup

Set this production environment variable in the hosting platform if GA4 tracking is required:

```text
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Public GA4 measurement IDs are safe to expose in frontend builds, but all server/private keys must remain outside GitHub.

## Next SEO checks after PagePulse data appears

- Confirm every priority route has impressions or crawl visibility.
- Find pages with high impressions but low CTR.
- Rewrite titles/descriptions for low CTR pages.
- Identify query intent mismatch on `/option-chain`, `/screener`, and `/scanner`.
- Check if legal pages are indexed but low priority.
- Monitor page-change history after each launch update.
