# StockPro UI/UX Motion Upgrade Notes

## Pushed in this GitHub commit

- Premium animated market command-center hero.
- Live metrics for sync status, market breadth, F&O universe count, and active desk.
- Floating motion dock for Screener, Signals, Heatmap, Options, and News.
- Animated page transitions for dashboard routes.
- Global CSS motion system with shimmer, float, soft pulse, glass button shine, premium background glow, custom scrollbar, ticker fade masks, and reduced-motion support.

## Files changed in this pushed commit

- `src/components/Layout.tsx`
- `src/components/MarketPulseHero.tsx`
- `src/components/FloatingMotionDock.tsx`
- `src/index.css`
- `UI_UX_UPGRADE_NOTES.md`

## Build test

`npm run build` completed successfully locally before pushing. The Vite large bundle warning is only a performance warning, not a build failure.

## Extra local ZIP polish not pushed in this commit

The local upgraded ZIP also contains extra polish for `Header.tsx`, `MarketCards.tsx`, `StockChart.tsx`, `StockScreener.tsx`, and `ParticleBackground.tsx`. Push those in a follow-up commit to apply the full ZIP-level UI polish.
