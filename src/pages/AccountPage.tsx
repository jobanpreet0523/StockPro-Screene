import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Database, KeyRound, LockKeyhole, RefreshCw, ShieldCheck, UserRound } from 'lucide-react';
import type { AuthApiResponse } from '../core/authTypes';
import type { BrokerConnectionResponse } from '../core/brokerConnection';
import type { TrialApiResponse } from '../core/subscriptionTypes';
import { useAuth } from '../contexts/AuthContext';

type CardState = 'checking' | 'ok' | 'setup_required' | 'unauthenticated' | 'unavailable';

interface AccountCard {
  key: string;
  label: string;
  state: CardState;
  message: string;
}

const initialCards: AccountCard[] = [
  { key: 'auth', label: 'Account session', state: 'checking', message: 'Checking authenticated session...' },
  { key: 'trial', label: 'Trial and subscription', state: 'checking', message: 'Checking trial setup...' },
  { key: 'broker', label: 'Broker connection', state: 'checking', message: 'Checking per-user broker status...' },
  { key: 'billing', label: 'Billing readiness', state: 'checking', message: 'Checking Razorpay test-mode readiness...' },
  { key: 'waitlist', label: 'Waitlist storage', state: 'checking', message: 'Checking waitlist storage...' },
];

function normalizeState(status: unknown, ok: boolean): CardState {
  if (status === 'authenticated' || status === 'ok' || status === 'test_ready') return 'ok';
  if (status === 'setup_required') return 'setup_required';
  if (status === 'unauthenticated' || status === 'not_connected') return 'unauthenticated';
  return ok ? 'unavailable' : 'unavailable';
}

async function readEndpoint<T>(endpoint: string): Promise<{ ok: boolean; payload: T & { status?: string; message?: string } }> {
  const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
  const payload = await response.json().catch(() => ({ status: 'error', message: `${endpoint} returned an unreadable response.` }));
  return { ok: response.ok, payload };
}

