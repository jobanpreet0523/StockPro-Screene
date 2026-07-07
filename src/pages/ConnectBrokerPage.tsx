import React from 'react';
import { AlertTriangle, CreditCard, Radio, ShieldCheck, Wifi } from 'lucide-react';
import BrokerConnectPanel from '../components/BrokerConnectPanel';
import DataSourceBadge from '../components/DataSourceBadge';
import { getMarketDataStatus } from '../core/marketData';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function ConnectBrokerPage() {
  const status = getMarketDataStatus(false);
  const { user, authStatus, authMessage } = useAuth();

  return (
    <div className="lg:col-span-12 flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/50">
              <Radio size={13} /> Per-user broker foundation
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white md:text-4xl">Connect your own broker for future live data.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">The public workspace remains delayed. Broker authorization must be user-specific, encrypted server-side, and limited to data access.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <MiniStat icon={Wifi} label="Public mode" value="Delayed" />
              <MiniStat icon={CreditCard} label="Orders" value="Disabled" />
              <MiniStat icon={ShieldCheck} label="Token model" value="Per user" />
            </div>
          </div>
          <DataSourceBadge status={status} />
        </div>
      </section>

      {!user && (
        <section className="rounded-3xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900/50 dark:bg-blue-950/20">
          <h2 className="text-sm font-black text-blue-950 dark:text-blue-100">Login required for broker connection</h2>
          <p className="mt-2 text-xs font-semibold leading-6 text-blue-800 dark:text-blue-200">
            Current auth state: {authStatus}. {authMessage} Broker tokens are never accepted for anonymous visitors.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/login" data-analytics-event="login_cta_click" data-analytics-label="connect-broker:login" className="rounded-xl bg-blue-600 px-3 py-2 text-[11px] font-black text-white">Log in</Link>
            <Link to="/signup" data-analytics-event="signup_cta_click" data-analytics-label="connect-broker:signup" className="rounded-xl border border-blue-200 px-3 py-2 text-[11px] font-black text-blue-800 dark:border-blue-800 dark:text-blue-100">Create account</Link>
          </div>
        </section>
      )}

      <BrokerConnectPanel />

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" size={20} />
          <div>
            <h3 className="text-sm font-black text-amber-900 dark:text-amber-200">Educational analytics and data access only</h3>
            <p className="mt-2 text-xs font-semibold leading-6 text-amber-800 dark:text-amber-300">StockPro does not place, modify, or cancel orders. A connected state must never be shown until the authenticated user’s broker authorization is verified.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Wifi; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><Icon size={13} /> {label}</div>
      <div className="mt-2 text-sm font-black text-slate-950 dark:text-white">{value}</div>
    </div>
  );
}
