# StockPro Launch Readiness Checklist

## Critical

- GitHub Actions build must pass on main.
- Latest main must deploy to production.
- Direct refresh must work on all public routes.
- Firebase guest mode must not produce uncaught permission errors.
- Header navigation must show or allow access to every tab on desktop and mobile.
- Market data failure states must show retry and fallback messaging.
- Financial education and risk disclaimer must be visible.
- Pricing or payment must be tested before accepting paid users.
- Client code must not expose private API keys.

## High priority

- Add GA4 or Cloudflare Web Analytics.
- Add Clarity, Sentry, or Datadog for UX and error monitoring.
- Add Privacy Policy, Terms, Risk Disclosure, and Contact pages.
- Make footer support links clickable.
- Add FAQ content for option chain, screener, PCR, IV rank, and risk warnings.
- Add loading skeletons and retry states for heavy widgets.

## Medium priority

- Add onboarding tips for first-time users.
- Improve empty states for watchlist, saved scanners, and alerts.
- Add internal links from blog to tools.
- Test 360px, 390px, 768px, and 1024px widths.
- Test Chrome, Edge, Safari, and Firefox.

## Public route QA

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

## Console QA

Production console should not show uncaught app errors. Browser extension warnings can be ignored only after confirming they are not from app bundles.

## Finance note

StockPro should clearly state that it is not investment advice and that all data is for education and analysis only.
