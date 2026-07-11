import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { authenticatedFetch } from '../../core/supabaseClient';
import { captureSafeEvent } from '../../lib/posthog';
import ProSetupPanel from './ProSetupPanel';

interface Watchlist { id: string; name: string }

export default function ProWatchlist() {
  const [name,setName]=useState('');
  const [symbol,setSymbol]=useState('');
  const [selected,setSelected]=useState('');
  const [message,setMessage]=useState('');
  const query = useQuery({ queryKey: ['watchlists'], queryFn: async () => { const r = await authenticatedFetch('/api/watchlists'); const p = await r.json().catch(() => null); if (!r.ok) throw new Error(p?.message || 'Watchlist storage unavailable.'); return p; }, refetchInterval: false });
  const lists: Watchlist[] = Array.isArray(query.data?.data) ? query.data.data : [];

  const create=async()=>{
    const r=await authenticatedFetch('/api/watchlists',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});
    const p=await r.json().catch(()=>null);setMessage(p?.message||'Watchlist request completed.');
    if(r.ok){setName('');captureSafeEvent('watchlist_created');await query.refetch();}
  };
  const remove=async(id:string)=>{const r=await authenticatedFetch(`/api/watchlists/${id}`,{method:'DELETE'});const p=await r.json().catch(()=>null);setMessage(p?.message||'Delete request completed.');if(r.ok)await query.refetch();};
  const add=async()=>{if(!selected)return setMessage('Select a watchlist first.');const r=await authenticatedFetch(`/api/watchlists/${selected}/items`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({symbol:symbol.toUpperCase(),exchange:'NSE'})});const p=await r.json().catch(()=>null);setMessage(p?.message||'Save request completed.');if(r.ok)setSymbol('');};

  if (query.isError) return <ProSetupPanel title="Watchlist setup required" message={query.error instanceof Error ? query.error.message : 'Authenticated watchlist storage is required.'}><Link to="/account" className="font-bold text-emerald-700 underline">Open account</Link></ProSetupPanel>;
  return <div><h1 className="text-2xl font-black">Watchlist</h1><p className="mt-1 text-sm font-semibold text-slate-600">Private account watchlists. Free and Pro limits are enforced by verified access policy when configured.</p>
    <section className="mt-5 grid gap-3 border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_auto]"><input value={name} onChange={(e)=>setName(e.target.value)} maxLength={80} placeholder="Watchlist name" className="border border-slate-300 px-3 py-2"/><button type="button" onClick={()=>void create()} disabled={!name.trim()} data-analytics-event="watchlist_created" className="bg-emerald-500 px-4 py-2 text-sm font-black disabled:opacity-50">Create watchlist</button></section>
    <section className="mt-3 grid gap-3 border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_1fr_auto]"><select value={selected} onChange={(e)=>setSelected(e.target.value)} className="border border-slate-300 px-3 py-2"><option value="">Select watchlist</option>{lists.map((list)=><option key={list.id} value={list.id}>{list.name}</option>)}</select><input value={symbol} onChange={(e)=>setSymbol(e.target.value)} placeholder="NSE symbol" className="border border-slate-300 px-3 py-2"/><button type="button" onClick={()=>void add()} disabled={!symbol.trim()||!selected} className="bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Add stock</button></section>
    <p className="mt-3 text-xs font-semibold text-slate-500">{message}</p>
    <div className="mt-5">{lists.length ? lists.map((list) => <article key={list.id} className="mb-2 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"><span className="font-bold">{list.name}</span><button type="button" onClick={()=>void remove(list.id)} className="text-xs font-bold text-rose-700">Delete</button></article>) : <ProSetupPanel title="No watchlist yet" message="Create a watchlist above. No stocks are inserted automatically." />}</div>
  </div>;
}
