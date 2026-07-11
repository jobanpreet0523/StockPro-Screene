import * as Sentry from '@sentry/react';

let initialized = false;

export function initSentry() {
  if (initialized) return true;
  const enabled = String(import.meta.env.VITE_ANALYTICS_ENABLED || '').toLowerCase() === 'true';
  const dsn = String(import.meta.env.VITE_SENTRY_DSN || '').trim();
  if (!enabled || !dsn) return false;

  Sentry.init({
    dsn,
    environment: String(import.meta.env.VITE_SENTRY_ENVIRONMENT || 'production'),
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend(event) {
      delete event.user;
      if (event.request) {
        delete event.request.cookies;
        delete event.request.data;
        delete event.request.headers;
      }
      return event;
    },
  });
  initialized = true;
  return true;
}

export function captureRouteError(error: unknown, path: string) {
  if (!initialized) return;
  Sentry.captureException(error, { tags: { event: 'route_load_error', path } });
}

export function sentryReadiness() {
  if (String(import.meta.env.VITE_ANALYTICS_ENABLED || '').toLowerCase() !== 'true') return 'disabled' as const;
  return String(import.meta.env.VITE_SENTRY_DSN || '').trim() ? 'configured' as const : 'setup_required' as const;
}
