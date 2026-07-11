import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck, UserPlus } from 'lucide-react';
import { getFrontendAuthReadiness } from '../core/authConfig';
import { getSupabaseClient } from '../core/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { user, authStatus, authMessage, refreshSession } = useAuth();
  const readiness = getFrontendAuthReadiness();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(readiness.message);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const client = getSupabaseClient();
    if (!client) return setMessage('Supabase Auth setup is required. No user was created.');
    setSubmitting(true);
    const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setMessage(error.message);
      setSubmitting(false);
      return;
    }
    await refreshSession();
    navigate('/account');
  };

  return (
    <div className="lg:col-span-12">
      <section className="mx-auto max-w-xl border border-slate-200 bg-white p-7 shadow-lg dark:border-slate-800 dark:bg-slate-950 sm:p-9">
        <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-700"><LogIn size={15} /> Secure account access</div>
        <h1 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">Log in to StockPro</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">{user ? `Signed in as ${user.email || user.displayName}.` : authMessage}</p>
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <label className="grid gap-1 text-sm font-bold">Email<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900" /></label>
          <label className="grid gap-1 text-sm font-bold">Password<input type="password" required minLength={8} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900" /></label>
          <button disabled={!readiness.configured || submitting} className="inline-flex items-center justify-center gap-2 bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"><LogIn size={16} /> {submitting ? 'Signing in...' : 'Log in'}</button>
        </form>
        <p className="mt-4 border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">Status: {authStatus}. {message}</p>
        <Link to="/signup" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-700"><UserPlus size={15} /> Create account</Link>
        <p className="mt-6 flex gap-2 text-xs font-semibold text-slate-500"><ShieldCheck size={15} /> Server-verified sessions only. No logged-in user is synthesized.</p>
      </section>
    </div>
  );
}
