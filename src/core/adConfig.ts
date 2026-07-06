export type AdSlotSize = 'leaderboard' | 'rectangle' | 'sidebar' | 'in_feed' | 'mobile_banner';

export interface AdConfig {
  status: 'ok' | 'setup_required';
  ADS_ENABLED: boolean;
  ADSENSE_CLIENT_ID: string;
  ADSENSE_SLOT_LEADERBOARD: string;
  ADSENSE_SLOT_RECTANGLE: string;
  ADSENSE_SLOT_IN_FEED: string;
  SPONSOR_MODE: 'placeholder' | 'enabled';
  message: string;
}

export const placeholderAdConfig: AdConfig = {
  status: 'setup_required',
  ADS_ENABLED: false,
  ADSENSE_CLIENT_ID: '',
  ADSENSE_SLOT_LEADERBOARD: '',
  ADSENSE_SLOT_RECTANGLE: '',
  ADSENSE_SLOT_IN_FEED: '',
  SPONSOR_MODE: 'placeholder',
  message: 'Advertising setup is not configured.',
};

let runtimeConfigPromise: Promise<AdConfig> | null = null;

export function getAdSlotId(config: AdConfig, size: AdSlotSize) {
  if (size === 'in_feed') return config.ADSENSE_SLOT_IN_FEED;
  if (size === 'rectangle' || size === 'sidebar') return config.ADSENSE_SLOT_RECTANGLE;
  return config.ADSENSE_SLOT_LEADERBOARD;
}

export function loadAdConfig() {
  if (runtimeConfigPromise) return runtimeConfigPromise;
  runtimeConfigPromise = fetch('/api/ad-config', { headers: { Accept: 'application/json' } })
    .then(async (response) => {
      const payload = await response.json();
      if (!response.ok || payload?.status !== 'ok') return { ...placeholderAdConfig, message: String(payload?.message || placeholderAdConfig.message) };
      return {
        status: 'ok',
        ADS_ENABLED: payload.ADS_ENABLED === true,
        ADSENSE_CLIENT_ID: String(payload.ADSENSE_CLIENT_ID || ''),
        ADSENSE_SLOT_LEADERBOARD: String(payload.ADSENSE_SLOT_LEADERBOARD || ''),
        ADSENSE_SLOT_RECTANGLE: String(payload.ADSENSE_SLOT_RECTANGLE || ''),
        ADSENSE_SLOT_IN_FEED: String(payload.ADSENSE_SLOT_IN_FEED || ''),
        SPONSOR_MODE: payload.SPONSOR_MODE === 'enabled' ? 'enabled' : 'placeholder',
        message: String(payload.message || 'Advertising configuration loaded.'),
      } satisfies AdConfig;
    })
    .catch(() => placeholderAdConfig);
  return runtimeConfigPromise;
}
