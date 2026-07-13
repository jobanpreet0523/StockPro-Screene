# Landing Interaction Inventory

Every homepage interaction has a concrete destination, readiness state, and automated check. Provider-dependent elements render no value until a validated response is available.

| Element | Source | Destination | Auth | Provider | Success / setup / error behavior | Automated coverage |
| --- | --- | --- | --- | --- | --- | --- |
| Desktop product menus | `LandingProductPage.tsx` | 20+ public routes | No | No | Opens a real route; direct requests return the SPA with HTTP 200 | `verify-landing-links.mjs`, landing Playwright |
| Mobile drawer | `LandingProductPage.tsx` | Grouped product routes | No | No | Escape, backdrop, close button, and route navigation close the drawer | landing Playwright |
| Global search | `StockProSearch.tsx` | Search-index result URL | No | Algolia | Disabled with setup wording when unavailable; validated indexed records only when configured | landing Playwright |
| Hero CTAs | `LandingProductPage.tsx` | Screener, CRT, Pro, Broker | Route-specific | Route-specific | Navigates without claiming setup success | landing Playwright |
| Index overview | `LandingProductPage.tsx` | `/api/live/indices` | No | Authorized market source | Valid source/timestamp renders; otherwise Unavailable or setup required | landing Playwright, launch verifier |
| Tool grid | `LandingProductPage.tsx` | 10 product routes | Route-specific | Route-specific | Each tile states its dependency and opens the corresponding product | landing links verifier |
| CRT CTA and saved summary | `LandingProductPage.tsx` | `/crt-scanner`, `/api/crt-scanner/runs` | Saved runs require auth | Upstox or Dhan | No automatic scan; no result invented when login/provider/storage is missing | landing and production-readiness Playwright |
| Pro workspace tabs | `LandingProductPage.tsx` | `/pro?tab=...` | Some tabs require auth | Feature-specific | Opens the selected workspace tab; readiness pills remain explicit | landing links verifier |
| Broker cards | `LandingDeferredSections.tsx` | `/connect-broker` and status APIs | Yes | Upstox, Dhan, Angel One | Per-user status; Upstox/Dhan connect or setup; Angel One approval pending | broker integration Playwright |
| Saved work actions | `LandingDeferredSections.tsx` | `/account`, `/pro` | Yes | No | Counts load only for the authenticated user; otherwise login/setup wording | landing Playwright |
| Trial/pricing actions | `LandingDeferredSections.tsx` | `/pricing`, `/start-trial` | Trial requires auth | Razorpay test mode only | Test readiness is explicit; live payment remains disabled | launch verifier |
| Trust/content/footer links | `LandingDeferredSections.tsx` | Public legal, content, and status routes | No | No | Every internal link resolves directly with HTTP 200 | landing links verifier |
| FAQ disclosures | `LandingDeferredSections.tsx` | Inline details | No | No | Native keyboard-operable disclosure controls | accessibility Playwright |

