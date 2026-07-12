import { useQuery } from '@tanstack/react-query';
import { Activity, RefreshCw } from 'lucide-react';
import { getSupabaseClientReadiness } from '../core/supabaseClient';
import { searchClientReadiness } from '../core/searchConfig';
import { getTurnstileClientReadiness } from '../core/turnstile';
import { posthogReadiness } from '../lib/posthog';
import { sentryReadiness } from '../lib/sentry';
import { readApi } from '../core/apiClient';

type ReadinessState = 'configured' | 'setup_required' | 'disabled' | 'checking';
interface ReadinessItem { key: string; label: string; state: ReadinessState; message: string; }
interface OperationalResponse {
  status: 'ok';
  services: Record<string, 'configured' | 'setup_required' | 'disabled'>;
  message: string;
}

async function loadOperationalReadiness() {
  const result = await readApi<OperationalResponse>('/api/operations/readiness', { signal: AbortSignal.timeout(15_000) });
  return result.payload?.services ? result.payload : null;
}

async function loadDatabaseReadiness() {
  const result = await readApi<{ status: string; configured?: boolean; message?: string; tables?: Record<string, 'configured' | 'missing' | 'setup_required' | 'unavailable'> }>('/api/database/readiness', { signal: AbortSignal.timeout(15_000) });
  return result.payload;
}

function clientItems(): ReadinessItem[] {
  const analyticsEnabled = String(import.meta.env.VITE_ANALYTICS_ENABLED || '').toLowerCase() === 'true';
  const supabase = getSupabaseClientReadiness();
  const turnstile = getTurnstileClientReadiness();
  return [
    { key: 'analytics', label: 'Analytics', state: analyticsEnabled ? 'configured' : 'disabled', message: analyticsEnabled ? 'Optional analytics is explicitly enabled.' : 'Analytics is disabled by configuration.' },
    { key: 'sentry', label: 'Sentry', state: sentryReadiness(), message: 'No default personal information is sent.' },
    { key: 'posthog', label: 'PostHog', state: posthogReadiness(), message: 'Autocapture, session recording, persistence, and person profiles are disabled.' },
    { key: 'turnstile-client', label: 'Turnstile', state: turnstile.status, message: turnstile.message },
    { key: 'search-client', label: 'Search browser key', state: searchClientReadiness(), message: 'Only a search-only key may be exposed to the browser.' },
    { key: 'supabase-client', label: 'Supabase browser client', state: supabase.status, message: supabase.message },
  ];
}

const runtimeLabels: Record<string, string> = {
  auth: 'Supabase Auth',
  turnstile: 'Turnstile server verification',
  email: 'Email',
  search: 'Search indexes and admin setup',
  supabase: 'Supabase storage',
  marketProvider: 'Market provider',
  brokerProvider: 'Broker provider application',
  brokerVault: 'Broker vault',
  billingTest: 'Billing test readiness',
  paymentLive: 'Payment live',
  seoAudit: 'SEO audit',
  testSuite: 'Test suite',
  crtProvider: 'CRT authorized provider',
  crtStorage: 'CRT scan storage',
  savedResearch: 'Watchlist and alert storage',
  betaAdmin: 'Closed beta administration',
};

