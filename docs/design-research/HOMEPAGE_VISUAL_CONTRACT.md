# StockPro Homepage Approved Visual and Interactive Contract

Approval date: 2026-07-16  
Approval response: `approve all`  
Approval scope: desktop, mobile portrait, mobile landscape, ten-scene narrative, motion direction, responsive continuation, static fallbacks, and implementation direction  
Status: **APPROVED — implementation authorized**

## Approved concept references

- Desktop: `C:/Users/DELL/.codex/generated_images/019f6a07-8755-7a43-86da-acb713554ddc/exec-f0d430c0-e012-4e40-a048-ac7fb9bd435e.png`
- Mobile portrait: `C:/Users/DELL/.codex/generated_images/019f6a07-8755-7a43-86da-acb713554ddc/exec-2c6d5e66-64dd-47cb-ad42-30d43914382b.png`
- Mobile landscape: `C:/Users/DELL/.codex/generated_images/019f6a07-8755-7a43-86da-acb713554ddc/exec-e746f9d4-dba5-4ff4-8063-db00086c9676.png`

The concepts are binding semantic references. Exact spacing, procedural geometry, camera coordinates, and breakpoint mechanics may be tuned only when the hierarchy, reading path, color roles, evidence boundaries, and responsive meaning remain unchanged.

## Evidence lock

### Ten-second takeaway

StockPro is an educational research workspace that helps visitors discover, verify, organize, and monitor market research while provider, broker, readiness, and no-trading boundaries remain explicit.

### Truth invariants

- No fabricated price, market status, matched stock, CRT result, return, AI answer, personal count, customer count, testimonial, provider state, broker connection, or timestamp.
- No order placement, trade execution, shared broker token, live payment, guaranteed return, or directional BUY/SELL recommendation.
- All values, links, forms, source text, status text, disclaimers, and actions are React/HTML owned.
- The WebGL scene is explanatory and schematic. It never becomes the source of product truth.
- The canvas is `aria-hidden`, non-focusable, and replaceable without changing meaning or navigation.
- Non-homepage routes keep their existing visual implementation.

## Artifact and reading path

- Analytical job: explain system structure, research sequence, verification gates, and per-user security boundaries.
- Artifact family: HTML-first editorial scrollytelling with one persistent Three.js research world.
- Desktop: concise hero beside the visual world, followed by alternating semantic scene sections that update the same visual field.
- Tablet: single-column narrative with the visual field bounded and non-sticky when readable text width would suffer.
- Mobile portrait: HTML claim and primary CTA first, then a compact static visual; sections remain ordinary semantic articles.
- Mobile landscape: optional split composition for CRT and broker-boundary scenes; no exclusive information or rotate requirement.
- Fallback: semantic HTML plus responsive static/CSS key frames for reduced motion, mobile default, save-data, low capability, import failure, and WebGL/context failure.

## Locked visual roles

| Role | Treatment | Meaning |
|---|---|---|
| Night neutral | `#06101f` / deep slate | System boundary and hero field; never a live-status signal. |
| Research blue | `#2f6bff` | Primary action, focused research path, active scene. |
| Verification cyan | `#42d7d0` | Verified/source pathway only when application state supports it. |
| Caution amber | `#ffb35c` | Setup, provider dependency, approval pending, or illustrative trigger plane. |
| Unavailable rose | restrained outline/text | Explicit unavailable/error state; never used as market direction. |
| White/slate | HTML content and exact labels | Editable product truth, caveat, status, and navigation. |

Depth differentiates layer, gate, path, boundary, container, and state. Object height, glow, particle count, and path speed never encode price, volume, importance, return, or probability.

## Evidence-bearing visual inventory

