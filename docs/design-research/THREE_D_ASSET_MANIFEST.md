# StockPro Homepage 3D Asset Manifest

Audit date: 2026-07-16  
Route: `/` and its existing `/landing` alias  
Asset policy: original procedural work only; no competitor screenshot, external model, texture, stock image, or market-data asset

## Raster fallback assets

| Asset | Source / author | Licence | Purpose | Size | Fallback chain | Optimization result |
|---|---|---|---|---:|---|---|
| `public/assets/landing3d/stockpro-financial-research.avif` | `scripts/generate-landing-3d-assets.py`; StockPro project | Original project asset; repository licence applies | Primary hero/static research-world key frame | 14,542 B | First `<picture>` source | Below 150 KiB budget |
| `public/assets/landing3d/stockpro-financial-research.webp` | Same | Same | Broad-browser static fallback | 32,292 B | Second `<picture>` source | Below 150 KiB budget |
| `public/assets/landing3d/stockpro-financial-research.png` | Same | Same | Final and no-modern-codec fallback | 26,221 B | `<img>` fallback | Below 150 KiB budget |

The generator uses deterministic geometric primitives and carries no factual label, price, security name, broker connection, result, return, or user data.

## Procedural runtime assets

| Source | Author / licence | Route and purpose | Runtime cost | Static fallback | Optimization |
|---|---|---|---|---|---|
| `src/components/landing3d/HeroFinancialScene.ts` | StockPro project; repository licence | One ten-state WebGL research world | One lazily imported Three.js context | Responsive raster plus scene-specific CSS key frame | Shared primitives/materials, bounded DPR, no external model, no post-processing |
| `src/components/landing3d/LandingSceneFallback.tsx` | StockPro project; repository licence | Static semantic key frame for each approved scene | DOM/CSS only; no animation loop | It is the fallback | Reuses one small element vocabulary across ten scene IDs |
| `src/styles/landing-story.css` | StockPro project; repository licence | Desktop, tablet, portrait, and landscape composition | Scoped CSS only | Full HTML experience | No remote font/image dependency; reserved dimensions prevent layout shift |

## Ten scene purposes

1. Research universe: schematic research objects around one core.
2. Verified source: provider gate, timestamp/source boundary, unavailable shield.
3. Product constellation: ten route modules grouped by research job.
4. CRT laboratory: generic non-numeric range/sweep/close/confirm/complete sequence.
5. Pro workspace: empty abstract research panels; no populated account state.
6. Broker vault: browser/server/per-user boundaries and no-trading shield.
7. Screener funnel: filter layers leading to an empty/provider-backed result plane.
8. Personal vault: empty authenticated containers and login prerequisite.
9. Trust core: documented provider, timestamp, storage, monitoring, and no-trade layers.
10. Getting started: seven real route steps; scroll never marks completion.

## Effect semantics

- Blue outline: active research path or current scene, never magnitude.
- Cyan path: verified/source path only when HTML application state supports verification.
- Amber outline: setup, approval, dependency, or illustrative plane; never a price signal.
- Particles default to zero. Any verification packet is fixed schematic styling, appears only in a verified state, and never represents quotes, orders, volume, money, or users.
- Depth represents layer, boundary, gate, path, or container—not value.

## Asset QA

- Each raster file is automatically checked against the 150 KiB limit.
- The lazy 3D chunk is checked against 250 KiB gzip.
- Reduced-motion, mobile, save-data, low-memory, low-core, unsupported-WebGL, import-failure, and context-loss modes keep the static path.
- Every exact label and product state remains editable HTML; the visual is `aria-hidden` and non-focusable.
