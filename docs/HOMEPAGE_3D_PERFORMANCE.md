# Homepage 3D performance evidence

Date: 2026-07-18

## Delivery budgets

Production build evidence from `node scripts/check-landing-bundle-budget.mjs`:

| Artifact | Measured gzip/asset size | Limit | Result |
| --- | ---: | ---: | --- |
| Initial JavaScript | 92.98 KiB gzip | Baseline + 50 KiB | Pass |
| Lazy `HeroFinancialScene` chunk | 133.35 KiB gzip | 250 KiB gzip | Pass |
| AVIF fallback | 14.20 KiB | 150 KiB | Pass |
| WebP fallback | 31.54 KiB | 150 KiB | Pass |
| PNG fallback | 25.61 KiB | 150 KiB | Pass |

The budget script's recorded pre-redesign initial baseline is 729.59 KiB gzip. The current initial total is 636.61 KiB below that baseline. Three.js remains a delayed dynamic import and is not part of the initial JavaScript total.

## Lighthouse sampling

Lighthouse mobile navigation mode was run three times against the production build on `http://127.0.0.1:4173/`. A persistent isolated Chrome debugging session was used because the bundled LHCI Chrome launcher on Windows completed each audit but then raised `EPERM` while deleting its temporary profile. This changes only process ownership for local measurement; Lighthouse throttling, audits, and project thresholds were unchanged.

| Run | FCP | LCP | CLS | Performance |
| --- | ---: | ---: | ---: | ---: |
| 1 | 1,807.2 ms | 1,981.7 ms | 0 | 71 |
| 2 | 1,492.5 ms | 2,012.0 ms | 0 | 76 |
| 3 | 1,291.1 ms | 1,814.1 ms | 0 | 99 |
| **Median** | **1,492.5 ms** | **1,981.7 ms** | **0** | **76** |

Required limits remain LCP <= 2,500 ms and CLS <= 0.1. The median passes both without changing `lighthouserc.cjs` assertions.

Before the delayed-section split, a fresh three-run homepage median was 2,719.0 ms LCP. Moving provider queries, auth-aware CRT state, product cards, and sections 2-10 out of the initial hero module reduced the built entry chunk from 102.00 KiB to 95.21 KiB gzip after final resilience instrumentation. Optional sections now load immediately on pointer or scroll intent and otherwise wait for a ten-second idle fallback. The provider-backed search client and schemas load only when a visitor focuses or presses the lightweight search field. The resulting fresh median is under budget without hiding content or changing Lighthouse assertions.

## Runtime and regression evidence

- One renderer lease and one canvas across all ten scenes.
- Renderer pauses on document hide and outside the landing story viewport.
- SPA navigation from `/` proves that the renderer forces context loss, removes the canvas, and releases ownership without relying on a document reload.
- WebGL context loss returns to the complete HTML/static fallback.
- Save-data, low-memory, low-core, reduced-motion, mobile portrait, and touch-enabled mobile landscape paths do not create a canvas.
- Repeated candle and module geometry uses instancing; only the active scene graph is created initially and later graphs are created on demand.
- The automated quality contract advertises a 60 FPS target for capable hardware and a 30 FPS target for standard hardware. A visible below-fold control must receive focus, update React scene state, and reach the next frame within a synthetic 200 ms main-thread target; first-scene geometry setup remains below 50 ms. Field INP and sustained device FPS still require preview/production telemetry rather than synthetic claims.
- Reviewed Windows and Ubuntu baselines cover the complete desktop-static, tablet, mobile, reduced-motion, and WebGL-disabled homepages without hiding system-font metric differences. Separate per-platform viewport baselines and a byte comparison prove that the WebGL render differs from the disabled fallback at the unchanged 3% threshold.
- The complete landing matrix passes after the performance split.
