# StockPro 3D and Scrollytelling Best-Practices Contract

Research date: 2026-07-16  
Status: approved implementation contract; see `HOMEPAGE_VISUAL_CONTRACT.md`.

## Renderer decision

### Analytical job and artifact family

- **Job:** explain a product ecosystem, research sequence, provider verification, and security/readiness boundaries.
- **Artifact:** ten-scene explanatory scrollytelling sequence with a single persistent 3D/2.5D research world.
- **Primary route:** Three.js only for spatial grouping, staged transformation, and bounded camera states.
- **Fallback:** semantic HTML plus static responsive key frames; CSS/SVG may express simple boundaries and sequences.

Three.js is justified only where depth helps readers distinguish layers, paths, or boundaries: product constellation, CRT sequence, filter funnel, per-user broker paths, and onboarding journey. Exact values, search, labels, links, statuses, tables, and disclosures remain DOM/HTML because depth adds no analytical value and harms precision/accessibility.

### Explicit non-goals

- no spatial navigation, free orbit, game controls, trading simulation, order placement, or virtual terminal;
- no decorative 3D charts, volumetric price bars, fake candles, or inferred magnitude from object size;
- no independent canvases per scene;
- no particles as “market activity” unless backed by a defined real data unit (none are required for launch);
- no baked-in factual labels or values in raster fallbacks;
- no exact visual claims before the supporting product state is verified.

## Ten-scene evidence-bearing inventory and storyboard

Shared owner for all scenes: one homepage renderer and one scene-state model. Supporting owners: HTML/content, accessibility, performance, and test passes. All scene briefs use a **local fresh Three.js + scrollytelling + accessibility pass**; implementation was authorized by the user's `approve all` response on 2026-07-16.

