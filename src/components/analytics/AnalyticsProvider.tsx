import { type ReactNode, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { captureSafeEvent, initPostHog, posthogIdentify, posthogReset, type SafeAnalyticsEvent } from '../../lib/posthog';
import { captureRouteError, initSentry } from '../../lib/sentry';
import { useAuth } from '../../contexts/AuthContext';

const explicitEventMap: Record<string, SafeAnalyticsEvent> = {
  pricing_click: 'pricing_click',
  trial_cta_click: 'start_trial_click',
  start_trial_click: 'start_trial_click',
  broker_connect_click: 'connect_broker_click',
  connect_broker_click: 'connect_broker_click',
  waitlist_submit: 'waitlist_submit',
  crt_scan_click: 'crt_scan_click',
  pro_tab_click: 'pro_tab_click',
  login_cta_click: 'login_session_checked',
  signup_cta_click: 'signup_session_checked',
  affiliate_click: 'affiliate_link_clicked',
};

function eventForTarget(target: HTMLElement): SafeAnalyticsEvent | null {
  const explicit = target.getAttribute('data-analytics-event') || '';
  if (explicitEventMap[explicit]) return explicitEventMap[explicit];

  const href = target instanceof HTMLAnchorElement ? target.getAttribute('href') || '' : '';
  if (href.startsWith('/pricing')) return 'pricing_click';
  if (href.startsWith('/start-trial')) return 'start_trial_click';
  if (href.startsWith('/connect-broker')) return 'connect_broker_click';
  if (href.startsWith('/pro')) return 'pro_tab_click';
  return null;
}

export default function AnalyticsProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();
  const identifiedIdRef = useRef<string | null>(null);

  useEffect(() => {
    initSentry();
    initPostHog();
  }, []);

  useEffect(() => {
    if (user?.uid && user.uid !== identifiedIdRef.current) {
      identifiedIdRef.current = user.uid;
      posthogIdentify(user.uid, {
        ...(user.displayName ? { name: user.displayName } : {}),
        ...(user.email ? { email: user.email } : {}),
        role: user.role,
      });
    } else if (!user && identifiedIdRef.current) {
      identifiedIdRef.current = null;
      posthogReset();
    }
  }, [user]);

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
