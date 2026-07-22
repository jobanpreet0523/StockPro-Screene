import type { LandingSceneId } from './landingSceneContract';

export default function Hero3DFallback({ activeScene = 'research-universe' }: { activeScene?: LandingSceneId }) {
  return (
    <picture
      className="landing-3d-fallback"
      data-testid="landing-3d-fallback"
      data-landing-fallback-scene={activeScene}
      aria-hidden="true"
    >
      <source srcSet="/assets/landing3d/stockpro-financial-research.avif" type="image/avif" />
      <source srcSet="/assets/landing3d/stockpro-financial-research.webp" type="image/webp" />
      <img
        src="/assets/landing3d/stockpro-financial-research.png"
        alt=""
        width="1280"
        height="800"
        decoding="async"
        fetchPriority="high"
      />
    </picture>
  );
}
