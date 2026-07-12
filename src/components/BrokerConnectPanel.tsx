import { useEffect, useState } from 'react';
import { KeyRound, Link2, LockKeyhole, ShieldAlert, Unplug, UserRoundCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { readApi } from '../core/apiClient';
import { authenticatedFetch } from '../core/supabaseClient';

type TestType = 'profile' | 'quote' | 'historical' | 'option_chain';

export default function BrokerConnectPanel() {
  const { user } = useAuth();
  const [message, setMessage] = useState('Checking per-user broker connection setup...');
  const [busy, setBusy] = useState(false);
  const [clientId, setClientId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [securityId, setSecurityId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [underlyingScrip, setUnderlyingScrip] = useState('');
  const [expiry, setExpiry] = useState('');

  const loadStatus = async () => {
    const result = await readApi('/api/broker/status', {}, authenticatedFetch);
    setMessage(String(result.payload.message || 'Broker status checked.'));
  };

  useEffect(() => { void loadStatus(); }, [user?.id]);

  const saveDhan = async () => {
    setBusy(true);
    const result = await readApi('/api/broker/dhan/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: clientId.trim(), accessToken: accessToken.trim() }),
    }, authenticatedFetch);
    setAccessToken('');
    setMessage(String(result.payload.message || 'Broker credential request completed.'));
    setBusy(false);
  };

  const testConnection = async (testType: TestType) => {
    setBusy(true);
    const result = await readApi('/api/broker/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testType,
        securityId,
        fromDate,
        toDate,
        underlyingScrip,
        underlyingSeg: 'IDX_I',
        expiry,
      }),
    }, authenticatedFetch);
    setMessage(String(result.payload.message || 'Broker test completed.'));
    setBusy(false);
    if (result.state === 'connected') await loadStatus();
  };

  const startUpstox = async () => {
    setBusy(true);
    const result = await readApi('/api/broker/upstox/start', {}, authenticatedFetch);
    const url = typeof result.payload.authorizationUrl === 'string' ? result.payload.authorizationUrl : '';
    setMessage(String(result.payload.message || 'Upstox setup checked.'));
    setBusy(false);
    if (url) window.location.assign(url);
  };

  const disconnect = async () => {
    setBusy(true);
    const result = await readApi('/api/broker/logout', { method: 'POST' }, authenticatedFetch);
    setMessage(String(result.payload.message || 'Disconnect request completed.'));
    setBusy(false);
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
      <div className="flex items-center gap-2 text-xs font-black uppercase text-emerald-700 dark:text-emerald-300">
        <UserRoundCheck size={16} /> Your broker credentials
      </div>
      <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Connect a per-user market-data session</h2>
      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">Credentials are sent directly to the Worker, encrypted with AES-GCM for this authenticated user, and cleared from this form after submission. They are never stored in browser storage.</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="flex items-center gap-2 text-sm font-black"><KeyRound size={16} /> Dhan data access</h3>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1 text-xs font-bold">Dhan client ID<input value={clientId} onChange={(event) => setClientId(event.target.value)} autoComplete="off" className="border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" /></label>
            <label className="grid gap-1 text-xs font-bold">Dhan access token<input type="password" value={accessToken} onChange={(event) => setAccessToken(event.target.value)} autoComplete="off" className="border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900" /></label>
            <button type="button" onClick={() => void saveDhan()} disabled={busy || !user || !clientId.trim() || !accessToken.trim()} className="inline-flex items-center justify-center gap-2 bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50"><LockKeyhole size={15} /> Encrypt and save for this user</button>
          </div>
        </section>

        <section className="border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="flex items-center gap-2 text-sm font-black"><Link2 size={16} /> Upstox OAuth</h3>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Starts the approved Upstox authorization flow when the server-side app ID and callback are configured.</p>
          <button type="button" onClick={() => void startUpstox()} disabled={busy || !user} className="mt-4 w-full border border-emerald-300 px-4 py-3 text-sm font-black text-emerald-800 disabled:opacity-50 dark:text-emerald-200">Connect Upstox</button>
        </section>
      </div>

      <section className="mt-5 border border-slate-200 p-4 dark:border-slate-800">
        <h3 className="text-sm font-black">Read-only connection tests</h3>
        <p className="mt-1 text-xs font-semibold text-slate-500">Tests call official market-data endpoints only. No order endpoint exists in StockPro.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button type="button" onClick={() => void testConnection('profile')} disabled={busy || !user} className="border border-slate-300 px-3 py-2 text-xs font-black disabled:opacity-50">Test profile</button>
          <div className="flex gap-2"><input value={securityId} onChange={(event) => setSecurityId(event.target.value)} placeholder="Security ID" className="min-w-0 flex-1 border border-slate-300 px-2 py-2 text-xs"/><button type="button" onClick={() => void testConnection('quote')} disabled={busy || !securityId} className="border border-slate-300 px-3 py-2 text-xs font-black disabled:opacity-50">Quote</button></div>
          <div className="grid grid-cols-2 gap-2"><input type="date" aria-label="Historical data start date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="border border-slate-300 px-2 py-2 text-xs"/><input type="date" aria-label="Historical data end date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="border border-slate-300 px-2 py-2 text-xs"/><button type="button" onClick={() => void testConnection('historical')} disabled={busy || !securityId || !fromDate || !toDate} className="col-span-2 border border-slate-300 px-3 py-2 text-xs font-black disabled:opacity-50">Historical candles</button></div>
          <div className="grid grid-cols-2 gap-2"><input value={underlyingScrip} onChange={(event) => setUnderlyingScrip(event.target.value)} placeholder="Underlying ID" className="border border-slate-300 px-2 py-2 text-xs"/><input type="date" aria-label="Option chain expiry date" value={expiry} onChange={(event) => setExpiry(event.target.value)} className="border border-slate-300 px-2 py-2 text-xs"/><button type="button" onClick={() => void testConnection('option_chain')} disabled={busy || !underlyingScrip || !expiry} className="col-span-2 border border-slate-300 px-3 py-2 text-xs font-black disabled:opacity-50">Option chain</button></div>
        </div>
      </section>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div role="status" className="flex-1 border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-900">{message}</div>
        <button type="button" onClick={() => void disconnect()} disabled={busy || !user} className="inline-flex items-center gap-2 border border-rose-300 px-4 py-3 text-xs font-black text-rose-700 disabled:opacity-50"><Unplug size={15} /> Disconnect</button>
      </div>

      <div className="mt-5 border border-slate-200 bg-slate-50 p-4 text-xs font-bold leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
        <div className="flex gap-2"><LockKeyhole size={15} className="mt-1 shrink-0" /> Live data uses this logged-in user's own broker token only.</div>
        <div className="flex gap-2"><KeyRound size={15} className="mt-1 shrink-0" /> Friends and testers must connect their own broker account.</div>
        <div className="flex gap-2"><ShieldAlert size={15} className="mt-1 shrink-0" /> No shared token, passwords, OTP collection, order placement, or trade execution.</div>
      </div>
    </section>
  );
}
