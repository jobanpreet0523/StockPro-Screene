import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle2, KeyRound, Link2, LockKeyhole, RefreshCw,
  ShieldCheck, TestTube2, Unplug, UserRound, WifiOff,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedFetch } from '../core/supabaseClient';
import { captureSafeEvent } from '../lib/posthog';

type Provider = 'upstox' | 'dhan' | 'angelone';
type TestType = 'profile' | 'quote' | 'historical' | 'option_chain' | 'instrument_master';
type StatusPayload = Record<string, unknown> & { status?: string; message?: string; mode?: string; reason?: string; isConnected?: boolean; authorizationUrl?: string };

async function brokerRequest(path: string, init: RequestInit = {}) {
  const response = await authenticatedFetch(path, init);
  const payload = await response.json().catch(() => ({ status: 'error', message: 'Broker service returned an unreadable response.' })) as StatusPayload;
  return { response, payload };
}

function providerStatus(provider: Provider) {
  return brokerRequest(`/api/broker/${provider}/status`).then(({ payload }) => payload);
}

export default function ConnectBrokerProductPage() {
  const { user, authStatus, authMessage } = useAuth();
  const [params] = useSearchParams();
  const callbackStatus = params.get('status');
  const callbackProvider = params.get('provider');
  const queryClient = useQueryClient();
  const [message, setMessage] = useState(callbackStatus ? `${callbackProvider || 'Broker'} callback: ${callbackStatus}.` : 'Choose a broker to begin.');
  const [busyProvider, setBusyProvider] = useState<Provider | null>(null);
  const [testProvider, setTestProvider] = useState<'upstox' | 'dhan'>('upstox');
  const [testType, setTestType] = useState<TestType>('profile');
  const [instrumentToken, setInstrumentToken] = useState('');
  const [exchange, setExchange] = useState('NSE_EQ');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [expiry, setExpiry] = useState('');

  const statuses = {
    upstox: useQuery({ queryKey: ['broker-status', 'upstox', user?.id], queryFn: () => providerStatus('upstox'), enabled: Boolean(user), retry: false }),
    dhan: useQuery({ queryKey: ['broker-status', 'dhan', user?.id], queryFn: () => providerStatus('dhan'), enabled: Boolean(user), retry: false }),
    angelone: useQuery({ queryKey: ['broker-status', 'angelone'], queryFn: () => providerStatus('angelone'), retry: false }),
  };

  const refreshStatuses = async () => queryClient.invalidateQueries({ queryKey: ['broker-status'] });

  const start = async (provider: 'upstox' | 'dhan') => {
    setBusyProvider(provider);
    captureSafeEvent('connect_broker_click');
    const { payload } = await brokerRequest(`/api/broker/${provider}/start`);
    setMessage(String(payload.message || `${provider} setup checked.`));
    setBusyProvider(null);
    if (typeof payload.authorizationUrl === 'string' && payload.authorizationUrl.startsWith('https://')) window.location.assign(payload.authorizationUrl);
  };

  const disconnect = async (provider: 'upstox' | 'dhan') => {
    setBusyProvider(provider);
    const { payload } = await brokerRequest(`/api/broker/${provider}/disconnect`, { method: 'POST' });
    setMessage(String(payload.message || `${provider} disconnect completed.`));
    setBusyProvider(null);
    await refreshStatuses();
  };

  const test = async () => {
    setBusyProvider(testProvider);
    const { payload } = await brokerRequest(`/api/broker/${testProvider}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testType, instrumentToken: instrumentToken.trim() || undefined, exchange, fromDate: fromDate || undefined, toDate: toDate || undefined, expiry: expiry || undefined, interval: 'days', underlyingSegment: 'IDX_I' }),
    });
    setMessage(String(payload.message || `${testProvider} test completed.`));
    setBusyProvider(null);
    await refreshStatuses();
  };

  const canTest = testType === 'profile' || testType === 'instrument_master'
    ? true
    : Boolean(instrumentToken.trim()) && (testType !== 'historical' || Boolean(fromDate && toDate)) && (testType !== 'option_chain' || Boolean(expiry));

  const brokerCards = useMemo(() => [
    { provider: 'upstox' as const, name: 'Upstox', status: statuses.upstox.data, copy: 'OAuth authorization code flow with one-time state and server-side token exchange.' },
    { provider: 'dhan' as const, name: 'Dhan', status: statuses.dhan.data, copy: 'Explicit sandbox/live separation with individual or future partner consent readiness.' },
    { provider: 'angelone' as const, name: 'Angel One', status: statuses.angelone.data, copy: 'Integration remains disabled until application approval and credential configuration.' },
  ], [statuses.upstox.data, statuses.dhan.data, statuses.angelone.data]);

  return (
    <div className="lg:col-span-12 space-y-6">
      <section className="border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div><p className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">Per-user broker access</p><h1 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">Connect read-only market data without sharing credentials.</h1><p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300">Tokens are encrypted on the backend for the authenticated user. StockPro does not collect broker passwords, PINs, OTPs, or TOTP secrets, and it exposes no order-placement capability.</p></div>
          <div className="border-l-2 border-emerald-500 bg-emerald-50 p-4 text-xs font-bold leading-6 text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-100"><ShieldCheck size={20} aria-hidden /><p className="mt-3">No shared token. No browser token storage. No trade execution.</p><Link to="/data-methodology" className="mt-3 inline-flex items-center gap-2 text-emerald-800 underline dark:text-emerald-200">View security model</Link></div>
        </div>
      </section>

      {!user && <section className="border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/20"><h2 className="text-sm font-black text-blue-950 dark:text-blue-100">Login required</h2><p className="mt-2 text-xs font-semibold leading-6 text-blue-800 dark:text-blue-200">Auth state: {authStatus}. {authMessage}</p><div className="mt-4 flex gap-2"><Link to="/login" className="bg-blue-700 px-4 py-3 text-xs font-black text-white">Log in</Link><Link to="/signup" className="border border-blue-300 px-4 py-3 text-xs font-black text-blue-800 dark:text-blue-100">Create account</Link></div></section>}

      <section className="grid gap-4 lg:grid-cols-3" aria-label="Broker readiness">
        {brokerCards.map(({ provider, name, status, copy }) => {
          const connected = status?.status === 'connected' && status?.isConnected === true;
          const pending = provider === 'angelone';
          const expired = status?.status === 'reconnect_required';
          return (
            <article key={provider} className="border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-black text-slate-950 dark:text-white">{name}</h2>{provider === 'dhan' && <span className={`mt-2 inline-flex border px-2 py-1 text-[9px] font-black uppercase ${status?.mode === 'live' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-amber-300 bg-amber-50 text-amber-900'}`}>{status?.mode === 'live' ? 'Verified live mode' : 'Sandbox/readiness mode'}</span>}</div><StatusIcon connected={connected} pending={pending} expired={expired} /></div>
              <p className="mt-4 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">{copy}</p>
              <div role="status" className="mt-4 min-h-20 border border-slate-200 bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"><span className="block text-[9px] font-black uppercase text-slate-400">{String(status?.status || (user ? 'checking' : 'login_required')).replace(/_/g, ' ')}</span><span className="mt-1 block">{String(status?.message || (pending ? 'Angel One integration will become available after approval.' : user ? 'Checking this user connection.' : 'Sign in to connect.'))}</span></div>
              {provider === 'angelone' ? <button type="button" disabled className="mt-4 w-full border border-slate-300 px-4 py-3 text-xs font-black text-slate-500 opacity-70">Approval pending</button> : <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => void start(provider)} disabled={!user || busyProvider !== null} className="inline-flex items-center justify-center gap-2 bg-blue-700 px-3 py-3 text-xs font-black text-white disabled:opacity-50">{expired ? <RefreshCw size={15} aria-hidden /> : <Link2 size={15} aria-hidden />}{connected ? 'Reconnect' : expired ? 'Reconnect' : 'Connect'}</button><button type="button" onClick={() => void disconnect(provider)} disabled={!user || busyProvider !== null || !connected} className="inline-flex items-center justify-center gap-2 border border-rose-300 px-3 py-3 text-xs font-black text-rose-700 disabled:opacity-40"><Unplug size={15} aria-hidden />Disconnect</button></div>}
            </article>
          );
        })}
      </section>

      <section className="border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800"><div><h2 className="flex items-center gap-2 text-sm font-black"><TestTube2 size={17} aria-hidden />Read-only connection test</h2><p className="mt-2 text-xs font-semibold text-slate-500">Tests official profile, instrument, quote, historical, or option-chain readiness. No order endpoint exists.</p></div><select value={testProvider} onChange={(event) => setTestProvider(event.target.value as 'upstox' | 'dhan')} className="border border-slate-300 bg-white px-3 py-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" aria-label="Broker to test"><option value="upstox">Upstox</option><option value="dhan">Dhan</option></select></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-6">
          <label className="grid gap-1 text-[10px] font-black uppercase text-slate-500">Test type<select value={testType} onChange={(event) => setTestType(event.target.value as TestType)} className="border border-slate-300 bg-white px-3 py-2 text-xs font-semibold normal-case text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="profile">Profile</option><option value="instrument_master">Instrument master</option><option value="quote">Quote</option><option value="historical">Historical</option><option value="option_chain">Option chain</option></select></label>
          <label className="grid gap-1 text-[10px] font-black uppercase text-slate-500">Instrument token<input value={instrumentToken} onChange={(event) => setInstrumentToken(event.target.value)} disabled={testType === 'profile' || testType === 'instrument_master'} className="border border-slate-300 px-3 py-2 text-xs font-semibold normal-case text-slate-900 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
          <label className="grid gap-1 text-[10px] font-black uppercase text-slate-500">Exchange<input value={exchange} onChange={(event) => setExchange(event.target.value)} className="border border-slate-300 px-3 py-2 text-xs font-semibold normal-case text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
          <label className="grid gap-1 text-[10px] font-black uppercase text-slate-500">From date<input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} disabled={testType !== 'historical'} className="border border-slate-300 px-3 py-2 text-xs font-semibold normal-case text-slate-900 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
          <label className="grid gap-1 text-[10px] font-black uppercase text-slate-500">To / expiry<input type="date" value={testType === 'option_chain' ? expiry : toDate} onChange={(event) => testType === 'option_chain' ? setExpiry(event.target.value) : setToDate(event.target.value)} disabled={!['historical', 'option_chain'].includes(testType)} className="border border-slate-300 px-3 py-2 text-xs font-semibold normal-case text-slate-900 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
          <button type="button" onClick={() => void test()} disabled={!user || busyProvider !== null || !canTest} className="inline-flex min-h-12 items-center justify-center gap-2 self-end bg-emerald-500 px-4 py-3 text-xs font-black text-slate-950 disabled:opacity-40"><TestTube2 size={15} aria-hidden />Test</button>
        </div>
      </section>

      <div role="status" aria-live="polite" className="border border-amber-200 bg-amber-50 p-4 text-xs font-bold leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">{message}</div>
      <section className="border border-slate-200 bg-slate-50 p-5 text-xs font-bold leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"><div className="flex gap-2"><LockKeyhole size={15} className="mt-1 shrink-0" aria-hidden />Credentials remain backend-only and encrypted per authenticated user.</div><div className="flex gap-2"><UserRound size={15} className="mt-1 shrink-0" aria-hidden />Friends and testers must connect their own broker account.</div><div className="flex gap-2"><AlertTriangle size={15} className="mt-1 shrink-0" aria-hidden />No password, PIN, OTP, TOTP secret, order placement, or trade execution.</div></section>
    </div>
  );
}

function StatusIcon({ connected, pending, expired }: { connected: boolean; pending: boolean; expired: boolean }) {
  if (connected) return <CheckCircle2 className="text-emerald-600" aria-label="Connected" />;
  if (pending) return <WifiOff className="text-orange-600" aria-label="Approval pending" />;
  if (expired) return <RefreshCw className="text-rose-600" aria-label="Reconnect required" />;
  return <KeyRound className="text-slate-400" aria-label="Not connected" />;
}

