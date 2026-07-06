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

export const proFeatureDetails: Record<ProFeature, { name: string; description: string }> = {
  saved_screens: {
    name: 'Saved screens',
    description: 'Keep reusable screening setups after account access rules are connected.',
  },
  expanded_watchlist: {
    name: 'Expanded watchlist',
    description: 'Follow a larger research list without changing the useful free watchlist.',
  },
  alerts: {
    name: 'Research alerts',
    description: 'Receive future screen and price observations after alert delivery is verified.',
  },
  exports: {
    name: 'Advanced exports',
    description: 'Unlock richer export workflows while basic free export previews remain available.',
  },
  advanced_research: {
    name: 'Advanced research',
    description: 'Use deeper educational analytics once Premium access controls are ready.',
  },
};

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
