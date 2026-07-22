# StockPro Homepage Research and UX Contract

Research date: 2026-07-16  
Route in scope: `/` only  
Design status: **research complete; desktop/mobile concept set approved on 2026-07-16; implementation authorized under `HOMEPAGE_VISUAL_CONTRACT.md`**

## Executive conclusion

StockPro should not become a 3D trading game or a dashboard disguised as a landing page. The recommended artifact is an **HTML-first explanatory scrollytelling page with one progressive-enhancement WebGL scene**. The analytical job is orientation: help a beta visitor understand what can be researched, what requires a provider or login, what StockPro does not do, and what to try next.

The canvas may explain structure, sequence, and system boundaries. It must not carry exact prices, readiness, broker connection, results, legal claims, or navigation. Those remain visible and operable in HTML. If the canvas never loads, the page is still complete.

Primary route: native-scroll scrollytelling with one persistent Three.js renderer.  
Fallback route: semantic HTML plus one static AVIF/WebP key frame per major viewport tier, with an optional CSS-only depth treatment.  
Simpler alternative: a static editorial page with ten inline diagrams. Use it for reduced motion, low power, save-data, unsupported WebGL, context loss, and mobile default when the capability budget is not met.

## Evidence lock

### Ten-second takeaway

StockPro is an educational research workspace that helps users discover, verify, organize, and monitor market research while keeping provider, broker, and readiness states honest.

### Truth invariants

- No fabricated market values, matched stocks, returns, counts, AI answers, connected states, timestamps, or live-status claims.
- No order placement, trade execution, shared broker token, live payment, guaranteed outcome, or investment recommendation.
- “Connected,” “live,” and “verified” appear only when backed by current application state.
- Broker and trust visuals do not imply certification, partnership, SEBI registration, or guaranteed security.
- Every route, CTA, status, disclaimer, heading, form control, and provider message exists in semantic HTML.
- The canvas is decorative/supporting and uses `aria-hidden`; loss of the canvas does not change meaning.
- Product routes outside `/` are not visually redesigned by this concept.

### Source and caveat placement

- Provider name/status and “last updated” belong directly beside the market-source evidence, never in a distant footer.
- Educational and no-trade disclaimers appear in the hero and are summarized again near broker connection.
- Any live data area exposes one of: `live`, `delayed`, `cached`, `partial`, `unavailable`, `provider_required`, or `setup_required` in text.
- The footer holds legal navigation and expanded disclosures, but never the only disclosure.

## Research synthesis

The 18-site review is documented in `COMPETITOR_MATRIX.md`. The recurring useful patterns were:

- immediate task entry before product explanation;
- progressive disclosure of a broad tool ecosystem;
- short capability statements with specific next actions;
- provider/delay/status text beside affected data;
- numbered narrative scenes for complex products;
- one coherent visual system instead of independent effects;
- visible descriptions, keyboard paths, and static/data alternatives for complex visuals;
- explicit resource ownership and quality controls for WebGL.

Patterns rejected for StockPro:

- game controls, scrolljacking, forced orbiting, or spatial navigation;
- equal-weight live-widget walls;
- “AI future” atmosphere with ribbons, orbs, bokeh, or unlabelled glowing networks;
- gamified trading language, urgency, confetti, streaks, or reward motion;
- unsupported social proof or fake dashboard screenshots;
- ten canvases, autoplay audio, hover-only routes, and canvas-rendered text.

## Information architecture and reading order

The DOM order is invariant across viewports. Visual reflow may change placement but not meaning or focus sequence.

1. Skip link.
2. Homepage header: StockPro identity, primary product navigation, account/status access.
3. Hero: H1, supporting explanation, provider disclosure, educational/no-trade disclaimer, search/readiness control, CTA group.
4. Verified market source: provider, update state, availability message, data area only when verified.
5. Product research constellation: ten real product links with setup state.
6. CRT range laboratory: schematic method sequence, supported timeframes, manual-run and readiness statements.
7. Pro research workspace: capability categories and honest onboarding state.
8. Secure broker vault: browser/server boundary, per-user isolation explanation, provider readiness, no-trading statement.
9. Screener data funnel: available filter layers, provider dependency, result boundary.
10. Personal research vault: saved-feature categories and login-required state.
11. Trust and transparency core: provider verification, timestamps, isolation, monitoring, no-trade boundary.
12. Getting-started journey: seven real steps and routes.
13. Footer: legal, status, contact, accessibility, and full disclosures.

### Desktop reading path (≥ 1024 CSS px)

