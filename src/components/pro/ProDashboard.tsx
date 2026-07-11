import { useProDashboard } from '../../hooks/useProDashboard';
import ProSetupPanel from './ProSetupPanel';

export default function ProDashboard() {
  const query = useProDashboard();
  if (query.isPending) return <ProSetupPanel title="Dashboard" message="Checking verified services..." />;
  if (query.isError || !query.data) return <ProSetupPanel title="Dashboard unavailable" message="Verified dashboard services could not be reached. No market, broker, alert, or subscription state is assumed." />;
  const items = [
    ['Market status', query.data.market], ['Top indices', query.data.indices], ['Broker status', query.data.broker],
    ['Trial or subscription', query.data.trial], ['Billing readiness', query.data.billing],
  ] as const;
  return <div><h1 className="text-2xl font-black">Dashboard</h1><p className="mt-1 text-sm font-semibold text-slate-600">Verified research and account readiness in one view.</p><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.map(([label,value]) => <article key={label} className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-2 text-sm font-black">{value.ok ? 'configured' : 'setup required'}</p><p className="mt-1 text-xs font-semibold text-slate-500">{String((value.payload as { message?: string } | null)?.message || 'No verified values available.')}</p></article>)}</div></div>;
}
