import React, { useEffect, useState } from 'react';
import { ExternalLink, KeyRound, Link2, LockKeyhole, ShieldAlert, UserRoundCheck } from 'lucide-react';
import type { AffiliateClickResponse } from '../core/affiliate';
import { brokerLabels, type BrokerConnectionResponse, type BrokerProvider } from '../core/brokerConnection';

const providers: BrokerProvider[] = ['dhan', 'upstox', 'angel', 'zerodha'];

export default function BrokerConnectPanel() {
  const [message, setMessage] = useState('Checking per-user broker connection setup...');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/broker/status');
        const payload = await response.json().catch(() => ({
          status: 'provider_unavailable',
          provider: 'none',
          isConnected: false,
          dataAccess: 'none',
          message: 'Broker setup returned an unreadable response.',
        })) as BrokerConnectionResponse;
        setMessage(payload.message);
      } catch {
        setMessage('Broker setup is unavailable. No broker account is connected.');
      }
    };
    void checkStatus();
  }, []);

  const connectExisting = async (broker: BrokerProvider) => {
    setBusy(`connect-${broker}`);
    try {
      const endpoint = broker === 'dhan'
        ? '/api/broker/dhan/connect'
        : broker === 'upstox'
        ? '/api/broker/upstox/start'
        : '/api/broker/status';
      const response = await fetch(endpoint, { method: broker === 'dhan' ? 'POST' : 'GET' });
      const payload = await response.json().catch(() => ({
        status: 'provider_unavailable',
        provider: broker,
        isConnected: false,
        dataAccess: 'none',
        message: `${brokerLabels[broker]} connection setup returned an unreadable response.`,
      })) as BrokerConnectionResponse;
      setMessage(payload.message);
    } catch {
      setMessage(`${brokerLabels[broker]} connection setup is unavailable. No account was connected.`);
    } finally {
      setBusy(null);
    }
  };

  const openPartnerLink = async (broker: BrokerProvider) => {
    setBusy(`affiliate-${broker}`);
    try {
      const response = await fetch('/api/affiliate/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broker,
          sourcePage: `${window.location.pathname}${window.location.search}`,
          timestamp: new Date().toISOString(),
        }),
      });
      const payload = await response.json().catch(() => ({
        status: 'error',
        conversion: false,
        message: 'Partner-link setup returned an unreadable response.',
      })) as AffiliateClickResponse;
      setMessage(payload.message);
      if (payload.status === 'ok' && payload.destinationUrl) {
        window.open(payload.destinationUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      setMessage('Partner-link setup is unavailable. No click or conversion was recorded.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/85 sm:p-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-300">
            <UserRoundCheck size={15} /> Already have a broker?
          </div>
          <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Connect existing account</h2>
          <p className="mt-2 text-xs font-semibold leading-6 text-slate-500 dark:text-slate-400">Authorization must happen per user through the broker’s approved flow.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {providers.map((broker) => (
              <button
                key={broker}
                type="button"
                onClick={() => void connectExisting(broker)}
                disabled={busy !== null}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"
              >
                <Link2 size={15} /> {busy === `connect-${broker}` ? 'Checking...' : `Connect ${brokerLabels[broker]}`}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6 dark:border-slate-800 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">
            <ExternalLink size={15} /> New to broker?
          </div>
          <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Open account with StockPro partner link</h2>
          <p className="mt-2 text-xs font-semibold leading-6 text-slate-500 dark:text-slate-400">StockPro may earn a commission if you open a broker account through our partner link.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {providers.map((broker) => (
              <button
                key={broker}
                type="button"
                onClick={() => void openPartnerLink(broker)}
                disabled={busy !== null}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
              >
                <ExternalLink size={15} /> {busy === `affiliate-${broker}` ? 'Checking...' : `Open ${brokerLabels[broker]} account`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold leading-6 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-200">
        <div className="flex items-start gap-2"><LockKeyhole size={15} className="mt-1 shrink-0" /> Live data uses your own broker account only.</div>
        <div className="flex items-start gap-2"><KeyRound size={15} className="mt-1 shrink-0" /> StockPro does not share one user’s broker data with another user.</div>
        <div className="flex items-start gap-2"><ShieldAlert size={15} className="mt-1 shrink-0" /> Do not share passwords or OTPs.</div>
      </div>

      <div role="status" className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-bold leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
        {message}
      </div>
    </section>
  );
}
