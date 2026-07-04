import React from 'react';
import { Mail, MessageCircle, ShieldAlert } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="lg:col-span-12">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-violet-500/10 p-3 text-violet-500">
            <MessageCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-600 dark:text-violet-400">Support</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Contact StockPro</h1>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Use this page for support, product feedback, and launch questions.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <Mail className="text-emerald-500" size={20} />
            <h2 className="mt-3 text-sm font-black text-slate-900 dark:text-white">Support email</h2>
            <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-400">Set a verified support email before launch. Suggested: support@stockpro1.qzz.io</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <MessageCircle className="text-blue-500" size={20} />
            <h2 className="mt-3 text-sm font-black text-slate-900 dark:text-white">Feedback</h2>
            <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-400">Report broken tabs, wrong data, UI issues, payment problems, and feature requests with screenshots when possible.</p>
          </article>

          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
            <ShieldAlert className="text-amber-500" size={20} />
            <h2 className="mt-3 text-sm font-black text-amber-900 dark:text-amber-200">Important</h2>
            <p className="mt-2 text-xs leading-6 text-amber-800 dark:text-amber-300">Do not share passwords, broker credentials, OTPs, API secrets, or sensitive trading account details.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
