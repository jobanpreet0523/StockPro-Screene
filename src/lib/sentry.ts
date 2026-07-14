import { normalizeRouteError } from './normalizeRouteError';

type SentryModule = typeof import('@sentry/react');

let initialized = false;
let loading: Promise<SentryModule | null> | null = null;

function config() {
  const enabled = String(import.meta.env.VITE_ANALYTICS_ENABLED || '').toLowerCase() === 'true';
  const dsn = String(import.meta.env.VITE_SENTRY_DSN || '').trim();
  return { enabled, dsn };
}

async function loadSentry() {
  const { enabled, dsn } = config();
  if (!enabled || !dsn) return null;
  if (loading) return loading;

  loading = import('@sentry/react').then((Sentry) => {
    if (!initialized) {
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
    }
    return Sentry;
  }).catch(() => null);

  return loading;
}

export async function initSentry() {
  return Boolean(await loadSentry());
}

export function captureRouteError(error: unknown, path: string) {
  void loadSentry().then((Sentry) => {
    if (!Sentry || !initialized) return;
    Sentry.captureException(normalizeRouteError(error), {
      tags: { event: 'route_load_error', path: path.slice(0, 300) },
    });
  });
}

export function sentryReadiness() {
  if (!config().enabled) return 'disabled' as const;
  return config().dsn ? 'configured' as const : 'setup_required' as const;
}
