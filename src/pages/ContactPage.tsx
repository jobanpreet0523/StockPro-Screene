import React from 'react';
import { Mail, MessageCircle, ShieldAlert, Sparkles, Crown, Bell, CheckCircle2, BarChart3 } from 'lucide-react';

export default function ContactPage() {
  const subject = encodeURIComponent('StockPro Pro Waitlist Request');
  const body = encodeURIComponent('Hi StockPro team, I want to join the Pro/Premium waitlist. My use case is: ');
  const mailto = `mailto:support@stockpro1.qzz.io?subject=${subject}&body=${body}`;

  return (
    <div className="lg:col-span-12 space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-violet-500/10 p-3 text-violet-500">
            <MessageCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-600 dark:text-violet-400">Waitlist and support</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Contact StockPro</h1>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Use this page for Pro waitlist requests, support, product feedback, and launch questions.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <Crown className="text-emerald-600 dark:text-emerald-400" size={20} />
            <h2 className="mt-3 text-sm font-black text-slate-900 dark:text-white">Join Pro waitlist</h2>
            <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-300">Request early access for saved screens, alerts, larger watchlists, export workflows, and future premium tools.</p>
            <a href={mailto} className="mt-4 inline-flex rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-400">Send request</a>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <Mail className="text-emerald-500" size={20} />
            <h2 className="mt-3 text-sm font-black text-slate-900 dark:text-white">Support email</h2>
            <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-400">Set and verify this mailbox before launch: support@stockpro1.qzz.io</p>
          </article>

          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
            <ShieldAlert className="text-amber-500" size={20} />
            <h2 className="mt-3 text-sm font-black text-amber-900 dark:text-amber-200">Important</h2>
            <p className="mt-2 text-xs leading-6 text-amber-800 dark:text-amber-300">Do not share passwords, broker credentials, OTPs, API secrets, or sensitive account details.</p>
          </article>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400"><Sparkles size={14} /> What Pro demand means</div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {["Saved screens", "Price or screen alerts", "Export workflow"].map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-black text-slate-800 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-100">
              <CheckCircle2 size={16} className="mb-2 text-emerald-500" /> {item}
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs font-bold leading-6 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-blue-300">
          <Bell size={15} className="mr-2 inline" />Stage 3 uses waitlist demand first. Real paid access should be enabled only after billing, plan limits, support, and access checks are ready.
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400"><BarChart3 size={14} /> Stage 5 measurement checklist</div>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Measure before scaling.</h2>
        <p className="mt-2 text-xs font-semibold leading-6 text-slate-600 dark:text-slate-300">Track the funnel weekly so product decisions are based on usage, not guesses.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {["Visitors", "Tool opens", "Pricing clicks", "Waitlist requests"].map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-black text-slate-800 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-100">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
