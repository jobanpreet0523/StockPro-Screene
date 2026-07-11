import { useCallback, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck, UserPlus } from 'lucide-react';
import TurnstileWidget from '../components/security/TurnstileWidget';
import { getFrontendAuthReadiness } from '../core/authConfig';
import { getSupabaseClient } from '../core/supabaseClient';
import { captureSafeEvent } from '../lib/posthog';

export default function SignupPage() {
  const readiness = getFrontendAuthReadiness();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [message, setMessage] = useState(readiness.message);
  const [submitting, setSubmitting] = useState(false);
  const onTokenChange = useCallback((token: string) => setTurnstileToken(token), []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const client = getSupabaseClient();
    if (!client || !turnstileToken) return setMessage('Auth and anti-spam setup are required. No account was created.');
    setSubmitting(true);
    try {
      const check = await fetch('/api/auth/signup-check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ turnstileToken }) });
      const checkPayload = await check.json().catch(() => ({ message: 'Signup verification returned an unreadable response.' }));
      if (!check.ok) return setMessage(checkPayload.message || 'Signup verification failed.');
      const { error } = await client.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/account` } });
      if (error) return setMessage(error.message);
      setMessage('Check your email to confirm the real Supabase account.');
      captureSafeEvent('signup');
      navigate('/login');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lg:col-span-12">
      <section className="mx-auto max-w-xl border border-slate-200 bg-white p-7 shadow-lg dark:border-slate-800 dark:bg-slate-950 sm:p-9">
        <div className="flex items-center gap-2 text-xs font-bold uppercase text-blue-700"><UserPlus size={15} /> Account setup</div>
        <h1 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">Create your StockPro account</h1>
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <label className="grid gap-1 text-sm font-bold">Email<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900" /></label>
          <label className="grid gap-1 text-sm font-bold">Password<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900" /></label>
          <TurnstileWidget action="signup" onTokenChange={onTokenChange} />
          <button disabled={!readiness.configured || !turnstileToken || submitting} className="inline-flex items-center justify-center gap-2 bg-blue-500 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"><UserPlus size={16} /> {submitting ? 'Creating account...' : 'Create account'}</button>
        </form>
        <p className="mt-4 border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">{message}</p>
        <Link to="/login" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700"><LogIn size={15} /> Log in instead</Link>
        <p className="mt-6 flex gap-2 text-xs font-semibold text-slate-500"><ShieldCheck size={15} /> Supabase creates the account only after verified anti-spam checks. No synthetic user is stored.</p>
      </section>
    </div>
  );
}
