import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authenticatedFetch } from '../../core/supabaseClient';
import { captureSafeEvent } from '../../lib/posthog';
import ProSetupPanel from './ProSetupPanel';

interface AlertRow { id: string; name: string; type: string; status: string }

export default function ProSavedWork() {
  const [alertName,setAlertName]=useState('');
  const [symbol,setSymbol]=useState('');
  const [type,setType]=useState<'price'|'oi'|'scanner'>('price');
  const [condition,setCondition]=useState<'above'|'below'|'change'|'match'>('above');
  const [threshold,setThreshold]=useState('');
  const [message,setMessage]=useState('');
  const query=useQuery({queryKey:['saved-work'],queryFn:async()=>{const r=await authenticatedFetch('/api/saved-work');const p=await r.json().catch(()=>null);if(!r.ok)throw new Error(p?.message||'Saved-work storage requires setup.');return p;},refetchInterval:false});
  if(query.isError)return <ProSetupPanel title="Saved Work setup required" message={query.error instanceof Error?query.error.message:'Authenticated storage is unavailable.'}/>;
  const alerts:AlertRow[]=Array.isArray(query.data?.data?.alerts)?query.data.data.alerts:[];

  const createAlert=async()=>{
    const payload={name:alertName,type,symbol:symbol.toUpperCase()||undefined,condition,threshold:threshold?Number(threshold):undefined,emailEnabled:false};
    const r=await authenticatedFetch('/api/alerts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const p=await r.json().catch(()=>null);setMessage(p?.message||'Alert request completed.');
    if(r.ok){setAlertName('');setSymbol('');setThreshold('');captureSafeEvent('alert_created');await query.refetch();}
  };
  const removeAlert=async(id:string)=>{const r=await authenticatedFetch(`/api/alerts/${id}`,{method:'DELETE'});const p=await r.json().catch(()=>null);setMessage(p?.message||'Delete request completed.');if(r.ok)await query.refetch();};

  return <div><h1 className="text-2xl font-black">Saved Work</h1><p className="mt-1 text-sm font-semibold text-slate-600">Private saved screeners and alert definitions. No delivery is claimed until a real provider observation triggers a configured notification.</p>
    <section className="mt-5 border border-slate-200 bg-white p-5"><h2 className="font-black">Create research alert</h2><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><input value={alertName} onChange={(e)=>setAlertName(e.target.value)} placeholder="Alert name" className="border border-slate-300 px-3 py-2"/><select value={type} onChange={(e)=>setType(e.target.value as typeof type)} className="border border-slate-300 px-3 py-2"><option value="price">Price alert</option><option value="oi">OI alert</option><option value="scanner">Scanner alert</option></select><input value={symbol} onChange={(e)=>setSymbol(e.target.value)} placeholder="NSE symbol" className="border border-slate-300 px-3 py-2"/><select value={condition} onChange={(e)=>setCondition(e.target.value as typeof condition)} className="border border-slate-300 px-3 py-2"><option value="above">Above</option><option value="below">Below</option><option value="change">Change</option><option value="match">Scanner match</option></select><input type="number" value={threshold} onChange={(e)=>setThreshold(e.target.value)} placeholder="Threshold" className="border border-slate-300 px-3 py-2"/><button type="button" onClick={()=>void createAlert()} disabled={!alertName.trim()} className="bg-emerald-500 px-4 py-2 text-sm font-black disabled:opacity-50">Save alert</button></div><p className="mt-3 text-xs font-semibold text-slate-500">{message}</p></section>
    <section className="mt-4"><h2 className="mb-3 font-black">Alerts</h2>{alerts.length?alerts.map((alert)=><article key={alert.id} className="mb-2 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"><span><strong>{alert.name}</strong><small className="ml-2 text-slate-500">{alert.type} · {alert.status}</small></span><button type="button" onClick={()=>void removeAlert(alert.id)} className="text-xs font-bold text-rose-700">Delete</button></article>):<ProSetupPanel title="No alerts" message="No alert has been saved. Delivery remains unclaimed."/>}</section>
    <div className="mt-4 grid gap-3 md:grid-cols-2">{['Saved screeners','Saved charts','Saved notes','Saved exports'].map((name)=><ProSetupPanel key={name} title={name} message="No saved item exists. StockPro does not create placeholder work."/>)}</div>
  </div>;
}
