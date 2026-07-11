import { useQuery } from '@tanstack/react-query';
import { Activity, RefreshCw } from 'lucide-react';
import { getSupabaseClientReadiness } from '../core/supabaseClient';
import { searchClientReadiness } from '../core/searchConfig';
import { getTurnstileClientReadiness } from '../core/turnstile';
import { posthogReadiness } from '../lib/posthog';
import { sentryReadiness } from '../lib/sentry';

type ReadinessState = 'configured' | 'setup_required' | 'disabled' | 'checking';
interface ReadinessItem { key: string; label: string; state: ReadinessState; message: string; }
interface OperationalResponse {
  status: 'ok';
  services: Record<string, 'configured' | 'setup_required' | 'disabled'>;
  message: string;
}

async function loadOperationalReadiness() {
  const response = await fetch('/api/operations/readiness', { signal: AbortSignal.timeout(15_000) });
  const payload = await response.json().catch(() => null) as OperationalResponse | null;
  if (!response.ok || payload?.status !== 'ok' || !payload.services) throw new Error('Operational readiness is unavailable.');
  return payload;
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
  turnstile: 'Turnstile server verification',
  email: 'Email',
  search: 'Search indexes and admin setup',
  supabase: 'Supabase storage',
  marketProvider: 'Market provider',
  brokerVault: 'Broker vault',
  billingTest: 'Billing test readiness',
  paymentLive: 'Payment live',
  seoAudit: 'SEO audit',
  testSuite: 'Test suite',
};

export default function StatusPage() {
  const query = useQuery({
    queryKey: ['operational-readiness'],
    queryFn: loadOperationalReadiness,
    refetchInterval: false,
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

  const items = [...clientItems(), ...runtimeItems];

  return (
    <div className="lg:col-span-12">
      <section className="border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Production readiness</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">StockPro service status</h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">Only configured, setup required, disabled, or checking states are shown. Credential values and synthetic health are never returned.</p>
          </div>
          <button type="button" onClick={() => void query.refetch()} title="Refresh readiness" className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-xs font-bold text-white dark:bg-emerald-500 dark:text-slate-950"><RefreshCw size={14} /> Refresh</button>
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

        <p className="mt-6 flex items-start gap-2 text-xs font-semibold text-slate-500"><Activity size={15} className="shrink-0 text-emerald-500" /> Payment live mode remains disabled. Broker tokens remain encrypted, server-side, and per-user. This page is operational context, not investment advice.</p>
      </section>
    </div>
  );
}
