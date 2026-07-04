# PagePulse SEO Audit — Phase 5

## Current PagePulse status

Project: stock pro  
URL: https://stockpro1.qzz.io/

PagePulse currently reports:

- 0 tracked pages
- 0 tags
- GA4 not connected
- Google Search Console not connected
- 0 organic clicks and impressions in the current reporting window

This means PagePulse is connected to the project shell, but it cannot yet provide useful SEO or page performance diagnostics.

## GitHub changes completed in Phase 5

- Added `src/components/RouteSeo.tsx` for route-level title, description, robots, canonical, Open Graph, and Twitter metadata.
- Added `src/components/AnalyticsManager.tsx` for optional GA4 page-view tracking via `VITE_GA_MEASUREMENT_ID`.
- Mounted both managers inside `BrowserRouter` in `src/App.tsx`.
- Expanded `scripts/verify-launch.mjs` to check route metadata, canonical support, analytics hook, sitemap, redirects, and legal routes.

## Manual PagePulse setup required

1. In PagePulse, connect Google Search Console for `https://stockpro1.qzz.io/`.
2. In PagePulse, connect GA4 for the same website property.
3. Submit `https://stockpro1.qzz.io/sitemap.xml` in Google Search Console.
4. Request indexing for priority URLs:
   - `/`
   - `/screener`
   - `/option-chain`
   - `/scanner`
   - `/pricing`
   - `/blog`
   - `/risk-disclosure`
5. After deployment, wait for PagePulse to crawl pages and show tracked page count above zero.

## GA4 environment setup

Set this production environment variable in the hosting platform if GA4 tracking is required:

```text
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Do not add the measurement ID to private files. Public GA4 measurement IDs are safe to expose, but all server/private keys must remain outside GitHub.

## Next SEO checks after PagePulse data appears

- Confirm every priority route has impressions or crawl visibility.
- Find pages with high impressions but low CTR.
- Rewrite titles/descriptions for low CTR pages.
- Identify query intent mismatch on `/option-chain`, `/screener`, and `/scanner`.
- Check if legal pages are indexed but low priority.
- Monitor page-change history after each launch update.
