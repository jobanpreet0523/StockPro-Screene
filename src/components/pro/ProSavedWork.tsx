import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authenticatedFetch } from '../../core/supabaseClient';
import { captureSafeEvent } from '../../lib/posthog';
import { readApi } from '../../core/apiClient';
import ProSetupPanel from './ProSetupPanel';

interface AlertRow { id: string; name: string; type: string; status: 'active' | 'paused' | 'disabled' }

export default function ProSavedWork() {
  const [alertName, setAlertName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState<'price' | 'oi' | 'crt'>('price');
  const [condition, setCondition] = useState<'above' | 'below' | 'change' | 'match'>('above');
  const [threshold, setThreshold] = useState('');
  const [scannerId, setScannerId] = useState('');
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editingName, setEditingName] = useState('');

  const query = useQuery({
    queryKey: ['saved-work'],
    queryFn: () => readApi<{ status?: string; message?: string; data?: { alerts?: AlertRow[] } }>('/api/saved-work', {}, authenticatedFetch),
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
  if (query.isPending) return <ProSetupPanel title="Saved Work" message="Checking private saved research..." />;
  if (query.data?.state !== 'ok') return <ProSetupPanel title="Saved Work setup required" message={String(query.data?.payload.message || 'Authenticated storage is unavailable.')} />;
  const alerts = Array.isArray(query.data.payload.data?.alerts) ? query.data.payload.data.alerts : [];

  const createAlert = async () => {
    const payload = {
      name: alertName,
      type,
      symbol: symbol.toUpperCase() || undefined,
      condition: type === 'crt' ? 'match' : condition,
      threshold: threshold ? Number(threshold) : undefined,
      scannerId: type === 'crt' ? scannerId || undefined : undefined,
      emailEnabled,
    };
    const result = await readApi('/api/alerts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }, authenticatedFetch);
    setMessage(String(result.payload.message || 'Alert request completed.'));
    if (result.statusCode === 201) { setAlertName(''); setSymbol(''); setThreshold(''); setScannerId(''); captureSafeEvent('alert_created'); await query.refetch(); }
  };
  const updateAlert = async (id: string, update: Record<string, unknown>) => {
    const result = await readApi(`/api/alerts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(update) }, authenticatedFetch);
    setMessage(String(result.payload.message || 'Alert update completed.'));
    if (result.state === 'ok') { setEditingId(''); setEditingName(''); await query.refetch(); }
  };
  const removeAlert = async (id: string) => {
    const result = await readApi(`/api/alerts/${id}`, { method: 'DELETE' }, authenticatedFetch);
    setMessage(String(result.payload.message || 'Delete request completed.'));
    if (result.state === 'ok') await query.refetch();
  };

  return (
    <div>
      <h1 className="text-2xl font-black">Saved Work</h1>
      <p className="mt-1 text-sm font-semibold text-slate-600">Private saved screeners and real alert definitions. Delivery is never claimed until a source-backed observation triggers a configured notification.</p>
      <section className="mt-5 border border-slate-200 bg-white p-5">
        <h2 className="font-black">Create research alert</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input value={alertName} onChange={(event) => setAlertName(event.target.value)} placeholder="Alert name" className="border border-slate-300 px-3 py-2" />
          <select value={type} onChange={(event) => setType(event.target.value as typeof type)} className="border border-slate-300 px-3 py-2"><option value="price">Price alert</option><option value="crt">CRT scan alert</option><option value="oi">OI alert</option></select>
          <input value={symbol} onChange={(event) => setSymbol(event.target.value)} placeholder="NSE symbol" className="border border-slate-300 px-3 py-2" />
          {type === 'crt' ? <input value={scannerId} onChange={(event) => setScannerId(event.target.value)} placeholder="Saved scan or scanner ID" className="border border-slate-300 px-3 py-2" /> : <>
            <select value={condition} onChange={(event) => setCondition(event.target.value as typeof condition)} className="border border-slate-300 px-3 py-2"><option value="above">Above</option><option value="below">Below</option><option value="change">Change</option></select>
            <input type="number" value={threshold} onChange={(event) => setThreshold(event.target.value)} placeholder="Threshold" className="border border-slate-300 px-3 py-2" />
          </>}
          <label className="inline-flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={emailEnabled} onChange={(event) => setEmailEnabled(event.target.checked)} /> Email when Resend is configured</label>
          <button type="button" onClick={() => void createAlert()} disabled={!alertName.trim()} className="bg-emerald-500 px-4 py-2 text-sm font-black disabled:opacity-50">Save alert</button>
        </div>
        <p role="status" className="mt-3 text-xs font-semibold text-slate-500">{message}</p>
      </section>

      <section className="mt-4">
        <h2 className="mb-3 font-black">Alerts</h2>
        {alerts.length ? alerts.map((alert) => <article key={alert.id} className="mb-2 border border-slate-200 bg-white p-4">
          {editingId === alert.id ? <div className="flex flex-wrap gap-2"><input value={editingName} onChange={(event) => setEditingName(event.target.value)} className="min-w-0 flex-1 border border-slate-300 px-3 py-2"/><button type="button" onClick={() => void updateAlert(alert.id, { name: editingName })} disabled={!editingName.trim()} className="bg-slate-950 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Save</button><button type="button" onClick={() => setEditingId('')} className="text-xs font-bold">Cancel</button></div> :
          <div className="flex flex-wrap items-center justify-between gap-3"><span><strong>{alert.name}</strong><small className="ml-2 text-slate-500">{alert.type} · {alert.status} · delivery not sent</small></span><div className="flex gap-3"><button type="button" onClick={() => { setEditingId(alert.id); setEditingName(alert.name); }} className="text-xs font-bold">Edit</button><button type="button" onClick={() => void updateAlert(alert.id, { status: alert.status === 'paused' ? 'active' : 'paused' })} className="text-xs font-bold text-amber-700">{alert.status === 'paused' ? 'Resume' : 'Pause'}</button><button type="button" onClick={() => void removeAlert(alert.id)} className="text-xs font-bold text-rose-700">Delete</button></div></div>}
        </article>) : <ProSetupPanel title="No alerts" message="No alert has been saved. No delivery or sent status is fabricated." />}
      </section>
      <div className="mt-4 grid gap-3 md:grid-cols-2">{['Saved screeners', 'Saved charts', 'Saved notes', 'Saved exports'].map((name) => <ProSetupPanel key={name} title={name} message="No saved item exists. StockPro does not create placeholder work." />)}</div>
    </div>
  );
}