| Scene | Story job | Renderer layer | React/HTML layer | Motion verb | Static/reduced-motion state | QA proof |
|---:|---|---|---|---|---|---|
| 1 Research universe | Orient visitors to the research system. | Core, schematic candles, scanner rings, chart planes, broker node, bounded paths. | Hero claim, search, provider disclosure, disclaimer, four CTAs. | Assemble | Approved hero key-frame composition. | HTML and CTA visible before Three.js request; no numeric geometry. |
| 2 Verified source | Explain source/timestamp gating. | Provider gate, timestamp ring, index nodes, closed unavailable shield. | Source, timestamp, scheduled-hours distinction, verified values or `Unavailable`. | Verify | Provider → verification → HTML boundary diagram. | Unavailable fixture shows no substitute value or moving verified path. |
| 3 Product constellation | Expose ten real destinations and prerequisites. | Ten task-grouped modules; focus outline only. | Ten ordinary route links and setup text. | Organize | Two-column link grid plus compact constellation frame. | Keyboard order, tap targets, and all routes work without canvas. |
| 4 CRT laboratory | Teach range → sweep → close → confirmation → completion. | Generic candles and reference/trigger/invalidation/target planes. | Three CRT modes, timeframes, manual-run and readiness text. | Reveal | Ordered non-numeric still frame. | No price axis, forecast, or direction claim. |
| 5 Pro workspace | Explain research capability categories. | Abstract panels for chart, watchlist, saved work, screener, explorer, AI, onboarding. | Capability links and setup states. | Arrange | Empty isometric workspace; no sample values. | Zero fabricated return, idea, answer, or count. |
| 6 Broker vault | Explain browser/server boundary and per-user isolation. | AES-GCM vault metaphor, isolated paths, provider nodes, no-trading shield. | Per-provider login/setup/sandbox/approval states and own-broker disclosure. | Isolate | Labelled boundary frame. | No token data in visual props/logs/analytics; no false connected state. |
| 7 Screener funnel | Explain provider-backed filtering. | Layered funnel and empty result boundary. | Available filters, provider requirement, real/empty result state. | Filter | Layered static funnel. | No dots or counts that imply matched companies. |
| 8 Personal vault | Explain authenticated saved artifacts. | Empty labelled storage containers. | Login/setup state and real authenticated counts only. | Store | Locked empty-vault frame. | Logged-out fixture exposes zero personal values. |
| 9 Trust core | Explain documented verification and operational boundaries. | Provider, timestamp, server, storage, monitoring, no-trade layers. | Plain-language evidence links and limitations. | Audit | Numbered layered system frame. | No certification, partnership, SEBI, or guaranteed-security implication. |
| 10 Getting started | Make beta onboarding finite and route-based. | Seven-node path inside the no-trading perimeter. | Ordered real routes and prerequisites. | Progress | Vertical ordered stepper. | Every route valid; scroll alone never marks a step complete. |

Fresh-pass status: Three.js, React, TypeScript, scrollytelling, accessibility, and visualization-testing specialist instructions were applied locally; WebGL and QA agents perform independent read-only architecture/coverage reviews before integration.

## Typed scene and interaction contract

The controller owns the following declarative state; raw scroll percentages do not leak into render code:

```ts
type LandingSceneId =
  | 'research-universe' | 'verified-source' | 'product-constellation'
  | 'crt-laboratory' | 'pro-workspace' | 'broker-vault'
  | 'screener-funnel' | 'personal-vault' | 'trust-core'
  | 'getting-started';

type LandingSceneState = {
  id: LandingSceneId;
  active: boolean;
  focusedModule?: string;
  providerVerified: boolean;
  motion: 'full' | 'stepped' | 'static';
};
```

- Default: scene 1 overview; fallback remains visible until `data-render-ready=true` after a valid frame.
- Scroll: native page scroll; `IntersectionObserver` selects the nearest visible `data-landing-scene` section.
- Hover: optional local preview on capable pointer devices; no essential detail appears only on hover.
- Focus/tap: React link remains the action and may set an ephemeral visual focus; it does not move focus or change URL state.
- Keyboard: ordinary DOM order; Escape closes the mobile menu; no canvas keyboard trap.
- Persistence: scene state is ephemeral and intentionally excluded from URL/storage; product links and existing Pro query parameters remain canonical.
- Browser behavior: no scrolljacking, wheel capture, pinch capture, spatial navigation, audio, sensors, permissions, or autoplay video.

## Renderer ownership and coordinate ledger

