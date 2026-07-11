import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { MessageSquare, RefreshCw, Rocket, ShieldCheck } from 'lucide-react';
import TurnstileWidget from '../components/security/TurnstileWidget';
import { betaFeedbackSchema } from '../core/schemas';

type BetaState = 'checking' | 'ok' | 'setup_required' | 'unavailable';

const checks = [
  { key: 'waitlist', label: 'Waitlist status', endpoint: '/api/waitlist/health' },
  { key: 'auth', label: 'Auth status', endpoint: '/api/auth/session' },
  { key: 'broker', label: 'Broker status', endpoint: '/api/broker/status' },
  { key: 'billing', label: 'Billing test status', endpoint: '/api/billing/readiness' },
  { key: 'market', label: 'Market data status', endpoint: '/api/live/health' },
  { key: 'news', label: 'News status', endpoint: '/api/live-articles' },
  { key: 'ads', label: 'Ads status', endpoint: '/api/ad-config' },
] as const;

interface BetaCheck {
  key: string;
  label: string;
  state: BetaState;
  message: string;
}

const initial = checks.map(({ key, label }) => ({ key, label, state: 'checking' as const, message: 'Checking readiness...' }));

function normalize(payload: any, ok: boolean): BetaState {
  if (ok && ['ok', 'authenticated', 'test_ready'].includes(payload?.status)) return 'ok';
  if (['setup_required', 'unauthenticated', 'not_connected'].includes(payload?.status)) return 'setup_required';
  return 'unavailable';
}

export default function BetaLaunchPage() {
  const [items, setItems] = useState<BetaCheck[]>(initial);
  const [refreshKey, setRefreshKey] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('Feedback storage is checked only when you submit.');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const handleTurnstileToken = useCallback((token: string) => setTurnstileToken(token), []);

  useEffect(() => {
    let active = true;
    setItems(initial);
    Promise.all(checks.map(async (check) => {
      try {
        const response = await fetch(check.endpoint, { signal: AbortSignal.timeout(15000) });
        const payload = await response.json().catch(() => ({ status: 'error', message: 'Unreadable readiness response.' }));
        return {
          key: check.key,
          label: check.label,
          state: normalize(payload, response.ok),
          message: payload.message || `${check.label} checked.`,
        } as BetaCheck;
      } catch {
        return { key: check.key, label: check.label, state: 'unavailable', message: 'Readiness check unavailable. No substitute state is shown.' } as BetaCheck;
      }
    })).then((next) => { if (active) setItems(next); });
    return () => { active = false; };
  }, [refreshKey]);

  const submitFeedback = async (event: FormEvent) => {
    event.preventDefault();
    if (!turnstileToken) {
      setFeedbackMessage('Complete anti-spam verification before submitting feedback.');
      return;
    }
    const validatedFeedback = betaFeedbackSchema.safeParse({ message: feedback, sourcePage: '/beta', turnstileToken });
    if (!validatedFeedback.success) {
      setFeedbackMessage('Enter valid feedback before submitting.');
      return;
    }
    setFeedbackMessage('Checking feedback storage...');
    try {
      const response = await fetch('/api/beta/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedFeedback.data),
      });
      const payload = await response.json().catch(() => ({ message: 'Feedback endpoint returned an unreadable response.' }));
      setFeedbackMessage(payload.message || (response.ok ? 'Feedback endpoint checked.' : 'Feedback storage unavailable.'));
      if (response.ok && payload.status === 'stored') {
        setFeedback('');
        setTurnstileResetKey((value) => value + 1);
      }
    } catch {
      setFeedbackMessage('Feedback storage is unavailable. No fake success was shown.');
    }
  };

  return (
    <div className="lg:col-span-12 flex flex-col gap-6">
      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900/50">
              <Rocket size={14} /> Closed beta readiness
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">StockPro closed beta dashboard</h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
              This page reports setup-required, unavailable, or ready states. It does not fake beta access, payment, broker connection, or live data.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            data-analytics-event="status_check"
            data-analytics-label="beta:refresh"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white dark:bg-blue-500"
          >
            <RefreshCw size={14} /> Refresh beta status
          </button>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => <ReadinessCard key={item.key} item={item} />)}
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-black leading-5 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
          Manual setup required: Supabase Auth, waitlist DB, broker vault, broker REST/WebSocket gateway, Razorpay test billing, news proxy, ads configuration, and monitoring must be reviewed before inviting users.
        </div>
      </section>

      <section className="border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950 sm:p-8">
        <p className="text-xs font-black uppercase text-blue-700">Closed beta targets</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {['100 beta users','20 daily active users','10 broker-connected users','First paid interest'].map((target) => <article key={target} className="rounded-lg border border-slate-200 p-4 text-sm font-black">{target}<p className="mt-1 text-xs font-semibold text-slate-500">Target, not a reported count</p></article>)}
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Beta access is invite-only or waitlist-based. A stored waitlist record or authenticated invitation is required; this page does not grant access itself.</p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90 sm:p-8">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-300">
          <MessageSquare size={15} /> Beta feedback
        </div>
        <form onSubmit={submitFeedback} className="mt-4 grid gap-4">
          <textarea
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            maxLength={1500}
            required
            placeholder="Tell us what blocked you or what felt unclear. Do not include passwords, OTPs, broker tokens, or payment credentials."
            className="min-h-32 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
          <TurnstileWidget action="beta_feedback" onTokenChange={handleTurnstileToken} resetKey={turnstileResetKey} />
          <button
            type="submit"
            disabled={!turnstileToken}
            data-analytics-event="beta_feedback_submit"
            data-analytics-label="beta:feedback"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950"
          >
            Submit beta feedback
          </button>
        </form>
        <p className="mt-3 text-xs font-bold leading-5 text-slate-500 dark:text-slate-400">{feedbackMessage}</p>
        <p className="mt-5 flex items-start gap-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-500" /> No fake feedback success is shown. Missing storage returns setup_required.
        </p>
      </section>
    </div>
  );
}

function ReadinessCard({ item }: { item: BetaCheck }) {
  const tone = item.state === 'ok'
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
    : item.state === 'checking'
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
    : item.state === 'setup_required'
    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200'
    : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300';
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-black text-slate-950 dark:text-white">{item.label}</h2>
        <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${tone}`}>{item.state.replace('_', ' ')}</span>
      </div>
      <p className="mt-3 text-xs font-semibold leading-6 text-slate-600 dark:text-slate-400">{item.message}</p>
    </article>
  );
}