- Header remains compact and does not compete with the hero.
- Hero uses a 5/7 split: HTML task panel on the left; label-safe visual field on the right.
- After the hero, a single sticky visual field may occupy roughly 45–55% of the viewport while scene articles enter in the other column.
- Each scene article begins with scene number, claim heading, one-line takeaway, status/source line, then actions.
- The sticky field releases before the getting-started sequence and footer.
- Keyboard focus follows the article column and links; focusing a scene link may highlight the corresponding visual object but never moves the camera abruptly.

### Tablet reading path (768–1023 CSS px)

- Hero becomes a 60/40 stack: HTML content first, visual key frame second.
- Sticky behavior is optional and should be disabled when it reduces readable width below about 42rem.
- Scene copy and visual alternate in a single column; the active scene has a compact progress label such as “4 of 10.”
- Primary CTA remains visible without requiring landscape orientation.
- Landscape may show the richer visual beside text, but portrait remains complete and is never a crop of desktop.

### Mobile portrait reading path (360–767 CSS px)

- First viewport priority: product identity, H1, educational scope, “Open Screener,” and provider/readiness text.
- Static or simplified render is the default. Continuous WebGL is opt-in only after capability and power checks; there is no “rotate your phone” requirement.
- Search appears after readiness/disclosure so an unavailable provider cannot look like a functional live search.
- CTA group stacks as one primary button, one secondary button, then text links.
- Each scene is a semantic article: heading → takeaway/status → compact key frame → actions/details.
- Product constellation becomes a two-column link list at most; each target is at least 44×44 CSS px and has visible focus.
- No hover-only detail. Tap/focus selects; a “Previous/Next scene” stepper is an optional enhancement, not the only navigation.
- On-screen keyboard never covers the only submit/close action; applying or cancelling search returns focus to the search summary.

### Mobile landscape

Landscape is optional for richer inspection of the CRT and broker-boundary diagrams. It must not unlock essential information. Use split text/visual only when at least 320 CSS px remains for readable copy; otherwise keep the portrait stack.

## CTA hierarchy

| Rank | CTA | Role | Placement and rule |
|---:|---|---|---|
| 1 | **Open Screener** | Primary beta value and lowest-friction research start | Solid primary button in hero; repeat once after the data-funnel scene. |
| 2 | **Run CRT Scanner** | Guided secondary research task | Secondary button in hero and primary action in the CRT scene; show login/provider/manual-run state beside it. |
| 3 | **Explore Pro** | Deeper workspace discovery | Text/outline action in hero; primary action in Pro scene; never paired with payment activation. |
| 4 | **Connect Broker** | High-trust setup task | Lower-emphasis link in hero and clear action in broker scene; include own-broker, per-user, and no-trade text before activation. |
| 5 | Create account / sign in | Prerequisite, not the product promise | Header and getting-started scene; do not outrank research CTAs for logged-out visitors. |
| 6 | Status / contact / legal | Trust and recovery | Persistent navigation/footer; never hidden behind the canvas. |

CTA state rules:

- `ready`: normal action label.
- `login_required`: action remains discoverable and names the prerequisite.
- `provider_required` / `setup_required`: no fake completion; action leads to setup or explanation.
- `approval_pending`: provider card states pending; no “Connect now” success styling.
- `unavailable`: disabled destructive/invalid action plus a readable recovery path; do not rely on disabled controls alone.

## Complete HTML-first fallback

The fallback is the baseline DOM, not a separate error page.

### Required landmarks and content

- `<header>` with homepage navigation and account/status access.
- `<main id=main-content>` containing one `<h1>` and ten labelled `<section>` elements.
- Hero search uses a real `<form>` only when a valid submission path exists; otherwise use a labelled status panel and setup link rather than a dead form.
- Provider state uses visible text; updates are announced only when meaningful, not on every market tick.
- Product constellation uses a list of anchors to real routes.
- CRT explanation uses an ordered list of states with text definitions and a non-numeric schematic image/diagram description.
- Broker scene uses a boundary list: browser, server, encrypted per-user store, provider, no-trading boundary.
- Getting started is an ordered list with real route links and prerequisite notes.
- `<footer>` contains legal, status, contact, and expanded disclosure links.

### Fallback presentation by cause

