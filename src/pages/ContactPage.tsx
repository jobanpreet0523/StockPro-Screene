import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { BarChart3, Bell, CheckCircle2, Crown, Mail, MessageCircle, Send, ShieldAlert, Sparkles } from 'lucide-react';
import type { WaitlistApiResponse, WaitlistPayload, WaitlistSubmitState } from '../core/waitlist';
import TurnstileWidget from '../components/security/TurnstileWidget';
import { captureSafeEvent } from '../lib/posthog';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryInterest = searchParams.get('interest')?.trim() || 'general';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [useCase, setUseCase] = useState('');
  const [interest, setInterest] = useState(queryInterest);
  const [submitState, setSubmitState] = useState<WaitlistSubmitState>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string }>({});
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const handleTurnstileToken = useCallback((token: string) => setTurnstileToken(token), []);

  useEffect(() => {
    setInterest(queryInterest);
  }, [queryInterest]);

  const mailto = useMemo(() => {
    const subject = encodeURIComponent(`StockPro waitlist request: ${interest || 'general'}`);
    const body = encodeURIComponent([
      'Hi StockPro team, I want to join the waitlist.',
      `Name: ${name || '[your name]'}`,
      `Email: ${email || '[your email]'}`,
      `Interest: ${interest || 'general'}`,
      `Use case: ${useCase || '[optional]'}`,
    ].join('\n'));
    return `mailto:support@stockpro1.qzz.io?subject=${subject}&body=${body}`;
  }, [email, interest, name, useCase]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const errors: { name?: string; email?: string } = {};
    if (!cleanName) errors.name = 'Name is required.';
    if (!emailPattern.test(cleanEmail)) errors.email = 'Enter a valid email address.';
    setFieldErrors(errors);

    if (!turnstileToken) {
      setSubmitState('setup_required');
      setStatusMessage('Complete anti-spam verification before submitting.');
      return;
    }

    if (Object.keys(errors).length > 0) {
      setSubmitState('error');
      setStatusMessage('Please correct the highlighted fields before submitting.');
      return;
    }

    const payload: WaitlistPayload = {
      name: cleanName,
      email: cleanEmail,
      useCase: useCase.trim() || undefined,
      interest: interest.trim() || 'general',
      sourcePage: `${location.pathname}${location.search}`,
      referrer: document.referrer || undefined,
    };

    setSubmitState('submitting');
    setStatusMessage('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({
        status: 'error',
        message: 'The waitlist service returned an unreadable response.',
      })) as WaitlistApiResponse;

      if (response.ok && (result.status === 'stored' || result.status === 'already_joined')) {
        setSubmitState('success');
        setStatusMessage(result.message || 'Your waitlist request was stored successfully.');
        return;
      }

      if (result.status === 'setup_required') {
        setSubmitState('setup_required');
        setStatusMessage(result.message);
        return;
      }

      setSubmitState('error');
      setStatusMessage(result.message || 'Your request was not stored. Please try again or use the email fallback.');
    } catch {
      setSubmitState('error');
      setStatusMessage('Your request was not stored because the service could not be reached. Please try again or use the email fallback.');
    }
  };

  const statusClass = submitState === 'success'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200'
    : submitState === 'setup_required'
    ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200'
    : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200';

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
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Join the product waitlist, share your research workflow, or contact support.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-6 rounded-3xl border border-violet-200 bg-violet-50/60 p-5 dark:border-violet-900/50 dark:bg-violet-950/10">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300"><Crown size={14} /> Structured waitlist request</div>
          <h2 className="mt-3 text-xl font-black text-slate-950 dark:text-white">Tell us what would make StockPro useful to you.</h2>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">Weâ€™ll use this to understand demand and contact you when access is ready.</p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-xs font-black text-slate-700 dark:text-slate-200">
              Name <span className="text-rose-500">*</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                maxLength={120}
                className={`mt-2 w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-400 dark:bg-slate-950 dark:text-white ${fieldErrors.name ? 'border-rose-400' : 'border-slate-200 dark:border-slate-800'}`}
                aria-invalid={Boolean(fieldErrors.name)}
              />
              {fieldErrors.name && <span className="mt-1 block text-[11px] font-bold text-rose-600 dark:text-rose-400">{fieldErrors.name}</span>}
            </label>

            <label className="text-xs font-black text-slate-700 dark:text-slate-200">
              Email <span className="text-rose-500">*</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                maxLength={254}
                className={`mt-2 w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-400 dark:bg-slate-950 dark:text-white ${fieldErrors.email ? 'border-rose-400' : 'border-slate-200 dark:border-slate-800'}`}
                aria-invalid={Boolean(fieldErrors.email)}
              />
              {fieldErrors.email && <span className="mt-1 block text-[11px] font-bold text-rose-600 dark:text-rose-400">{fieldErrors.email}</span>}
            </label>

            <label className="text-xs font-black text-slate-700 dark:text-slate-200">
              Interest or source
              <input
                value={interest}
                onChange={(event) => setInterest(event.target.value)}
                maxLength={120}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="text-xs font-black text-slate-700 dark:text-slate-200 md:row-span-2">
              Use case <span className="font-semibold text-slate-400">(optional, encouraged)</span>
              <textarea
                value={useCase}
                onChange={(event) => setUseCase(event.target.value)}
                maxLength={2000}
                rows={5}
                placeholder="Which screens, alerts, exports, or research workflow would help you?"
                className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-bold leading-5 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
              <ShieldAlert size={14} className="mr-1 inline" /> Do not share passwords, OTPs, broker secrets, or API keys.
            </div>
          </div>

          <div className="mt-5"><TurnstileWidget action="waitlist" onTokenChange={handleTurnstileToken} resetKey={turnstileResetKey} /></div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={submitState === 'submitting' || !turnstileToken}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={15} /> {submitState === 'submitting' ? 'Submittingâ€¦' : 'Join waitlist'}
            </button>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">No payment is required.</span>
          </div>

          {submitState !== 'idle' && submitState !== 'submitting' && (
            <div className={`mt-4 rounded-xl border p-4 text-xs font-bold leading-5 ${statusClass}`} role="status">
              <p>{statusMessage}</p>
              {(submitState === 'setup_required' || submitState === 'error') && (
                <a href={mailto} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950">
                  <Mail size={13} /> Use email fallback
                </a>
              )}
            </div>
          )}
        </form>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <Crown className="text-emerald-600 dark:text-emerald-400" size={20} />
            <h2 className="mt-3 text-sm font-black text-slate-900 dark:text-white">Structured demand capture</h2>
            <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-300">Requests are stored only when the server-side waitlist connection confirms success.</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <Mail className="text-emerald-500" size={20} />
            <h2 className="mt-3 text-sm font-black text-slate-900 dark:text-white">Support email</h2>
            <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-400">Email fallback: support@stockpro1.qzz.io</p>
          </article>

          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
            <ShieldAlert className="text-amber-500" size={20} />
            <h2 className="mt-3 text-sm font-black text-amber-900 dark:text-amber-200">Important</h2>
            <p className="mt-2 text-xs leading-6 text-amber-800 dark:text-amber-300">StockPro is an educational analytics workspace, not an investment adviser.</p>
          </article>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400"><Sparkles size={14} /> What Pro demand means</div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {['Saved screens', 'Price or screen alerts', 'Export workflow'].map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-black text-slate-800 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-100">
              <CheckCircle2 size={16} className="mb-2 text-emerald-500" /> {item}
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs font-bold leading-6 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-blue-300">
          <Bell size={15} className="mr-2 inline" />Waitlist demand comes first. Paid access stays disabled until billing, support, policy, and access checks are ready.
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400"><BarChart3 size={14} /> Measurement checklist</div>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Measure before scaling.</h2>
        <p className="mt-2 text-xs font-semibold leading-6 text-slate-600 dark:text-slate-300">Track the funnel weekly so product decisions are based on usage, not guesses.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {['Visitors', 'Tool opens', 'Pricing clicks', 'Waitlist requests'].map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-black text-slate-800 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-100">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

