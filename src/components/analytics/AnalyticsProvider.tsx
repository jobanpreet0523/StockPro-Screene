import { type ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { captureSafeEvent, initPostHog, type SafeAnalyticsEvent } from '../../lib/posthog';
import { captureRouteError, initSentry } from '../../lib/sentry';

const explicitEventMap: Record<string, SafeAnalyticsEvent> = {
  pricing_click: 'pricing_click',
  trial_cta_click: 'start_trial_click',
  start_trial_click: 'start_trial_click',
  trial_click: 'trial_click',
  broker_connect_click: 'connect_broker_click',
  connect_broker_click: 'connect_broker_click',
  waitlist_submit: 'waitlist_submit',
  crt_scan_click: 'crt_scan_click',
  pro_tab_click: 'pro_tab_click',
  signup: 'signup',
  crt_scan_run: 'crt_scan_run',
  watchlist_created: 'watchlist_created',
  alert_created: 'alert_created',
};

function eventForTarget(target: HTMLElement): SafeAnalyticsEvent | null {
  const explicit = target.getAttribute('data-analytics-event') || '';
  if (explicitEventMap[explicit]) return explicitEventMap[explicit];

  const href = target instanceof HTMLAnchorElement ? target.getAttribute('href') || '' : '';
  if (href.startsWith('/pricing')) return 'pricing_click';
  if (href.startsWith('/start-trial')) return 'trial_click';
  if (href.startsWith('/connect-broker')) return 'connect_broker_click';
  if (href.startsWith('/pro')) return 'pro_tab_click';
  return null;
}

export default function AnalyticsProvider({ children }: { children: ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    initSentry();
    initPostHog();
  }, []);

  useEffect(() => {
    if (location.pathname === '/') captureSafeEvent('landing_visit', '/');
  }, [location.pathname]);

  useEffect(() => {
    const clickHandler = (event: MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('a,button');
      if (!target) return;
      const safeEvent = eventForTarget(target);
      if (safeEvent) captureSafeEvent(safeEvent);
    };
    const customHandler = (event: Event) => {
      const name = String((event as CustomEvent<{ name?: string }>).detail?.name || '');
      const safeEvent = explicitEventMap[name];
      if (safeEvent) captureSafeEvent(safeEvent);
    };
    const errorHandler = (event: ErrorEvent) => {
      captureRouteError(event.error || new Error(event.message), window.location.pathname);
      captureSafeEvent('route_load_error');
    };
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      captureRouteError(event.reason, window.location.pathname);
      captureSafeEvent('route_load_error');
    };

    document.addEventListener('click', clickHandler);
    window.addEventListener('stockpro:analytics', customHandler);
    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);
    return () => {
      document.removeEventListener('click', clickHandler);
      window.removeEventListener('stockpro:analytics', customHandler);
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  return children;
}
