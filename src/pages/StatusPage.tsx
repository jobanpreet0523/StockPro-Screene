import React, { useEffect, useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';

type ServiceState = 'checking' | 'ok' | 'setup_required' | 'unavailable';
interface ServiceStatus { key: string; label: string; state: ServiceState; message: string; }

const services = [
  { key: 'market', label: 'Market data provider', endpoint: '/api/live/health' },
  { key: 'brokerRest', label: 'Broker REST / market data', endpoint: '/api/live/health' },
  { key: 'waitlist', label: 'Waitlist DB', endpoint: '/api/waitlist/health' },
  { key: 'auth', label: 'Auth status', endpoint: '/api/auth/session' },
  { key: 'brokerVault', label: 'Broker token vault', endpoint: '/api/broker/health' },
  { key: 'brokerStream', label: 'Broker WebSocket', endpoint: '/api/broker/stream/status' },
  { key: 'trial', label: 'Trial and payment', endpoint: '/api/trial/status' },
  { key: 'broker', label: 'Broker connection', endpoint: '/api/broker/status' },
  { key: 'news', label: 'News feed', endpoint: '/api/live-articles' },
  { key: 'ads', label: 'Ads configuration', endpoint: '/api/ad-config' },
  { key: 'billing', label: 'Billing readiness', endpoint: '/api/billing/readiness' },
  { key: 'seo', label: 'SEO metadata', endpoint: '/api/site-config' },
] as const;

const initial = services.map(({ key, label }) => ({ key, label, state: 'checking' as const, message: 'Checking current status...' }));

function normalizeStatus(response: Response, payload: any, key?: string): ServiceState {
  if (key === 'seo' && response.ok) return 'ok';
  if (payload?.status === 'setup_required') return 'setup_required';
  if (payload?.status === 'unauthenticated' || payload?.status === 'not_connected') return 'setup_required';
  if (response.ok && (payload?.status === 'ok' || payload?.status === 'authenticated' || payload?.status === 'test_ready')) return 'ok';
  return 'unavailable';
}

export default function StatusPage() {
  const [items, setItems] = useState<ServiceStatus[]>(initial);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setItems(initial);
    Promise.all(services.map(async (service) => {
      try {
        const response = await fetch(service.endpoint, { signal: AbortSignal.timeout(15000) });
        const payload = await response.json().catch(() => ({ status: 'error', message: 'Unreadable service response.' }));
        const details = service.key === 'market'
          ? `${payload.message || 'Market provider responded.'} Source: ${payload.source || 'unknown'}${Number.isFinite(payload.delayMinutes) ? ` · Delay: ${payload.delayMinutes} minutes` : ''}`
          : service.key === 'brokerVault'
          ? `${payload.message || 'Broker vault checked.'} Auth: ${payload.authConfigured ? 'configured' : 'setup required'} · Vault: ${payload.tokenVaultConfigured ? 'configured' : 'setup required'} · Storage: ${payload.storageConfigured ? 'configured' : 'setup required'} · Provider: ${payload.providerConfigured ? 'configured' : 'setup required'}`
          : service.key === 'brokerStream'
          ? `${payload.message || 'Broker stream checked.'} Stream: ${payload.isStreaming ? 'connected' : 'fallback to polling'}`
          : service.key === 'brokerRest'
          ? `${payload.message || 'Broker REST checked through live provider layer.'} Source: ${payload.source || 'unknown'}`
          : service.key === 'seo'
          ? 'Route SEO, sitemap, redirects, and launch verification are checked by scripts/verify-launch.mjs.'
          : service.key === 'billing'
          ? `${payload.message || 'Billing readiness checked.'} Payment live mode disabled.`
          : service.key === 'ads'
          ? `${payload.message || 'Ads configuration checked.'} Placeholder mode is acceptable until approved ad setup exists.`
          : service.key === 'auth'
          ? `${payload.message || 'Auth status checked.'} No logged-in user is assumed without a valid session.`
          : service.key === 'news' && Array.isArray(payload.data)
          ? `${payload.data.length} current source-linked article${payload.data.length === 1 ? '' : 's'} available.`
          : String(payload.message || 'Service responded without a status message.');
        return { key: service.key, label: service.label, state: normalizeStatus(response, payload, service.key), message: details } as ServiceStatus;
      } catch {
        return { key: service.key, label: service.label, state: 'unavailable', message: 'Service is unavailable or timed out. No substitute status is shown.' } as ServiceStatus;
      }
    })).then((next) => { if (active) setItems(next); });
    return () => { active = false; };
  }, [refreshKey]);

  return (
    <div className="lg:col-span-12">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400">System transparency</p>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">StockPro service status</h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">Live checks report configured, setup-required, or unavailable states without inventing service health.</p>
          </div>
          <button type="button" onClick={() => setRefreshKey((value) => value + 1)} data-analytics-event="status_check" data-analytics-label="status:refresh" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white dark:bg-emerald-500 dark:text-slate-950"><RefreshCw size={14} /> Refresh status</button>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <article key={item.key} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-sm font-black text-slate-950 dark:text-white">{item.label}</h2>
                <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${item.state === 'ok' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : item.state === 'checking' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' : item.state === 'setup_required' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'}`}>{item.state.replace('_', ' ')}</span>
              </div>
              <p className="mt-3 text-xs font-semibold leading-6 text-slate-600 dark:text-slate-400">{item.message}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-black leading-5 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200 sm:grid-cols-2">
          <span>Payment live mode disabled</span>
          <span>Broker data is per-user only</span>
          <span>No shared broker token</span>
          <span>Educational analytics only</span>
        </div>

        <p className="mt-6 flex items-start gap-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400"><Activity size={15} className="mt-0.5 shrink-0 text-emerald-500" /> This page is operational context, not a market-data guarantee or investment advice.</p>
      </section>
    </div>
  );
}
