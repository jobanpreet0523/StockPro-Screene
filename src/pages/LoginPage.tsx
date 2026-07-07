import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, ShieldCheck, UserPlus } from 'lucide-react';
import { getFrontendAuthReadiness } from '../core/authConfig';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { user, authStatus, authMessage, refreshSession } = useAuth();
  const readiness = getFrontendAuthReadiness();

  return (
    <AuthShell
      eyebrow="Secure account access"
      title="Log in to StockPro"
      icon={LogIn}
      message={user ? `Signed in as ${user.email || user.displayName || user.id}.` : authMessage}
    >
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/60">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Current session</p>
        <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">{authStatus}</p>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{readiness.message}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => void refreshSession()}
          data-analytics-event="login_cta_click"
          data-analytics-label="login:refresh-session"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
        >
          <LogIn size={16} /> Check session
        </button>
        <Link
          to="/signup"
          data-analytics-event="signup_cta_click"
          data-analytics-label="login:signup-link"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          <UserPlus size={16} /> Create account
        </Link>
      </div>

      {!readiness.configured && (
        <SetupNotice text="Login is intentionally disabled until Supabase Auth env values and redirect URLs are configured. No fake user is created." />
      )}
    </AuthShell>
  );
}

function AuthShell({ eyebrow, title, icon: Icon, message, children }: { eyebrow: string; title: string; icon: typeof LogIn; message: string; children: React.ReactNode }) {
  return (
    <div className="lg:col-span-12">
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white/95 p-7 shadow-xl dark:border-slate-800 dark:bg-slate-950/90 sm:p-9">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/50">
          <Icon size={14} /> {eyebrow}
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">{title}</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">{message}</p>
        <div className="mt-6 grid gap-4">{children}</div>
        <p className="mt-6 flex items-start gap-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-500" /> Server-verified session state is the source of truth. StockPro does not fake logged-in users.
        </p>
      </section>
    </div>
  );
}

function SetupNotice({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold leading-5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
      {text} See <Link className="underline" to="/data-methodology">setup documentation</Link> and docs/SUPABASE_AUTH_SETUP.md.
    </div>
  );
}
