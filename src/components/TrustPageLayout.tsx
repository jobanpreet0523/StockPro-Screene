import React, { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';

interface TrustPageLayoutProps {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}

export default function TrustPageLayout({ eyebrow, title, intro, children }: TrustPageLayoutProps) {
  return (
    <div className="lg:col-span-12">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-500"><ShieldCheck size={24} /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400">{eyebrow}</p>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">{title}</h1>
          </div>
        </div>
        <p className="mt-6 max-w-4xl text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300">{intro}</p>
        <div className="mt-7 grid gap-4 md:grid-cols-2">{children}</div>
      </section>
    </div>
  );
}

export function TrustCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/50">
      <h2 className="text-sm font-black text-slate-950 dark:text-white">{title}</h2>
      <div className="mt-2 text-xs font-semibold leading-6 text-slate-600 dark:text-slate-400">{children}</div>
    </article>
  );
}
