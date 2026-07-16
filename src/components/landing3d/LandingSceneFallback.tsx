export type LandingSceneId =
  | 'research-universe'
  | 'verified-source'
  | 'product-constellation'
  | 'crt-laboratory'
  | 'pro-workspace'
  | 'broker-vault'
  | 'screener-funnel'
  | 'personal-vault'
  | 'trust-core'
  | 'getting-started';

const sceneLabels: Record<LandingSceneId, string> = {
  'research-universe': 'Research universe',
  'verified-source': 'Verified source gateway',
  'product-constellation': 'Product research constellation',
  'crt-laboratory': 'CRT range laboratory',
  'pro-workspace': 'Pro research workspace',
  'broker-vault': 'Per-user broker vault',
  'screener-funnel': 'Screener data funnel',
  'personal-vault': 'Personal research vault',
  'trust-core': 'Trust and transparency core',
  'getting-started': 'Getting-started journey',
};

export default function LandingSceneFallback({ scene }: { scene: LandingSceneId }) {
  return (
    <div
      className="landing-scene-fallback"
      data-landing-static-scene={scene}
      data-testid={`landing-static-${scene}`}
      aria-hidden="true"
    >
      <div className="landing-scene-fallback__frame">
        <span className="landing-scene-fallback__plane landing-scene-fallback__plane--back" />
        <span className="landing-scene-fallback__plane landing-scene-fallback__plane--front" />
        <span className="landing-scene-fallback__ring landing-scene-fallback__ring--outer" />
        <span className="landing-scene-fallback__ring landing-scene-fallback__ring--inner" />
        <span className="landing-scene-fallback__path" />
        <span className="landing-scene-fallback__node landing-scene-fallback__node--a" />
        <span className="landing-scene-fallback__node landing-scene-fallback__node--b" />
        <span className="landing-scene-fallback__node landing-scene-fallback__node--c" />
        <span className="landing-scene-fallback__bar landing-scene-fallback__bar--a" />
        <span className="landing-scene-fallback__bar landing-scene-fallback__bar--b" />
        <span className="landing-scene-fallback__bar landing-scene-fallback__bar--c" />
        <span className="landing-scene-fallback__core" />
      </div>
      <span className="landing-scene-fallback__label">{sceneLabels[scene]}</span>
    </div>
  );
}