| Scene | Story job and evidence | 3D / visual layer | HTML proof and action | Motion verb and named state | Static / reduced-motion fallback | Must not imply | QA acceptance |
|---:|---|---|---|---|---|---|---|
| 1. Research universe | Establish that StockPro organizes several research tools around one user journey. Evidence is the real route taxonomy, not a market claim. | Schematic candlestick forms, chart planes, scanner ring, CRT range, broker node, and route paths orbit a restrained research core. Objects have no numeric scale. | H1, support copy, provider disclosure, educational/no-trade disclaimer, search/readiness, Open Screener, Run CRT Scanner, Explore Pro, Connect Broker. | **Assemble**: dispersed labelled categories settle into an overview; camera state `overview`. | One wide key frame with generous label-safe area; mobile uses a cropped-but-recomposed vertical key frame, not a desktop crop. | Price direction, activity volume, guaranteed coverage, or a live market. | H1 and primary CTA paint before canvas; no values in geometry; canvas hidden from AT. |
| 2. Verified market source | Explain that data requires a provider and timestamp, and unavailability is honest. | Provider gateway, timestamp ring, index nodes, verification path, neutral unavailable shield. Ring progress is state-based, never decorative time. | Provider name/status, last-updated text, live/delayed/cached/partial/unavailable label, verified values only when supplied by existing APIs. | **Verify**: a path connects only after a real ready state; camera `source-gateway`. | Diagram with labelled provider → verification → HTML data boundary; unavailable variant shown as neutral closed path. | Current prices, uptime, provider partnership, or “live” from green glow. | Force unavailable/provider-required fixtures; zero numeric placeholders; closure and outage remain distinguishable. |
| 3. Product constellation | Help visitors scan the ten real product routes and prerequisites. | Ten spatial modules grouped by discover, analyze, save, and connect; focus increases local depth/outline only. | Semantic list of links: Screener, Scanner, CRT Scanner, Option Chain, Signals, Heatmap, News, Daily Brief, Pro, Broker Connect; setup state per link. | **Organize**: modules group by task; camera `product-map`. | Responsive link grid plus a simple constellation key frame; no route depends on image-map hit testing. | Equal readiness, live availability, or that proximity means recommendation. | Tab order matches DOM; focus visibly maps to one object; every link route is testable without canvas. |
| 4. CRT range laboratory | Teach the method sequence without prices: range → sweep → close inside → confirmation → completion. | Generic candles and labelled planes for reference, trigger, invalidation, target; geometry is schematic and consistently scaled. | Ordered definitions, Forming/Confirmed/Completed CRT, supported timeframes, manual-run and login/provider readiness, Run CRT Scanner. | **Reveal**: stepwise state sequence `range`, `sweep`, `close`, `confirm`, `complete`; no continuous trading loop. | Five annotated still states or one ordered SVG/HTML diagram. | A real setup, forecast, target probability, recommendation, or guaranteed completion. | No price axis/number; reverse/fast-scroll lands on valid state; all five meanings available in text. |
| 5. Pro research workspace | Explain capability categories and onboarding, not outcomes. | Dimensional but abstract panels: chart, watchlist, saved work, screener, explorer, AI research, onboarding path. | Capability list, setup state, no fabricated returns/ideas/answers/counts, Explore Pro. | **Arrange**: panels move from overview to a clear workflow; camera `workspace`. | Static isometric/orthographic workspace with no fake UI values; HTML capability list remains primary. | A working live dashboard, populated account, AI quality, or existing saved items. | No sample values; focus/hover does not expose hidden essential information. |
| 6. Secure broker vault | Clarify boundaries, per-user isolation, provider-specific readiness, and no trade execution. | Central encrypted-store metaphor, isolated user paths, Upstox/Dhan/Angel One nodes, browser/server boundaries, explicit no-trading shield. | Login/setup/sandbox/live-readiness/approval-pending states; provider names only as actual integrations; own-broker and no-trade text; Connect Broker. | **Isolate**: paths separate at the server boundary; camera `broker-boundary`. | Labelled boundary diagram; dashed setup paths, solid verified path only when state supports it. | Certification, guaranteed security, broker partnership, shared token, or connected state. | Each provider fixture produces correct text/style; no secret/token data enters client visual attributes or analytics. |
| 7. Screener data funnel | Show that results emerge from explicit filter layers and provider-backed data. | Market universe passes through fundamental, technical, volume, trend, sector, price, and conditional OI/PCR layers into a result plane. | Available filters, provider dependency, result count/list only from verified execution, Open Screener. | **Filter**: layers engage discretely; camera `funnel`. | Layered funnel diagram plus filter list; result plane says no result, unavailable, or real output as appropriate. | Matched stocks, rankings, selectivity, or OI/PCR availability when not supplied. | Empty/unavailable/partial/results states tested; no dots whose count implies stocks unless data-bound. |
| 8. Personal research vault | Explain which artifacts can be saved and that personal state requires authentication. | Abstract drawers for watchlists, saved stocks, screeners, research, price alerts, CRT alerts, email readiness. | Real user data when authenticated; logged-out `login_required`; no invented counts; create/sign-in and relevant routes. | **Store**: empty labelled containers become available after authenticated state, never pre-filled decoratively. | HTML feature list with lock/setup states and a neutral empty-vault key frame. | Existing saved items, email delivery, active alerts, or secure state beyond validated architecture. | Logged-out fixture has zero personal data; AT reading order names prerequisite before actions. |
| 9. Trust and transparency core | Summarize provider verification, isolation, encryption-at-rest design claim only if documented, monitoring, timestamps, and no-trading boundary. | Layered schematic: provider → timestamp → server boundary → per-user storage → monitoring → no-trade perimeter. | Plain-language trust ledger with evidence/status links; limitations and unavailable states; no unsupported certifications. | **Audit**: layers illuminate one by one as their HTML evidence is introduced; camera `trust-layers`. | Numbered architecture diagram and expandable evidence notes. | External audit, certification, SEBI registration, zero risk, or guaranteed security. | Every visual trust claim maps to a documented state/source; unsupported layer is removed, not softened. |
| 10. Getting-started journey | Make beta onboarding finite, honest, and route-based. | Seven-step spatial path: create account, verify email, connect own broker, create watchlist, manual CRT scan, open Pro, create alert. | Ordered list with real routes, prerequisite/readiness text, Create account/Open Screener next action. | **Progress**: camera follows a labelled path only as scenes enter; completion comes from real state or remains unfilled. | Vertical ordered stepper; all links normal anchors/buttons; no motion required. | That all integrations are ready, that broker connect is mandatory for all research, or that completion earns trading benefits. | All routes valid; skipped/unavailable steps remain understandable; no automatic completion animation from page scroll alone. |

### First and final frames

- **First frame:** a quiet, incomplete research system with the HTML hero already readable. It proves the page is useful before WebGL.
- **Final frame:** the same system organized into a seven-step research path surrounded by a visible no-trading boundary. It proves orientation, not investment outcome.
- **Motion purpose:** assemble, verify, organize, reveal, arrange, isolate, filter, store, audit, progress. No scene uses “spin,” “sparkle,” or “drift” as its explanatory verb.

## HTML/renderer ownership boundary