| Cause | User experience | Must remain |
|---|---|---|
| JavaScript unavailable | Server/static HTML, CSS layout, ordinary links, no canvas placeholder dependency | All content, CTA routes, disclaimers, status text available at render time where possible. |
| WebGL unsupported or creation fails | Static AVIF/WebP key frame or CSS geometry with a neutral “Interactive visual unavailable” note | No missing CTA, blank hero, or changed claim. |
| `prefers-reduced-motion: reduce` | Static key frames; no camera, float, particles, parallax, or scroll-scrub transitions | Direct scene headings and same source/caveat/status information. |
| Save-data / low memory / low core count | No continuous renderer; smallest responsive fallback image; remote data may reduce update cadence | Last known good data with freshness status, or honest unavailable/setup state. |
| Context loss after start | Stop animation, release renderer, replace with current scene key frame, preserve scroll/focus | No error modal unless a user action truly failed. |
| Provider outage | Preserve layout and last valid state only if policy allows, marked stale with timestamp; otherwise “Unavailable” | Never manufacture a value or treat market closure as outage without evidence. |
| Logged out | Research explanation remains; personal and broker features state `login_required` | No fake watchlist, alert, saved-work, or connected-provider content. |

### Screen-reader description pattern

Each scene receives a short visible summary. Example structure: “Schematic of the CRT research sequence: a reference range, a sweep outside the range, a close back inside, confirmation, and completion. No price values are shown. Use the ordered steps below for the full explanation.” Exact live values, when present, remain in adjacent HTML or an accessible table; the image/canvas never duplicates or substitutes them.

## Color-role ledger (provisional concept tokens)

These colors define roles, not a final palette. Final implementation must verify WCAG 2.2 contrast in actual combinations, Windows High Contrast, grayscale, and common color-vision deficiencies.

| Role | Provisional token | Use | Required redundant cue |
|---|---|---|---|
| Page background | `#070A0E` | Quiet canvas and page field | Structure supplied by spacing and borders, not gradient alone. |
| Raised surface | `#111720` | HTML cards/status panels | 1px border and heading hierarchy. |
| Primary text | `#F5F7FB` | Headings and essential values | Semantic heading/value labels. |
| Secondary text | `#AAB4C3` | Descriptions and metadata | Never used below verified contrast size/weight. |
| Neutral structure | `#526071` | Grid, inactive geometry, boundaries | Line style and labels. |
| Primary action / verified path | `#43D9C1` | Open Screener, verified connection path | Check/verified label; never color alone. |
| Comparison / interactive focus object | `#6BA4FF` | Selected module or secondary evidence | Selection outline and text label. |
| Positive movement (data only) | `#50C878` | Verified positive market change | Up arrow and signed value. Never “success” for a trade. |
| Negative movement (data only) | `#FF6B78` | Verified negative market change | Down arrow and signed value. |
| Warning / delayed / partial | `#FFC857` | Provider delay, partial readiness | Warning icon and explicit state text. |
| Unavailable / setup required | `#C7CED9` on dark surface | Neutral absence state | Slash/empty-state icon and reason; not red unless error. |
| Focus ring | `#FFD166` | Keyboard focus | Minimum 2px outline plus offset; never removed. |
| Trust boundary | `#A78BFA` | Browser/server/user-isolation boundary | Dashed/solid line semantics and direct boundary labels. |

Color restrictions:

- Green never means “buy,” profit, broker connected, or safe unless the adjacent verified text says exactly what is true.
- Red never means “sell”; it is reserved for verified negative change or actual error, always with symbol/text.
- Glow is a selected/focused/verified-path state only; ambient bloom is removed.
- Provider states use label + icon + color and survive grayscale.

## Interaction and state contract

- Native scroll ownership; no scrolljacking, snapping, or wheel capture.
- Scene changes occur at discrete article thresholds; continuous interpolation may be used only between named camera states and must be interruptible.
- Default, focused, selected, paused, loading, fallback, unavailable, and error states are defined before implementation.
- Pointer parallax is bounded to a few pixels/degrees, disabled for coarse pointers and reduced motion, and never changes readable content.
- All essential values remain visible without hover. Visual hover/focus is a preview; the HTML link is the commitment action.
- Back/forward navigation and route changes do not depend on canvas state. No homepage visual state needs URL persistence unless a later approved concept adds reader-controlled exploration.

## Approval record

The concept-first visualization workflow required large-screen, mobile portrait, and mobile-landscape key-frame concepts because this is a WebGL/3D scrollytelling design. Those concepts were generated, presented, and approved by the user on 2026-07-16.

Completed before implementation:

1. Generate the paired concept set without exact market values, dense text, copied brand cues, or factual claims baked into imagery.
2. Show the concept set with the ten-scene plan, mobile continuation, interaction notes, and static/reduced-motion fallbacks.
3. Obtain explicit user approval or requested changes.
4. Extract a binding semantic design contract from the approved concepts.
5. Only then begin renderer, asset, or page implementation.

Approval status: **APPROVED**. The extracted binding contract is `HOMEPAGE_VISUAL_CONTRACT.md`.
