import { Link } from 'react-router-dom';
import { useProDashboard } from '../../hooks/useProDashboard';
import ProSetupPanel from './ProSetupPanel';

const labels: Record<string, string> = {
  ok: 'configured',
  configured: 'configured',
  connected: 'connected',
  test_ready: 'test ready',
  setup_required: 'setup required',
  unauthenticated: 'login required',
  not_connected: 'broker required',
  provider_required: 'provider required',
  unavailable: 'unavailable',
  error: 'unavailable',
};

export default function ProDashboard() {
  const query = useProDashboard();
  if (query.isPending) return <ProSetupPanel title="Dashboard" message="Checking verified services..." />;
  if (query.isError || !query.data) return <ProSetupPanel title="Dashboard unavailable" message="Verified dashboard services could not be reached. No market, broker, alert, or subscription state is assumed." />;

  const items = [
    ['Pro readiness', query.data.readiness],
    ['Market status', query.data.market],
    ['Top indices', query.data.indices],
    ['Broker status', query.data.broker],
    ['Watchlists', query.data.watchlists],
    ['Trial or subscription', query.data.trial],
    ['Billing readiness', query.data.billing],
  ] as const;

  const brokerReady = query.data.broker.state === 'connected';
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Dashboard</h1>
          <p className="mt-1 text-sm font-semibold text-slate-600">Verified research and account readiness in one view.</p>
        </div>
        {!brokerReady && <Link to="/connect-broker" data-analytics-event="connect_broker_click" className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-black text-slate-950">Connect your broker for live data</Link>}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map(([label, value]) => (
          <article key={label} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold text-slate-500">{label}</p>
            <p className="mt-2 text-sm font-black">{labels[value.state] || value.state.replaceAll('_', ' ')}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{String(value.payload.message || 'No verified values available.')}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
