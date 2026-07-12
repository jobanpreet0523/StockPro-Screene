import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { authenticatedFetch } from '../../core/supabaseClient';
import { captureSafeEvent } from '../../lib/posthog';
import { readApi } from '../../core/apiClient';
import ProSetupPanel from './ProSetupPanel';

interface Watchlist { id: string; name: string }
interface WatchlistItem { id: string; symbol: string; exchange: string }

export default function ProWatchlist() {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [selected, setSelected] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editingName, setEditingName] = useState('');

  const query = useQuery({
    queryKey: ['watchlists'],
    queryFn: () => readApi<{ status?: string; message?: string; data?: Watchlist[] }>('/api/watchlists', {}, authenticatedFetch),
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
  const lists = Array.isArray(query.data?.payload.data) ? query.data.payload.data : [];
  const ready = query.data?.state === 'ok';

  const itemsQuery = useQuery({
    queryKey: ['watchlist-items', selected],
    queryFn: () => readApi<{ status?: string; message?: string; data?: WatchlistItem[] }>(`/api/watchlists/${selected}/items`, {}, authenticatedFetch),
    enabled: ready && Boolean(selected),
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
  const items = Array.isArray(itemsQuery.data?.payload.data) ? itemsQuery.data.payload.data : [];

  const create = async () => {
    const result = await readApi('/api/watchlists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }, authenticatedFetch);
    setMessage(String(result.payload.message || 'Watchlist request completed.'));
    if (result.statusCode === 201) { setName(''); captureSafeEvent('watchlist_created'); await query.refetch(); }
  };
  const remove = async (id: string) => {
    const result = await readApi(`/api/watchlists/${id}`, { method: 'DELETE' }, authenticatedFetch);
    setMessage(String(result.payload.message || 'Delete request completed.'));
    if (result.state === 'ok') { if (selected === id) setSelected(''); await query.refetch(); }
  };
  const rename = async () => {
    const result = await readApi(`/api/watchlists/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editingName }) }, authenticatedFetch);
    setMessage(String(result.payload.message || 'Rename request completed.'));
    if (result.state === 'ok') { setEditingId(''); setEditingName(''); await query.refetch(); }
  };
  const add = async () => {
    if (!selected) return setMessage('Select a watchlist first.');
    const result = await readApi(`/api/watchlists/${selected}/items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol: symbol.toUpperCase(), exchange: 'NSE' }) }, authenticatedFetch);
    setMessage(String(result.payload.message || 'Save request completed.'));
    if (result.statusCode === 201) { setSymbol(''); await itemsQuery.refetch(); }
  };
  const removeSymbol = async (savedSymbol: string) => {
    const result = await readApi(`/api/watchlists/${selected}/items/${encodeURIComponent(savedSymbol)}`, { method: 'DELETE' }, authenticatedFetch);
    setMessage(String(result.payload.message || 'Remove request completed.'));
    if (result.state === 'ok') await itemsQuery.refetch();
  };

  if (query.isPending) return <ProSetupPanel title="Watchlists" message="Checking private watchlist storage..." />;
  if (!ready) return <ProSetupPanel title="Watchlist setup required" message={String(query.data?.payload.message || 'Authenticated watchlist storage is required.')}><Link to="/account" className="font-bold text-emerald-700 underline">Open account</Link></ProSetupPanel>;

  return (
    <div>
      <h1 className="text-2xl font-black">Watchlist</h1>
      <p className="mt-1 text-sm font-semibold text-slate-600">Private per-user watchlists. Saved symbols remain visible without invented prices when no provider is configured.</p>

      <section className="mt-5 grid gap-3 border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_auto]">
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="Watchlist name" className="border border-slate-300 px-3 py-2" />
        <button type="button" onClick={() => void create()} disabled={!name.trim()} className="bg-emerald-500 px-4 py-2 text-sm font-black disabled:opacity-50">Create watchlist</button>
      </section>

      <div className="mt-4 grid gap-2">
        {lists.length ? lists.map((list) => (
          <article key={list.id} className="border border-slate-200 bg-white p-4">
            {editingId === list.id ? (
              <div className="flex flex-wrap gap-2">
                <input value={editingName} onChange={(event) => setEditingName(event.target.value)} className="min-w-0 flex-1 border border-slate-300 px-3 py-2" />
                <button type="button" onClick={() => void rename()} disabled={!editingName.trim()} className="bg-slate-950 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Save name</button>
                <button type="button" onClick={() => setEditingId('')} className="px-3 py-2 text-xs font-bold">Cancel</button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button type="button" onClick={() => setSelected(list.id)} className="font-bold text-emerald-800">{list.name}</button>
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setEditingId(list.id); setEditingName(list.name); }} className="text-xs font-bold text-slate-700">Rename</button>
                  <button type="button" onClick={() => void remove(list.id)} className="text-xs font-bold text-rose-700">Delete</button>
                </div>
              </div>
            )}
          </article>
        )) : <ProSetupPanel title="No watchlist yet" message="Create a watchlist above. No symbols or prices are inserted automatically." />}
      </div>

      {selected && (
        <section className="mt-5 border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input value={symbol} onChange={(event) => setSymbol(event.target.value)} placeholder="NSE symbol" className="border border-slate-300 px-3 py-2" />
            <button type="button" onClick={() => void add()} disabled={!symbol.trim()} className="bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Add stock</button>
          </div>
          <div className="mt-4 grid gap-2">
            {items.length ? items.map((item) => <div key={item.id} className="flex items-center justify-between border-t border-slate-100 pt-2 text-sm"><span className="font-bold">{item.exchange}:{item.symbol} <span className="font-normal text-slate-500">price unavailable until provider setup</span></span><button type="button" onClick={() => void removeSymbol(item.symbol)} className="text-xs font-bold text-rose-700">Remove</button></div>) : <p className="text-xs font-semibold text-slate-500">No saved symbols in this watchlist.</p>}
          </div>
        </section>
      )}
      <p role="status" className="mt-3 text-xs font-semibold text-slate-500">{message}</p>
    </div>
  );
}