export default function AccountPage() {
  const { user, authStatus, authMessage, refreshSession, logout } = useAuth();
  const [cards, setCards] = useState<AccountCard[]>(initialCards);
  const [refreshKey, setRefreshKey] = useState(0);
  const [billingActionMessage, setBillingActionMessage] = useState('');

  useEffect(() => {
    let active = true;
    setCards(initialCards);

    Promise.all([
      readEndpoint<AuthApiResponse>('/api/auth/session').then(({ ok, payload }) => ({
        key: 'auth',
        label: 'Account session',
        state: normalizeState(payload.status, ok),
        message: payload.message || 'Account status checked.',
      })),
      readEndpoint<TrialApiResponse>('/api/trial/status').then(({ ok, payload }) => ({
        key: 'trial',
        label: 'Trial and subscription',
        state: normalizeState(payload.status, ok),
        message: `${payload.message || 'Trial status checked.'} Payment live mode disabled.`,
      })),
      readEndpoint<BrokerConnectionResponse>('/api/broker/status').then(({ ok, payload }) => ({
        key: 'broker',
        label: 'Broker connection',
        state: normalizeState(payload.status, ok),
        message: payload.message || 'Broker status checked.',
      })),
      readEndpoint<{ status: string; message: string; live_disabled?: boolean }>('/api/billing/readiness').then(({ ok, payload }) => ({
        key: 'billing',
        label: 'Billing readiness',
        state: normalizeState(payload.status, ok),
        message: `${payload.message || 'Billing readiness checked.'} ${payload.live_disabled === true ? 'Payment live mode disabled.' : ''}`.trim(),
      })),
      readEndpoint<{ status: string; message: string }>('/api/waitlist/health').then(({ ok, payload }) => ({
        key: 'waitlist',
        label: 'Waitlist storage',
        state: normalizeState(payload.status, ok),
        message: payload.message || 'Waitlist status checked.',
      })),
    ]).then((next) => {
      if (active) setCards(next);
    }).catch(() => {
      if (active) setCards((current) => current.map((item) => ({ ...item, state: 'unavailable', message: 'Status check failed. No account state was assumed.' })));
    });

    return () => { active = false; };
  }, [refreshKey]);

  const refreshAll = () => {
    void refreshSession();
    setRefreshKey((value) => value + 1);
  };
  const billingTestReady = cards.some((item) => item.key === 'billing' && item.state === 'ok');

  const cancelTestSubscription = async () => {
    setBillingActionMessage('Checking test cancellation scaffold...');
    try {
      const response = await fetch('/api/billing/cancel-test-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'user_requested_from_account_page' }),
      });
      const payload = await response.json().catch(() => ({ message: 'Cancellation scaffold returned an unreadable response.' }));
      setBillingActionMessage(payload.message || (response.ok ? 'Cancellation scaffold checked.' : 'Cancellation scaffold unavailable.'));
    } catch {
      setBillingActionMessage('Cancellation scaffold could not be reached. No subscription was changed.');
    }
  };

  return (
    <div className="lg:col-span-12">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400">Account foundation</p>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">StockPro account</h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
              Authentication, broker data, and billing are shown only from server-verified setup states. StockPro does not assume a logged-in user.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={refreshAll} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white dark:bg-emerald-500 dark:text-slate-950">
              <RefreshCw size={14} /> Refresh
            </button>
            {user && (
              <button type="button" onClick={() => void logout()} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 px-4 py-3 text-xs font-black text-rose-700 dark:border-rose-900/60 dark:text-rose-300">
                Sign out
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-start gap-3">
            <UserRound className="mt-0.5 shrink-0 text-emerald-500" size={20} />
            <div>
              <h2 className="text-sm font-black text-slate-950 dark:text-white">{user ? user.displayName || user.email || 'Authenticated user' : 'No authenticated account'}</h2>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-400">{authMessage}</p>
              <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-slate-500">Current auth state: {authStatus}</p>
              {!user && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to="/login" data-analytics-event="login_cta_click" data-analytics-label="account:login" className="rounded-xl bg-emerald-500 px-3 py-2 text-[11px] font-black text-slate-950">Log in</Link>
                  <Link to="/signup" data-analytics-event="signup_cta_click" data-analytics-label="account:signup" className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-black text-slate-700 dark:border-slate-700 dark:text-slate-200">Create account</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {cards.map((item) => <StatusCard key={item.key} item={item} />)}
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          <AccountLink icon={CreditCard} to="/start-trial" title="Review trial disclosure" text="Auto-renew consent remains explicit; live payment is disabled." />
          <AccountLink icon={KeyRound} to="/connect-broker" title="Broker setup" text="Broker data is per-user only. No shared broker token." />
          <AccountLink icon={Database} to="/status" title="Service status" text="Review setup-required states across the platform." />
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-950 dark:text-white">Test subscription controls</h2>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">Visible for readiness only. Live payment stays disabled and no fake active subscription is created.</p>
            </div>
            <button
              type="button"
              onClick={() => void cancelTestSubscription()}
              disabled={!billingTestReady || !user}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
            >
              Cancel test subscription
            </button>
          </div>
          {billingActionMessage && <p className="mt-3 text-xs font-bold leading-5 text-slate-600 dark:text-slate-300">{billingActionMessage}</p>}
        </div>

        <p className="mt-6 flex items-start gap-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-500" /> Educational analytics only. No order placement, no hidden auto-payment, and no investment advice.
        </p>
      </section>
    </div>
  );
}

function StatusCard({ item }: { item: AccountCard }) {
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

function AccountLink({ icon: Icon, to, title, text }: { icon: React.ElementType; to: string; title: string; text: string }) {
  return (
    <Link to={to} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-2 text-sm font-black text-slate-950 dark:text-white"><Icon size={17} className="text-emerald-500" /> {title}</div>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{text}</p>
    </Link>
  );
}
