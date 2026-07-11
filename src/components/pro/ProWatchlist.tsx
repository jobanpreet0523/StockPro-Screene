import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import ProSetupPanel from './ProSetupPanel';

export default function ProWatchlist() {
  const query = useQuery({ queryKey: ['watchlists'], queryFn: async () => { const r = await fetch('/api/watchlists'); const p = await r.json().catch(() => null); if (!r.ok) throw new Error(p?.message || 'Watchlist storage unavailable.'); return p; }, refetchInterval: false });
  if (query.isError) return <ProSetupPanel title="Watchlist setup required" message={query.error instanceof Error ? query.error.message : 'Authenticated watchlist storage is required.'}><Link to="/account" className="font-bold text-emerald-700 underline">Open account</Link></ProSetupPanel>;
  const lists = Array.isArray(query.data?.data) ? query.data.data : [];
  return <div><h1 className="text-2xl font-black">Watchlist</h1><p className="mt-1 text-sm font-semibold text-slate-600">Saved symbols are private to the authenticated account.</p><div className="mt-5">{lists.length ? lists.map((list: { id: string; name: string }) => <article key={list.id} className="mb-2 rounded-lg border border-slate-200 bg-white p-4 font-bold">{list.name}</article>) : <ProSetupPanel title="No watchlist yet" message="Create a watchlist after account storage is configured. No stocks are inserted automatically." />}</div></div>;
}
