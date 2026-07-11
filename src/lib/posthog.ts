import posthog from 'posthog-js';

export const SAFE_ANALYTICS_EVENTS = [
  'landing_visit',
  'pricing_click',
  'start_trial_click',
  'connect_broker_click',
  'waitlist_submit',
  'crt_scan_click',
  'pro_tab_click',
  'route_load_error',
] as const;

export type SafeAnalyticsEvent = typeof SAFE_ANALYTICS_EVENTS[number];
let initialized = false;

export function initPostHog() {
  if (initialized) return true;
  const enabled = String(import.meta.env.VITE_ANALYTICS_ENABLED || '').toLowerCase() === 'true';
  const key = String(import.meta.env.VITE_POSTHOG_KEY || '').trim();
  if (!enabled || !key) return false;

  posthog.init(key, {
    api_host: String(import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com'),
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
  initialized = true;
  return true;
}

export function captureSafeEvent(event: SafeAnalyticsEvent, path = window.location.pathname) {
  if (!initialized || !SAFE_ANALYTICS_EVENTS.includes(event)) return;
  posthog.capture(event, { path: path.slice(0, 300) });
}

export function posthogReadiness() {
  if (String(import.meta.env.VITE_ANALYTICS_ENABLED || '').toLowerCase() !== 'true') return 'disabled' as const;
  return String(import.meta.env.VITE_POSTHOG_KEY || '').trim() ? 'configured' as const : 'setup_required' as const;
}
