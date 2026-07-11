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
  'screener_preset_selected',
  'screener_filters_applied',
  'screener_csv_exported',
  'watchlist_item_toggled',
  'stock_chart_opened',
  'option_chain_opened',
  'lead_pdf_subscribed',
  'trial_form_submitted',
  'stock_searched',
  'affiliate_link_clicked',
  'login_session_checked',
  'signup_session_checked',
] as const;

export type SafeAnalyticsEvent = typeof SAFE_ANALYTICS_EVENTS[number];
let initialized = false;

export function initPostHog() {
  if (initialized) return true;
  const enabled = String(import.meta.env.VITE_ANALYTICS_ENABLED || '').toLowerCase() === 'true';
  const key = String(import.meta.env.VITE_POSTHOG_KEY || '').trim();
  if (!enabled || !key) return false;

  posthog.init(key, {
    api_host: String(import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'),
    defaults: '2026-05-30',
    capture_pageview: false,
    person_profiles: 'identified_only',
  });
  initialized = true;
  return true;
}

export function captureSafeEvent(event: SafeAnalyticsEvent, path = window.location.pathname) {
  if (!initialized || !SAFE_ANALYTICS_EVENTS.includes(event)) return;
  posthog.capture(event, { path: path.slice(0, 300) });
}

export function posthogIdentify(userId: string, traits?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.identify(userId, traits);
}

export function posthogReset() {
  if (!initialized) return;
  posthog.reset();
}

export function posthogReadiness() {
  if (String(import.meta.env.VITE_ANALYTICS_ENABLED || '').toLowerCase() !== 'true') return 'disabled' as const;
  return String(import.meta.env.VITE_POSTHOG_KEY || '').trim() ? 'configured' as const : 'setup_required' as const;
}
