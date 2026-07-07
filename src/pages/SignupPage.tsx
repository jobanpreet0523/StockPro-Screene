import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, ShieldCheck, UserPlus } from 'lucide-react';
import { getFrontendAuthReadiness } from '../core/authConfig';
import { useAuth } from '../contexts/AuthContext';

export default function SignupPage() {
  const { authStatus, authMessage, refreshSession } = useAuth();
  const readiness = getFrontendAuthReadiness();

  return (
    <div className="lg:col-span-12">
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white/95 p-7 shadow-xl dark:border-slate-800 dark:bg-slate-950/90 sm:p-9">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900/50">
          <UserPlus size={14} /> Account setup
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">Create your StockPro account</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
          Signup remains honest: no fake account, fake trial, or fake broker connection is created when Supabase Auth is not configured.
        </p>

        <div className="mt-6 grid gap-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Auth readiness</p>
            <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">{readiness.status}</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{readiness.message}</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">Server session status: {authStatus}. {authMessage}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void refreshSession()}
              data-analytics-event="signup_cta_click"
              data-analytics-label="signup:check-session"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-400"
            >
              <UserPlus size={16} /> Check setup
            </button>
            <Link
              to="/login"
              data-analytics-event="login_cta_click"
              data-analytics-label="signup:login-link"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <LogIn size={16} /> Log in instead
            </Link>
          </div>

          {!readiness.configured && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold leading-5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
              Supabase Auth setup is required before signup can create real accounts. No local or synthetic user state is stored.
            </div>
          )}
        </div>

        <p className="mt-6 flex items-start gap-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-blue-500" /> Educational analytics only. Authentication does not enable trading or investment advice.
        </p>
      </section>
    </div>
  );
}
