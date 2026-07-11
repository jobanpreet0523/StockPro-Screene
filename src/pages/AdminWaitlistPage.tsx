import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, Database, Download, KeyRound, LockKeyhole, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import type { AdminWaitlistResponse, WaitlistLead } from '../core/waitlist';
import StockProDataTable from '../components/tables/StockProDataTable';

const TOKEN_STORAGE_KEY = 'stockpro_waitlist_admin_token';
type PageState = 'checking' | 'setup_required' | 'locked' | 'loading' | 'ready' | 'error';

function escapeCsv(value: unknown) {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export default function AdminWaitlistPage() {
  const [pageState, setPageState] = useState<PageState>('checking');
  const [message, setMessage] = useState('Checking waitlist admin setupâ€¦');
  const [tokenInput, setTokenInput] = useState('');
  const [rows, setRows] = useState<WaitlistLead[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [interestFilter, setInterestFilter] = useState('');
  const columns = useMemo<ColumnDef<WaitlistLead, any>[]>(() => [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'interest', header: 'Interest', cell: ({ getValue }) => getValue() || '-' },
    { accessorKey: 'use_case', header: 'Use case', cell: ({ getValue }) => getValue() || '-' },
    { accessorKey: 'source_page', header: 'Source page', cell: ({ getValue }) => getValue() || '-' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'created_at', header: 'Created at', cell: ({ getValue }) => new Date(String(getValue())).toLocaleString('en-IN') },
  ], []);

  const requestRows = async (token: string, saveToken: boolean) => {
    if (!token) {
      setPageState('locked');
      setMessage('Enter the server-configured admin access token.');
      return false;
    }

    setPageState('loading');
    setMessage('Loading waitlist recordsâ€¦');
    const params = new URLSearchParams({ limit: '50' });
    if (statusFilter.trim()) params.set('status', statusFilter.trim());
    if (interestFilter.trim()) params.set('interest', interestFilter.trim());

    try {
      const response = await fetch(`/api/admin/waitlist?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({ status: 'error', message: 'Admin API returned an unreadable response.' })) as AdminWaitlistResponse;

      if (payload.status === 'setup_required') {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        setRows([]);
        setPageState('setup_required');
        setMessage(payload.message);
        return false;
      }
      if (response.status === 401 || payload.status === 'unauthorized') {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        setRows([]);
        setPageState('locked');
        setMessage(payload.message || 'The admin token was not accepted.');
        return false;
      }
      if (!response.ok || payload.status !== 'ok' || !Array.isArray(payload.data)) {
        setRows([]);
        setPageState('error');
        setMessage(payload.message || 'Waitlist records could not be loaded.');
        return false;
      }
      if (saveToken) sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      setRows(payload.data);
      setPageState('ready');
      setMessage(`Loaded ${payload.data.length} waitlist record${payload.data.length === 1 ? '' : 's'}.`);
      return true;
    } catch {
      setRows([]);
      setPageState('error');
      setMessage('Waitlist admin API could not be reached.');
      return false;
    }
  };

  useEffect(() => {
    const savedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY) || '';
    if (savedToken) {
      setTokenInput(savedToken);
      void requestRows(savedToken, false);
      return;
    }

    const checkSetup = async () => {
      try {
        const response = await fetch('/api/admin/waitlist');
        const payload = await response.json().catch(() => ({ status: 'error', message: 'Admin API returned an unreadable response.' })) as AdminWaitlistResponse;
        if (payload.status === 'setup_required') {
          setPageState('setup_required');
          setMessage(payload.message);
        } else if (response.status === 401 || payload.status === 'unauthorized') {
          setPageState('locked');
          setMessage('Admin API is configured. Enter the admin access token to continue.');
        } else {
          setPageState('error');
          setMessage(payload.message || 'Waitlist admin setup could not be verified.');
        }
      } catch {
        setPageState('error');
        setMessage('Waitlist admin API could not be reached.');
      }
    };
    void checkSetup();
    // The initial setup check intentionally runs once per page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unlock = async (event: FormEvent) => {
    event.preventDefault();
    await requestRows(tokenInput.trim(), true);
  };

  const lock = () => {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    setTokenInput('');
    setRows([]);
    setPageState('locked');
    setMessage('Admin access is locked for this tab.');
  };

  const exportCsv = () => {
    if (rows.length === 0) return;
    const headers = ['name', 'email', 'interest', 'use_case', 'source_page', 'status', 'created_at'];
    const csv = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => headers.map((header) => escapeCsv(row[header as keyof WaitlistLead])).join(',')),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `stockpro-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-violet-600 dark:text-violet-400"><ShieldCheck size={14} /> Hidden admin foundation</div>
              <h1 className="mt-2 text-3xl font-black tracking-tight">Waitlist leads</h1>
              <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">Server-authenticated demand review. Tokens stay in this tab's session storage only.</p>
            </div>
            {pageState === 'ready' && <button type="button" onClick={lock} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-xs font-black dark:border-slate-700"><LockKeyhole size={14} /> Lock admin</button>}
          </div>
        </header>

        {pageState === 'setup_required' ? (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
            <AlertTriangle size={26} />
            <h2 className="mt-3 text-xl font-black">Admin setup required</h2>
            <p className="mt-2 text-sm font-semibold">{message}</p>
            <div className="mt-4 rounded-2xl bg-white/70 p-4 font-mono text-xs leading-6 dark:bg-slate-950/40">
              Configure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_WAITLIST_TABLE, ADMIN_ACCESS_TOKEN, and WAITLIST_ADMIN_ENABLED=true. Then follow docs/SUPABASE_WAITLIST_SETUP.md.
            </div>
          </section>
        ) : pageState === 'error' ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm font-bold text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200">
            <AlertTriangle size={20} />
            <p className="mt-3">{message}</p>
            <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => void requestRows(tokenInput, false)} className="rounded-lg bg-rose-700 px-4 py-2 text-xs font-black text-white">Retry</button><button type="button" onClick={lock} className="rounded-lg border border-rose-300 px-4 py-2 text-xs font-black">Lock admin</button></div>
          </section>
        ) : pageState === 'locked' || pageState === 'checking' ? (
          <form onSubmit={unlock} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <KeyRound size={24} className="text-violet-500" />
            <h2 className="mt-3 text-xl font-black">Admin token</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{message}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input type="password" value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} autoComplete="off" spellCheck={false} aria-label="Admin access token" className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-950" />
              <button type="submit" disabled={pageState === 'checking'} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50"><KeyRound size={15} /> Unlock</button>
            </div>
          </form>
        ) : (
          <>
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
                <label className="text-xs font-black text-slate-600 dark:text-slate-300">Status
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950">
                    <option value="">All statuses</option><option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="closed">Closed</option><option value="archived">Archived</option>
                  </select>
                </label>
                <label className="text-xs font-black text-slate-600 dark:text-slate-300">Interest
                  <input value={interestFilter} onChange={(event) => setInterestFilter(event.target.value)} maxLength={120} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950" />
                </label>
                <button type="button" onClick={() => void requestRows(tokenInput, false)} disabled={pageState === 'loading'} className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-black text-white disabled:opacity-50 dark:bg-white dark:text-slate-950"><Search size={14} /> Apply filters</button>
                <button type="button" onClick={exportCsv} disabled={rows.length === 0} className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-xs font-black disabled:opacity-50 dark:border-slate-700"><Download size={14} /> Export CSV</button>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">{pageState === 'loading' ? <RefreshCw size={14} className="animate-spin" /> : <Database size={14} />} {message}</div>
            </section>

            <section>
              <StockProDataTable data={rows} columns={columns} emptyMessage="No waitlist records match the current filters." filterPlaceholder="Filter loaded waitlist records" onExportCsv={exportCsv} />
            </section>
          </>
        )}
      </div>
    </main>
  );
}

