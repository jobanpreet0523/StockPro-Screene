export type PlanTier = 'free' | 'pro' | 'premium';

export type ProFeature =
  | 'saved_screens'
  | 'expanded_watchlist'
  | 'alerts'
  | 'exports'
  | 'advanced_research';

export interface AccessCheck {
  allowed: boolean;
  reason: string;
  upgradePath: string;
}

const freeFeatures = new Set<ProFeature>();
const proFeatures = new Set<ProFeature>(['saved_screens', 'expanded_watchlist', 'alerts', 'exports']);
const premiumFeatures = new Set<ProFeature>(['saved_screens', 'expanded_watchlist', 'alerts', 'exports', 'advanced_research']);

export function canUseFeature(plan: PlanTier, feature: ProFeature): AccessCheck {
  const allowed = plan === 'premium'
    ? premiumFeatures.has(feature)
    : plan === 'pro'
    ? proFeatures.has(feature)
    : freeFeatures.has(feature);

  return {
    allowed,
    reason: allowed ? 'Feature available for this plan.' : 'This feature is gated until Pro access is enabled.',
    upgradePath: `/contact?interest=${feature}`,
  };
}

export function isPaidAccessReady() {
  return false;
}
