import React from 'react';
import { AlertTriangle, CheckCircle2, CreditCard, KeyRound, Radio, ShieldCheck, Wifi } from 'lucide-react';
import DataSourceBadge from '../components/DataSourceBadge';
import { getMarketDataStatus } from '../core/marketData';

export default function ConnectBrokerPage() {
  const status = getMarketDataStatus(false);

  return (
    <div className="lg:col-span-12 flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/50">
              <Radio size={13} /> Setup foundation
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white md:text-4xl">Free delayed mode with a verified setup path.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">The public workspace remains delayed. Advanced mode should start only after server-side checks are complete.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <MiniStat icon={Wifi} label="Free mode" value="Delayed" />
              <MiniStat icon={CreditCard} label="Setup" value="Required" />
              <MiniStat icon={ShieldCheck} label="Status" value="Pending" />
            </div>
          </div>
          <DataSourceBadge status={status} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300"><CreditCard size={15} /> Step 1</div>
          <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Prepare setup</h2>
          <p className="mt-3 text-xs font-semibold leading-6 text-slate-600 dark:text-slate-300">Advanced mode remains off until verification is complete.</p>
          <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400"><CreditCard size={16} /> Setup pending</button>
        </article>

        <article className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300"><KeyRound size={15} /> Setup rule</div>
          <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Use the app setup flow only</h2>
          <p className="mt-3 text-xs font-semibold leading-6 text-amber-800 dark:text-amber-300">Let the server verify setup status before any public label changes.</p>
          <div className="mt-4 grid gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
            <div className="rounded-2xl bg-white/70 p-3 dark:bg-slate-950/50">1. Open setup.</div>
            <div className="rounded-2xl bg-white/70 p-3 dark:bg-slate-950/50">2. Complete the official flow.</div>
            <div className="rounded-2xl bg-white/70 p-3 dark:bg-slate-950/50">3. Verify setup status.</div>
            <div className="rounded-2xl bg-white/70 p-3 dark:bg-slate-950/50">4. Update labels after verification.</div>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" size={20} />
          <div>
            <h3 className="text-sm font-black text-amber-900 dark:text-amber-200">Launch-safe rule</h3>
            <p className="mt-2 text-xs font-semibold leading-6 text-amber-800 dark:text-amber-300">Keep public labels conservative until verification is working.</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200">
        <div className="flex items-center gap-2 text-sm font-black"><CheckCircle2 size={18} /> Setup page is launch-safe and ready for server wiring.</div>
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