| HTML/DOM owns | WebGL owns |
|---|---|
| Headings, copy, routes, buttons, forms, focus, status, provider name, timestamps, values, tables, disclaimers, legal claims, error and empty states. | Procedural geometry, bounded camera pose, scene transition, decorative depth, selected/focused object reflection, and static-key-frame composition. |

The HTML scene state may drive visual state. Visual state must never create or override product truth. No sensitive or personal payload is copied into mesh names, debug panels, URLs, logs, or analytics.

## One-renderer lifecycle contract

### Boot order

1. Render and hydrate essential HTML; reserve visual dimensions to prevent layout shift.
2. Wait until page load or an idle opportunity after the initial paint.
3. Check reduced motion, save-data hint, viewport, device capability hints, WebGL support, and existing renderer ownership.
4. Mobile/low-power defaults to static fallback. Capability hints are advisory; failure always degrades cleanly.
5. Lazy-import the 3D chunk only when the enhanced tier is eligible. Do not preload the full chunk.
6. Create exactly one renderer/canvas for `/`; guard against React development double-mount and duplicate initialization.
7. Signal `render-ready` only after the first valid frame; until then the static fallback remains visible.
8. Replace the fallback without changing layout, focus, or the page’s accessible tree.

### Runtime

- Scene states are declarative (`sceneId`, named camera pose, visible groups, selected object, motion enabled) rather than raw scroll percentages scattered through components.
- Use native scroll and `IntersectionObserver`/step thresholds. Do not read layout and write styles repeatedly inside the same frame.
- Cap frame delta after tab resume; avoid simulation catch-up.
- Pause when `document.hidden`, canvas is outside the visual field, route is inactive, reduced motion becomes active, or context is lost.
- On capable desktop target 60 fps; medium devices target stable 30 fps. Stability is preferred to nominal 60 fps.
- Render on demand when idle states do not need continuous motion. Gentle hero drift is optional and must stop after inactivity or when outside the hero.

### Teardown

Cancel animation frames and idle callbacks; disconnect observers; remove pointer/resize/visibility/context listeners; remove scene objects; dispose geometries, materials, textures, render targets, post-processing passes, controls, and renderer; close `ImageBitmap` sources where used; clear application references; remove canvas; verify no second context survives route return.

Use `renderer.info` before/after repeated mount cycles as a diagnostic, recognizing that Three.js may retain reusable internal resources. Test actual growth across cycles rather than requiring every counter to reach zero.

## GPU and page budgets

Mandatory project budgets are design inputs:

- LCP ≤ 2.5 s; CLS ≤ 0.1; INP target ≤ 200 ms.
- One active WebGL context.
- 3D lazy chunk target ≤ 250 KiB gzip.
- Each fallback image target ≤ 150 KiB.
- Stable 60 fps on capable desktop and 30 fps on medium devices.
- No continuous WebGL by default on low-end mobile.
- Zero long tasks caused by unnecessary scene setup.

Recommended scene constraints for concept review (to validate, not silently raise):

- procedural primitives and shared geometries/materials before external models;
- instancing for repeated candles/nodes; no per-object DOM labels;
- cap DPR (initial recommendation: 1.5 desktop, 1.25 medium; static on low tier) and size the drawing buffer to the visual slot, not the whole page when unnecessary;
- one dominant key light, one soft fill/environment contribution, no numerous dynamic lights;
- no large dynamic shadow map; prefer baked/contact cues or a small static shadow target;
- minimal transparent overlap, restrained bloom or none, no expensive depth-of-field, motion blur, screen-space reflections, or film effects;
- no uncompressed large textures; prefer procedural materials and optimized AVIF/WebP fallbacks;
- avoid synchronous GPU readbacks and production `getError` loops; batch draw calls and attribute updates;
- particle count default zero unless a later approved evidence mapping exists.

## Capability and fallback tiers

| Tier | Eligibility | Experience |
|---|---|---|
| A — capable desktop | WebGL supported, motion allowed, adequate viewport, no save-data, successful frame-budget probe | One renderer, bounded camera transitions, on-demand or low-intensity motion. |
| B — medium/tablet | WebGL supported but tighter power/thermal budget | Lower DPR/instance count, no reflections/post-processing, discrete transitions at 30 fps or render-on-demand. |
| C — mobile/low power | Narrow/coarse pointer, low hints, save-data, thermal/battery concern, or preference | Static responsive key frames by default; optional manual “Enable interactive visual” only if product decides it is worthwhile. |
| D — reduced motion | `prefers-reduced-motion: reduce` | No camera, float, particles, parallax, or scroll animation; stacked still frames and HTML sequence. |
| E — failure/offline | import, asset, context, or provider failure | Complete HTML + local fallback; provider data preserves honest stale/unavailable state separately from renderer state. |

