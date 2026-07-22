# Removed Homepage 2D Assets

Audit date: 2026-07-16  
Route scope: `/` and its existing `/landing` alias only

## Removal result

The former homepage mixed one hero-only WebGL canvas with ten animated inline SVG illustrations. The approved implementation replaces that split visual system with one persistent ten-state renderer plus static CSS-perspective key frames for fallbacks. No shared product chart, icon, logo, legal symbol, route icon, or application-page animation was removed.

| Removed file | Previous role | Evidence for removal | Replacement |
|---|---|---|---|
| `src/components/landing3d/SectionVisual.tsx` | Ten inline SVG line illustrations | All imports removed from the two homepage component files; no non-homepage consumer. | `LandingSceneFallback.tsx` and the single renderer. |
| `src/styles/section-visuals.css` | SVG pulse animation and section styling | Only imported by removed homepage visual components. | Static perspective rules in `landing-story.css`. |
| `src/components/ParticleBackground.tsx` | Old standalone particle canvas | No application import; depended only on its dedicated low-power hook. | No ambient particle background. |
| `src/hooks/useReducedMotionOrLowPower.ts` | Power hint for the unused particle canvas | Only imported by the removed particle component. | `useLanding3DQuality.ts` is the single capability policy. |
| `public/landing-3d-elements.js` | Historical DOM visual patch | Not loaded by `index.html`, Vite, or route code. | Typed React scene integration. |
| `public/landing-copy-cleanup.js` | Historical landing copy patch | Not loaded by `index.html`, Vite, or route code. | Source-controlled React copy. |
| `public/landing-hero-clean-fix.css` | Historical landing CSS patch | Not loaded by `index.html` or route code. | `landing-story.css`. |
| `public/landing-layer-fix.css` | Historical layer CSS patch | Not loaded by `index.html` or route code. | `landing-story.css`. |
| `public/landing-ultra-upgrade.css` | Historical broad landing override | Not loaded by `index.html` or route code. | Scoped `#landing-page` styles. |

## Preserved assets and code

- Lucide interface icons, the StockPro wordmark, accessibility semantics, and ordinary route icons.
- Lightweight Charts and all product/application chart components.
- Motion used by protected application pages.
- The AVIF/WebP/PNG hero fallback set.
- Non-homepage route-specific scanner, option-chain, and navigation assets.
- Existing product pages, route components, layout, business logic, data providers, and API responses.

## Verification

- `rg` must find no source import of any removed component, hook, script, or stylesheet.
- `npm run typecheck`, `npm run build`, route smoke, homepage link smoke, and the full application test suite must pass.
- Source-scope review must show no visual edits under protected application pages.
