import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Crown, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { proDashboardStateSchema } from '../core/schemas';

async function loadProReadiness() {
  const response = await fetch('/api/pro/readiness');
  const payload = await response.json().catch(() => null);
  const parsed = proDashboardStateSchema.safeParse(payload);
  if (!parsed.success) throw new Error('Pro readiness returned malformed data.');
  return parsed.data;
}

export default function ProPage() {
  const query = useQuery({
    queryKey: ['pro-readiness'],
    queryFn: loadProReadiness,
    refetchInterval: false,
  });

  return (
    <div className="lg:col-span-12">
      <section className="border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950 sm:p-8">
        <div className="flex items-center gap-3">
          <Crown size={24} className="text-emerald-500" />
          <div>
            <p className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Pro workspace readiness</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">StockPro Pro</h1>
          </div>
        </div>

        {query.isPending ? (
          <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-slate-500"><RefreshCw size={15} className="animate-spin" /> Checking real service readiness...</p>
        ) : query.isError ? (
          <div className="mt-6 border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-200">
            <AlertTriangle size={18} />
            <p className="mt-2">Pro readiness is unavailable. No dashboard data or entitlement is assumed.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ['Market provider', query.data.marketProvider],
              ['Broker vault', query.data.brokerVault],
              ['Billing test readiness', query.data.billing],
            ].map(([label, state]) => (
              <article key={label} className="border border-slate-200 p-4 dark:border-slate-800">
                <h2 className="text-xs font-bold text-slate-500">{label}</h2>
                <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">{state.replace('_', ' ')}</p>
              </article>
            ))}
          </div>
        )}

        <p className="mt-6 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">Pro access, saved screens, alerts, broker data, and billing remain setup-dependent. No paid entitlement, live data, or recommendations are synthesized.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/contact?interest=pro" data-analytics-event="pro_tab_click" className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-black text-slate-950">Join Pro waitlist</Link>
          <Link to="/pricing" data-analytics-event="pricing_click" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-black dark:border-slate-700">Review pricing</Link>
        </div>
      </section>
    </div>
  );
}
