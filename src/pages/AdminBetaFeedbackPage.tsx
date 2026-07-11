import { useState } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';

interface FeedbackRow { id: string; message: string; source_page?: string; user_id?: string; created_at: string }

export default function AdminBetaFeedbackPage() {
  const [token,setToken]=useState('');
  const [rows,setRows]=useState<FeedbackRow[]>([]);
  const [message,setMessage]=useState('Enter the server-configured admin token to load feedback.');
  const [loading,setLoading]=useState(false);

  const load=async()=>{
    setLoading(true);
    try{
      const response=await fetch('/api/admin/beta-feedback',{headers:{'X-Admin-Token':token}});
      const payload=await response.json().catch(()=>null);
      if(!response.ok)throw new Error(payload?.message||'Feedback administration unavailable.');
      setRows(Array.isArray(payload.data)?payload.data:[]);
      setMessage(`${payload.data?.length||0} feedback record(s) loaded.`);
    }catch(error){setRows([]);setMessage(error instanceof Error?error.message:'Feedback administration unavailable.');}
    finally{setLoading(false);}
  };

  return <div className="lg:col-span-12">
    <section className="border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
      <h1 className="text-2xl font-black">Beta feedback administration</h1>
      <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">Restricted view. The token remains in memory only and is never persisted.</p>
      <div className="mt-5 flex max-w-xl gap-2"><input type="password" value={token} onChange={(e)=>setToken(e.target.value)} placeholder="Admin access token" className="min-w-0 flex-1 border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"/><button type="button" onClick={()=>void load()} disabled={!token||loading} className="inline-flex items-center gap-2 bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><RefreshCw size={15}/>{loading?'Loading...':'Load'}</button></div>
      <p className="mt-3 text-xs font-semibold text-slate-500">{message}</p>
      <div className="mt-5 grid gap-3">{rows.map((row)=><article key={row.id} className="rounded-lg border border-slate-200 p-4"><p className="text-sm font-semibold">{row.message}</p><p className="mt-2 text-xs text-slate-500">{row.source_page||'unknown source'} · {new Date(row.created_at).toLocaleString()}</p></article>)}</div>
      <p className="mt-5 flex items-start gap-2 text-xs font-semibold text-slate-500"><ShieldCheck size={15}/>Do not paste passwords, broker tokens, payment credentials, or user secrets into feedback.</p>
    </section>
  </div>;
}
