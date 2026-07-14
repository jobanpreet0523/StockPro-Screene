export const SAFE_ANALYTICS_EVENTS = [
  'landing_visit',
  'pricing_click',
  'start_trial_click',
  'trial_click',
  'contact_submit',
  'connect_broker_click',
  'waitlist_submit',
  'crt_scan_click',
  'pro_tab_click',
  'route_load_error',
  'signup',
  'crt_scan_run',
  'watchlist_created',
  'alert_created',
] as const;

export type SafeAnalyticsEvent = typeof SAFE_ANALYTICS_EVENTS[number];
type PostHogClient = typeof import('posthog-js')['default'];

let client: PostHogClient | null = null;
let loading: Promise<PostHogClient | null> | null = null;

function config() {
  const enabled = String(import.meta.env.VITE_ANALYTICS_ENABLED || '').toLowerCase() === 'true';
  const key = String(import.meta.env.VITE_POSTHOG_KEY || '').trim();
  return { enabled, key };
}

async function loadPostHog() {
  const { enabled, key } = config();
  if (!enabled || !key) return null;
  if (client) return client;
  if (loading) return loading;

  loading = import('posthog-js').then(({ default: posthog }) => {
    posthog.init(key, {
      api_host: String(import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'),
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      persistence: 'memory',
      person_profiles: 'never',
      loaded(instance) {
        instance.opt_in_capturing();
      },
    });
    client = posthog;
    return posthog;
  }).catch(() => null);

  return loading;
}

export async function initPostHog() {
  return Boolean(await loadPostHog());
}

export function captureSafeEvent(event: SafeAnalyticsEvent, path = window.location.pathname) {
  if (!SAFE_ANALYTICS_EVENTS.includes(event)) return;
  void loadPostHog().then((posthog) => {
    posthog?.capture(event, { path: path.slice(0, 300) });
  });
}

export function posthogReadiness() {
  if (!config().enabled) return 'disabled' as const;
  return config().key ? 'configured' as const : 'setup_required' as const;
}
