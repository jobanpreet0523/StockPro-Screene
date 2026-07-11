import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2, CreditCard, LockKeyhole, ShieldCheck } from 'lucide-react';
import { formatTrialDisclosure, FREE_TRIAL_DAYS, PRO_MONTHLY_PRICE_INR } from '../core/trialPlan';
import TurnstileWidget from '../components/security/TurnstileWidget';
import type { TrialApiResponse } from '../core/subscriptionTypes';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

type SubmitState = 'idle' | 'submitting' | 'setup_required' | 'error';
interface BillingReadinessResponse {
  status: 'setup_required' | 'test_ready' | 'error';
  message: string;
  live_disabled?: boolean;
  testModeReady?: boolean;
  paymentEnabled?: boolean;
}

export default function StartTrialPage() {
  const { user, authStatus, authMessage } = useAuth();
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<SubmitState>('idle');
  const [message, setMessage] = useState('Payment and recurring mandate setup are not enabled yet.');
  const [billingMessage, setBillingMessage] = useState('Checking Razorpay test-mode readiness...');
  const [billingReady, setBillingReady] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const handleTurnstileToken = useCallback((token: string) => setTurnstileToken(token), []);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const [trialResponse, billingResponse] = await Promise.all([
          fetch('/api/trial/status'),
          fetch('/api/billing/readiness'),
        ]);
        const payload = await trialResponse.json().catch(() => ({
          status: 'error',
          plan: 'pro',
          disclosure: formatTrialDisclosure(),
          paymentEnabled: false,
          message: 'Trial setup returned an unreadable response.',
        })) as TrialApiResponse;
        const billingPayload = await billingResponse.json().catch(() => ({
          status: 'error',
          message: 'Billing readiness returned an unreadable response.',
          live_disabled: true,
          paymentEnabled: false,
        })) as BillingReadinessResponse;
        setState(payload.status === 'setup_required' ? 'setup_required' : 'error');
        setMessage(payload.message);
        setBillingReady(billingPayload.status === 'test_ready' && billingPayload.live_disabled === true);
        setBillingMessage(`${billingPayload.message} Payment live mode disabled.`);
      } catch {
        setState('error');
        setMessage('Trial setup could not be reached. No payment was created.');
        setBillingReady(false);
        setBillingMessage('Billing readiness could not be reached. No payment was created.');
      }
    };
    void checkStatus();
  }, []);

  const startTrial = async (event: FormEvent) => {
    event.preventDefault();
    if (!turnstileToken) {
      setState('setup_required');
      setMessage('Complete anti-spam verification before requesting a trial.');
      return;
    }
    if (!consent) {
      setState('error');
      setMessage('Confirm the auto-renew disclosure before requesting a trial.');
      return;
    }

    setState('submitting');
    setMessage('Checking trial setup...');
    try {
      if (!user) {
        setState('error');
        setMessage('Log in before requesting a test-mode trial. No fake user or subscription was created.');
        return;
      }

      const response = await fetch(billingReady ? '/api/billing/create-test-subscription' : '/api/trial/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoRenewConsent: true, turnstileToken }),
      });
      const payload = await response.json().catch(() => ({
        status: 'error',
        plan: 'pro',
        disclosure: formatTrialDisclosure(),
        paymentEnabled: false,
        message: 'Trial setup returned an unreadable response.',
      })) as TrialApiResponse;

      if (payload.status === 'setup_required') {
        setState('setup_required');
        setMessage(payload.message);
        return;
      }

      setState('error');
      setMessage(payload.message || 'Trial setup is unavailable. No payment was created.');
    } catch {
      setState('error');
      setMessage('Trial setup could not be reached. No payment was created.');
    }
  };

  return (
    <div className="lg:col-span-12 flex flex-col gap-6">
      <section className="mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-xl dark:border-slate-800 dark:bg-slate-950/90">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-slate-950 p-7 text-white sm:p-9">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300 ring-1 ring-emerald-400/20">
              <CalendarClock size={13} /> Pro trial foundation
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.05em]">â‚¹0 today</h1>
            <p className="mt-2 text-lg font-black text-emerald-300">{FREE_TRIAL_DAYS}-day Pro trial</p>
            <div className="mt-7 grid gap-3 text-sm font-semibold text-slate-300">
              <TrialPoint text={`After the trial: â‚¹${PRO_MONTHLY_PRICE_INR}/month`} />
              <TrialPoint text="Cancel anytime before the trial ends" />
              <TrialPoint text="Educational analytics onlyâ€”not investment advice" />
            </div>
          </div>

          <form onSubmit={startTrial} className="p-7 sm:p-9">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-300">
              <LockKeyhole size={14} /> {state === 'setup_required' ? 'Live setup required' : 'Checkout disabled'}
            </div>
            <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Review auto-renew consent</h2>
            <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-black leading-6 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              {formatTrialDisclosure()}
            </p>
            <div className={`mt-4 rounded-2xl border p-4 text-xs font-bold leading-5 ${billingReady ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300' : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200'}`}>
              Razorpay test readiness: {billingMessage}
            </div>
            {!user && (
              <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs font-bold leading-5 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-200">
                Login required for trial setup. Current auth state: {authStatus}. {authMessage} <Link to="/login" className="underline">Log in</Link> or <Link to="/signup" className="underline">create account</Link>.
              </div>
            )}

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-1 h-4 w-4 accent-emerald-500"
              />
              <span className="text-sm font-bold leading-6 text-slate-700 dark:text-slate-200">
                I understand this plan auto-renews after the trial unless I cancel.
              </span>
            </label>

            <button
              type="submit"
              disabled={state === 'submitting' || !turnstileToken}
              data-analytics-event="trial_cta_click"
              data-analytics-label="start-trial:submit"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CreditCard size={16} /> {state === 'submitting' ? 'Checking setup...' : 'Start trial'}
            </button>

            <div className={`mt-4 rounded-2xl border p-4 text-xs font-bold leading-5 ${state === 'error' ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300' : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300'}`}>
              {message}
            </div>

            <p className="mt-4 flex items-start gap-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-500" /> No live checkout opens, no hidden auto-payment runs, and no charge is created while setup remains disabled.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}

function TrialPoint({ text }: { text: string }) {
  return <div className="flex items-start gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-400" /> {text}</div>;
}