Do not treat `deviceMemory`, `hardwareConcurrency`, `saveData`, or network APIs as definitive. They are incomplete hints; conservative default and runtime failure handling are required.

## Accessibility contract

- Canvas is decorative/supporting: `aria-hidden=true`, not keyboard-focusable, and never contains the only information.
- Scene sections have real headings and visible summaries. A long description explains the schematic meaning and limitation of each scene.
- Keyboard navigation follows HTML. Focus may highlight a corresponding object but never triggers a large camera move.
- No hover-only values. Coarse pointer uses tap/focus and ordinary links; hit areas target 44–48 CSS px when space allows.
- Reduced motion produces zero camera movement, floating, particle movement, or scroll-driven transition.
- Color is redundant with label, icon, line style, and state text. Verify grayscale and color-deficiency resilience.
- Live-data announcements are throttled and user-relevant; do not announce every tick.
- Static screenshot, print, and screen-reader paths preserve claim, source/status, caveat, and CTA.
- Fast scroll, reverse scroll, browser zoom, 200% text zoom, keyboard-only, screen reader, high contrast, and context-loss paths require QA.

## Performance and lifecycle QA gates

1. Hero HTML is visible before any Three.js request/parse/initialization.
2. Full 3D chunk is absent from initial preload and initial route-critical bundle.
3. Layout space is reserved; renderer swap causes no measurable scene-related CLS.
4. Exactly one canvas/context exists through React development double-mount, route changes, and back navigation.
5. Hidden/offscreen scenes stop rendering; resumption does not jump or run catch-up work.
6. Five repeated mount/unmount cycles show no monotonic growth in tracked scene resources/listeners/animation loops.
7. Simulated context loss replaces the current scene with a fallback and keeps content/actions operable.
8. Reduced motion, save-data, low-tier hints, and WebGL-disabled tests never request continuous animation.
9. Median of at least three Lighthouse runs meets existing thresholds; thresholds are not weakened.
10. Axe reports zero critical violations; manual keyboard and screen-reader checks verify the canvas is not the information path.
11. Desktop, tablet, mobile portrait, reduced-motion, and WebGL-disabled visual baselines preserve the same reading hierarchy.
12. No fake market value, broker state, CRT result, personal count, provider status, or trust claim appears in visual fixtures.

## Art-direction QA

Reject a concept if it contains any of the following without a precise evidence mapping:

- broad translucent ribbons, nebulae, bokeh/orbs, stock-photo haze, cinematic wallpaper, random star fields;
- one-hue neon drama, constant rotation, flashing, large camera sweeps, or pulsing everything;
- chart wallpaper, fake dashboards, random candlesticks that look like real prices, or unlabeled data particles;
- glowing vaults that imply certification/security without adjacent verified text;
- depth that changes apparent magnitude or hides labels/actions;
- a mobile design that is only a crop or squeezed desktop composition.

Original StockPro visual grammar: **range, layer, gate, path, boundary, container, and state**. Each mark is procedural and schematic; HTML supplies the truth.

## Primary technical and accessibility sources

- MDN, WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
- Three.js, cleanup: https://threejs.org/manual/en/cleanup.html
- Three.js, disposal guidance: https://threejs.org/manual/en/how-to-dispose-of-objects.html
- Three.js, renderer disposal API: https://threejs.org/docs/pages/Renderer.html
- MDN, Page Visibility API: https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
- MDN, Intersection Observer API: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
- MDN, `webglcontextlost`: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextlost_event
- W3C WAI, WCAG 2.2 animation from interactions: https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions
- web.dev, web performance guidance: https://web.dev/performance
- web.dev, effective Core Web Vitals improvements: https://web.dev/articles/top-cwv
- Highcharts accessibility module (pattern reference): https://www.highcharts.com/docs/accessibility/accessibility-module

## Approval record

Desktop, mobile portrait, and mobile landscape concepts were generated and presented. Their approved frames are recorded in `HOMEPAGE_VISUAL_CONTRACT.md` and are the semantic contract for hierarchy, label-safe regions, camera states, mobile continuation, color roles, and fallbacks. Material deviations require renewed approval.

Current approval status: **APPROVED on 2026-07-16 - implementation authorized**.