- Simultaneous renderer instances: exactly one on `/`, zero elsewhere.
- Renderer: lazily imported Three.js `WebGLRenderer`; React owns the canvas mount and scene state, the scene class owns GPU objects.
- Camera: perspective desktop composition with named, bounded poses; mobile uses static output by default.
- World coordinates: normalized scene units around a shared origin; every scene group is independently positioned within the same world and visibility-interpolated.
- HTML coordinates never depend on 3D projection. There are no DOM labels projected from meshes.
- Picking: none required for launch. HTML links own all actions; optional focus mapping uses stable scene/module IDs.
- Frame clock: `requestAnimationFrame`, capped delta, paused when hidden/offscreen/static/context-lost.
- Context lifecycle: listeners for `webglcontextlost`/`webglcontextrestored`; loss prevents default restoration loop, disposes resources, and exposes the current fallback.
- Cleanup: cancel frames/idle work; disconnect observers; remove listeners; dispose geometry, materials, textures, render targets, and renderer; force context loss only on final unmount.
- Render budget: DPR ≤ 1.5 capable desktop, lower quality ≤ 1.25; no shadows, post-processing, external model, or synchronous readback.
- Static asset budget: each fallback ≤ 150 KiB. Lazy 3D chunk ≤ 250 KiB gzip.

## Procedural mark ledger

| Mark/effect | Meaning | Must not imply |
|---|---|---|
| Candlestick form | Generic market-research object | Real security, price, direction, timeframe, or result. |
| Ring | Scanner/source gate | Progress percentage, market activity, or uptime. |
| Path | Defined research or verification connection | Money flow, order route, speed, or provider partnership. |
| Verification packet | Schematic provider response moving only in a verified state | Trade, user, quote frequency, volume, or real-time tick. |
| Container/vault | Server-side per-user storage boundary | External certification or absolute security. |
| Outline/glow | Current scene or keyboard focus | Recommendation, alert, or magnitude. |

Particles default to zero. If verification packets are rendered, their count and speed are fixed schematic styling and they appear only with verified provider state. Reduced motion and static tiers show the path with no movement.

## Mobile and failure contract

- Portrait target: 360–430 CSS px; primary CTA and claim visible before the compact visual.
- Landscape target: 640–932 CSS px; split only when text retains at least 320 CSS px.
- Coarse-pointer targets: at least 44 CSS px for primary actions.
- Mobile default: no continuous WebGL; responsive AVIF/WebP/CSS key frame and full HTML.
- Reduced motion: no camera, floating, particles, parallax, or scroll transition.
- Save-data/low-memory/low-core: no 3D import; show explicit `data-landing-3d-quality` reason.
- Import/init/context failure: canvas is removed or hidden, fallback remains, and no error screen replaces content.
- Provider/network failure is separate from renderer failure; source state remains `Unavailable` or setup-required in HTML.
- Search keyboard: ordinary document flow and submit; no fixed visual control can cover the action.

## Required QA evidence

- Eight named landing test files from the master brief exist and pass.
- Deterministic desktop, tablet, mobile portrait, reduced-motion, and WebGL-disabled visual baselines.
- First-frame shell, one-canvas invariant, scene transition, hidden/offscreen pause, context loss, disposal, route-return, and no-console-error checks.
- Five mount/unmount cycles show no monotonic canvas/listener/animation ownership growth.
- All homepage links and mobile menu pass keyboard/touch navigation.
- Axe reports zero critical violations; canvas remains outside the accessibility tree.
- Initial and lazy chunks pass the existing budget; no threshold is raised.
- Three Lighthouse samples are recorded; median LCP ≤ 2.5 s and CLS ≤ 0.1.
- Human fidelity review compares desktop, portrait, and landscape screenshots against the approved concepts and records only meaning-preserving deviations.

## Approved flexibility and deviations

Allowed without renewed approval: exact primitive dimensions, bounded camera coordinates, CSS spacing within the existing type scale, fewer decorative objects for performance, and using CSS/procedural fallbacks instead of a raster crop when the same hierarchy is preserved.

Not allowed without renewed approval: changing the reading order, hiding HTML status/caveat text, adding fake values, changing the CTA hierarchy, adding multiple canvases, enabling continuous mobile WebGL, introducing decorative ambient particles, visually redesigning product routes, or allowing the canvas to own navigation or exact information.
