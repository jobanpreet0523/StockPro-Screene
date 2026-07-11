# SEO Audit Setup

`npm run seo:audit` checks canonical and social metadata, unique route titles, public route coverage, private-route `noindex`, robots, and the sitemap reference.

`npm run seo:sitemap` validates the production origin, exact public route allowlist, duplicates, and exclusion of admin, API, account, login, signup, and beta routes.

Update `src/components/RouteSeo.tsx` and `public/sitemap.xml` together whenever a public route changes.