export default function StatusPage() {
  const query = useQuery({
    queryKey: ['operational-readiness'],
    queryFn: loadOperationalReadiness,
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
  const databaseQuery = useQuery({
    queryKey: ['database-readiness'],
    queryFn: loadDatabaseReadiness,
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  const runtimeItems: ReadinessItem[] = query.data
    ? Object.entries(query.data.services).map(([key, state]) => ({
        key,
        label: runtimeLabels[key] || key,
        state,
        message: state === 'configured' ? 'Configured without exposing credential values.' : state === 'disabled' ? 'Disabled by production policy.' : 'Manual setup is still required.',
      }))
    : runtimeLabels && Object.keys(runtimeLabels).map((key) => ({
        key,
        label: runtimeLabels[key],
        state: query.isPending ? 'checking' : 'setup_required',
        message: query.isPending ? 'Checking runtime configuration...' : 'Runtime readiness is unavailable. No substitute status is shown.',
      }));

  const databaseItems: ReadinessItem[] = Object.entries(databaseQuery.data?.tables || {}).map(([key, state]) => ({
    key: `database-${key}`,
    label: `Database: ${key}`,
    state: state === 'configured' ? 'configured' : 'setup_required',
    message: state === 'configured' ? 'Required table is reachable.' : state === 'missing' ? 'Required table is missing.' : state === 'unavailable' ? 'Table check is temporarily unavailable.' : 'Supabase setup is required.',
  }));
  const clients = clientItems();
  const items = [...clients, ...runtimeItems, ...databaseItems];
  const service = query.data?.services || {};
  const tables = databaseQuery.data?.tables || {};
  const clientState = (key: string) => clients.find((item) => item.key === key)?.state || 'setup_required';
  const launchChecklist: ReadinessItem[] = [
    { key: 'launch-supabase', label: 'Supabase configured', state: service.supabase || 'setup_required', message: 'Server-side database bindings.' },
    { key: 'launch-auth', label: 'Auth configured', state: service.auth || 'setup_required', message: 'Verified Supabase Auth sessions.' },
    { key: 'launch-broker-provider', label: 'Broker provider configured', state: service.brokerProvider || 'setup_required', message: 'Approved broker application configuration.' },
    { key: 'launch-broker-vault', label: 'Broker vault encrypted', state: service.brokerVault || 'setup_required', message: 'Per-user AES-GCM token vault.' },
    { key: 'launch-crt', label: 'CRT scanner provider configured', state: service.crtProvider || 'setup_required', message: 'Authorized CRT market source.' },
    { key: 'launch-watchlists', label: 'Watchlist table configured', state: tables.watchlists === 'configured' ? 'configured' : 'setup_required', message: 'Private watchlist storage.' },
    { key: 'launch-alerts', label: 'Alerts table configured', state: tables.alerts === 'configured' ? 'configured' : 'setup_required', message: 'Private alert definitions.' },
    { key: 'launch-resend', label: 'Resend configured', state: service.email || 'setup_required', message: 'Verified email delivery provider.' },
    { key: 'launch-turnstile', label: 'Turnstile configured', state: service.turnstile || 'setup_required', message: 'Server-side anti-spam verification.' },
    { key: 'launch-sentry', label: 'Sentry configured', state: clientState('sentry'), message: 'PII-safe error monitoring.' },
    { key: 'launch-posthog', label: 'PostHog configured', state: clientState('posthog'), message: 'Allowlisted events without recording or profiles.' },
    { key: 'launch-payment', label: 'Payment live disabled', state: service.paymentLive === 'disabled' ? 'disabled' : 'setup_required', message: 'Live charging remains blocked.' },
  ];

  return (
    <div className="lg:col-span-12">
      <section className="border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Production readiness</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">StockPro service status</h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">Only configured, setup required, disabled, or checking states are shown. Credential values and synthetic health are never returned.</p>
          </div>
          <button type="button" onClick={() => { void query.refetch(); void databaseQuery.refetch(); }} title="Refresh readiness" className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-xs font-bold text-white dark:bg-emerald-500 dark:text-slate-950"><RefreshCw size={14} /> Refresh</button>
        </div>

        <div className="mt-7 grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <article key={item.key} className="border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-sm font-black text-slate-950 dark:text-white">{item.label}</h2>
                <span className={`rounded px-2 py-1 text-[9px] font-bold uppercase ${item.state === 'configured' ? 'bg-emerald-100 text-emerald-700' : item.state === 'disabled' ? 'bg-slate-200 text-slate-700' : item.state === 'checking' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-800'}`}>{item.state.replace('_', ' ')}</span>
              </div>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-400">{item.message}</p>
            </article>
          ))}
        </div>

        <section className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Public launch checklist</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {launchChecklist.map((item) => <div key={item.key} className="flex items-start justify-between gap-3 border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"><div><p className="text-xs font-black">{item.label}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{item.message}</p></div><span className={`rounded px-2 py-1 text-[9px] font-bold uppercase ${item.state === 'configured' ? 'bg-emerald-100 text-emerald-700' : item.state === 'disabled' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-800'}`}>{item.state.replace('_', ' ')}</span></div>)}
          </div>
        </section>

        <p className="mt-6 flex items-start gap-2 text-xs font-semibold text-slate-500"><Activity size={15} className="shrink-0 text-emerald-500" /> Payment live mode remains disabled. Broker tokens remain encrypted, server-side, and per-user. This page is operational context, not investment advice.</p>
      </section>
    </div>
  );
}
