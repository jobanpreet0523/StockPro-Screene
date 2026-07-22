export const landingSceneIds = [
  'research-universe', 'verified-source', 'product-constellation', 'crt-laboratory',
  'pro-workspace', 'broker-vault', 'screener-funnel', 'personal-vault', 'trust-core', 'getting-started',
] as const;

export type LandingSceneId = (typeof landingSceneIds)[number];
export type LandingMotion = 'full' | 'stepped' | 'static';
export type LandingSceneState = {
  id: LandingSceneId;
  active: boolean;
  focusedModule?: string;
  providerVerified: boolean;
  motion: LandingMotion;
};
export type LandingCameraPose = {
  name: `${LandingSceneId}-camera`;
  position: readonly [number, number, number];
  target: readonly [number, number, number];
};
export type LandingSceneDefinition = { id: LandingSceneId; index: number; camera: LandingCameraPose };

const cameraPositions: Record<LandingSceneId, readonly [number, number, number]> = {
  'research-universe': [8.8, 6.2, 11.8], 'verified-source': [7.4, 4.8, 10.8],
  'product-constellation': [0, 8.4, 12.4], 'crt-laboratory': [8.2, 4.2, 10.2],
  'pro-workspace': [7.6, 7.1, 12.8], 'broker-vault': [8.6, 4.4, 10.7],
  'screener-funnel': [7.8, 5.9, 11.6], 'personal-vault': [7.2, 4.8, 10.2],
  'trust-core': [8.4, 6.4, 11.9], 'getting-started': [6.4, 7.4, 12.8],
};
export const landingSceneDefinitions: readonly LandingSceneDefinition[] = landingSceneIds.map((id, index) => ({
  id, index, camera: { name: `${id}-camera`, position: cameraPositions[id], target: [0, 0.8, 0] },
}));
const sceneIdSet = new Set<string>(landingSceneIds);
export function isLandingSceneId(value: string | undefined): value is LandingSceneId {
  return typeof value === 'string' && sceneIdSet.has(value);
}

let activeRendererLease: symbol | null = null;
export function acquireLandingRendererLease(): symbol | null {
  if (activeRendererLease) return null;
  activeRendererLease = Symbol('stockpro-landing-renderer');
  return activeRendererLease;
}
export function releaseLandingRendererLease(lease: symbol | null) {
  if (lease && activeRendererLease === lease) activeRendererLease = null;
}
