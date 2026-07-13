import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import {
  Activity, ArrowRight, BarChart3, CalendarDays, ChevronDown, FileSearch,
  Flame, KeyRound, LayoutDashboard, Menu, Newspaper, Radar, ScanSearch,
  Search, UserRound, X,
} from 'lucide-react';
import StockProSearch from './search/StockProSearch';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedFetch } from '../core/supabaseClient';
import { fetchMarketData } from '../core/marketDataClient';
import type { MarketDataEnvelope, MarketIndex } from '../core/marketDataProvider';
import { getMarketStatus } from '../utils/marketStatus';
import heroImage from '../assets/images/urban_trading_skyscrapers_1780886767951.png';
import { ReadinessPill, SectionHeading, TrackedLink, useVisibleOnce } from './landing/LandingPrimitives';

const DeferredLandingSections = lazy(() => import('./landing/LandingDeferredSections'));

const productGroups = [
  { label: 'Products', links: [
    { label: 'Stock Screener', to: '/screener' }, { label: 'Scanner', to: '/scanner' },
    { label: 'CRT Scanner', to: '/crt-scanner' }, { label: 'Option Chain', to: '/option-chain' },
    { label: 'Signals', to: '/signals' },
  ] },
  { label: 'Research', links: [
    { label: 'Heatmap', to: '/heatmap' }, { label: 'News', to: '/news' },
    { label: 'Daily Brief', to: '/daily-brief' }, { label: 'Methodology', to: '/data-methodology' },
  ] },
  { label: 'Pro', links: [
    { label: 'Pro Workspace', to: '/pro' }, { label: 'Connect Broker', to: '/connect-broker' },
    { label: 'Pricing', to: '/pricing' },
  ] },
  { label: 'Resources', links: [
    { label: 'Blog', to: '/blog' }, { label: 'Status', to: '/status' },
    { label: 'Support', to: '/support-policy' }, { label: 'Contact', to: '/contact' },
  ] },
] as const;

const toolCards = [
  { name: 'Stock Screener', description: 'Combine fundamental, technical, volume, trend, price, and sector filters.', to: '/screener', icon: FileSearch, requirement: 'Provider required' },
  { name: 'Scanner', description: 'Build repeatable educational market scans without invented matches.', to: '/scanner', icon: ScanSearch, requirement: 'Provider required' },
  { name: 'CRT Scanner', description: 'Run free manual Forming, Confirmed, or Completed CRT research.', to: '/crt-scanner', icon: Radar, requirement: 'Free, provider required' },
  { name: 'Option Chain', description: 'Inspect provider-backed OI, PCR, expiry, and strike information.', to: '/option-chain', icon: BarChart3, requirement: 'Provider required' },
  { name: 'Signals', description: 'Review educational signal methodology and verified-source readiness.', to: '/signals', icon: Activity, requirement: 'Educational view' },
  { name: 'Heatmap', description: 'Open the market heatmap; unavailable values remain visibly unavailable.', to: '/heatmap', icon: Flame, requirement: 'Provider required' },
  { name: 'News', description: 'Read only articles returned by the configured content source.', to: '/news', icon: Newspaper, requirement: 'Content source required' },
  { name: 'Daily Brief', description: 'Open the dated research brief when real editorial content exists.', to: '/daily-brief', icon: CalendarDays, requirement: 'Content readiness' },
  { name: 'StockPro Pro', description: 'Use the light research workspace for watchlists, saved work, and charts.', to: '/pro', icon: LayoutDashboard, requirement: 'Account-aware' },
  { name: 'Broker Connect', description: 'Connect your own supported broker for read-only analytics.', to: '/connect-broker', icon: KeyRound, requirement: 'Login required' },
] as const;

function isVerifiedProviderEnvelope(envelope?: MarketDataEnvelope<MarketIndex[]> | null) {
  if (!envelope || envelope.status !== 'ok' || !Array.isArray(envelope.data)) return false;
  if (!Number.isFinite(Date.parse(envelope.timestamp))) return false;
  if (/(sample|demo|synthetic|fallback|none)/i.test(envelope.source)) return false;
  return envelope.data.every((item) => Number.isFinite(item.price) && Number.isFinite(item.changePercent));
}

function marketReadiness(envelope?: MarketDataEnvelope<MarketIndex[]> | null) {
  if (isVerifiedProviderEnvelope(envelope)) {
    if (envelope?.isLive === true) return { label: 'Verified live provider', tone: 'ready' as const };
    if (Number(envelope?.delayMinutes) > 0) return { label: `Verified delayed provider (${envelope?.delayMinutes}m)`, tone: 'pending' as const };
    return { label: 'Verified provider data', tone: 'ready' as const };
  }
  if (envelope?.status === 'provider_unavailable') return { label: 'Provider unavailable', tone: 'unavailable' as const };
  return { label: 'Provider setup required', tone: 'setup' as const };
}

export default function LandingProductPage() {
  const [documentVisible, setDocumentVisible] = useState(() => !document.hidden);
  const marketQuery = useQuery({
    queryKey: ['landing-market-overview'],
    queryFn: () => fetchMarketData<MarketIndex[]>('/api/live/indices', AbortSignal.timeout(10_000)),
    staleTime: 60_000,
    refetchInterval: documentVisible ? 120_000 : false,
    refetchOnWindowFocus: true,
    retry: false,
  });

  useEffect(() => {
    const root = document.documentElement;
    const restoreDark = root.classList.contains('dark');
    root.classList.remove('dark');
    const onVisibilityChange = () => setDocumentVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (restoreDark) root.classList.add('dark');
    };
  }, []);

  return (
    <div id="landing-page" className="min-h-screen bg-white text-slate-950">
      <LandingNavigation />
      <main>
        <LandingHero market={marketQuery.data} />
        <MarketOverview market={marketQuery.data} loading={marketQuery.isPending} />
        <ToolGrid market={marketQuery.data} />
        <CrtFeature />
        <ProWorkspace />
        <DeferredLandingMount />
      </main>
    </div>
  );
}

function LandingNavigation() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [location.pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-4 sm:px-6">
        <TrackedLink to="/" aria-current={location.pathname === '/' ? 'page' : undefined} className="flex shrink-0 items-center gap-2 text-sm font-black uppercase text-slate-950">
          <span className="flex h-8 w-8 items-center justify-center bg-blue-700 text-white"><BarChart3 size={17} aria-hidden /></span>
          <span>StockPro</span>
        </TrackedLink>
        <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="Primary navigation">
          {productGroups.map((group) => (
            <details key={group.label} className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-1 px-3 py-2 text-xs font-bold text-slate-600 hover:text-blue-700">
                {group.label}<ChevronDown size={13} aria-hidden />
              </summary>
              <div className="absolute left-0 top-10 w-56 border border-slate-200 bg-white p-2 shadow-xl">
                {group.links.map((link) => <TrackedLink key={link.to} to={link.to} aria-current={location.pathname === link.to ? 'page' : undefined} className={`block px-3 py-2.5 text-xs font-bold hover:bg-slate-50 hover:text-blue-700 ${location.pathname === link.to ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}>{link.label}</TrackedLink>)}
              </div>
            </details>
          ))}
        </nav>
        <div className="ml-auto hidden w-64 xl:block"><StockProSearch /></div>
        <TrackedLink to="/account" icon={UserRound} className="hidden items-center gap-2 border border-slate-300 px-3 py-2 text-xs font-black text-slate-800 hover:border-blue-400 hover:text-blue-700 sm:inline-flex">Account</TrackedLink>
        <button type="button" onClick={() => setMobileOpen(true)} className="inline-flex h-10 w-10 items-center justify-center border border-slate-300 text-slate-800 lg:hidden" aria-label="Open navigation menu" aria-expanded={mobileOpen} aria-controls="landing-mobile-menu"><Menu size={19} aria-hidden /></button>
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-[80] bg-slate-950/45 lg:hidden" onMouseDown={() => setMobileOpen(false)}>
          <aside id="landing-mobile-menu" className="ml-auto h-full w-[min(88vw,360px)] overflow-y-auto bg-white p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()} aria-label="Mobile navigation">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <span className="text-sm font-black uppercase">StockPro</span>
              <button type="button" onClick={() => setMobileOpen(false)} className="inline-flex h-10 w-10 items-center justify-center border border-slate-300" aria-label="Close navigation menu"><X size={18} aria-hidden /></button>
            </div>
            <div className="mt-5"><StockProSearch /></div>
            <nav className="mt-6 space-y-6" aria-label="Mobile primary navigation">
              {productGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] font-black uppercase text-slate-400">{group.label}</p>
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {group.links.map((link) => <TrackedLink key={link.to} to={link.to} aria-current={location.pathname === link.to ? 'page' : undefined} className={`px-2 py-2.5 text-xs font-bold hover:bg-slate-50 hover:text-blue-700 ${location.pathname === link.to ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}>{link.label}</TrackedLink>)}
                  </div>
                </div>
              ))}
            </nav>
            <TrackedLink to="/account" icon={UserRound} className="mt-7 flex w-full items-center justify-center gap-2 bg-blue-700 px-4 py-3 text-sm font-black text-white">Open account</TrackedLink>
          </aside>
        </div>
      )}
    </header>
  );
}

function LandingHero({ market }: { market?: MarketDataEnvelope<MarketIndex[]> }) {
  const readiness = marketReadiness(market);
  return (
    <section data-landing-section="hero" aria-labelledby="landing-hero-title" className="relative flex h-[calc(100svh-7.5rem)] min-h-[480px] max-h-[680px] items-center overflow-hidden bg-slate-950 text-white">
      <img src={heroImage} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-25" width="1536" height="1024" fetchPriority="high" />
      <div className="absolute inset-0 bg-slate-950/75" aria-hidden />
      <div className="relative mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <ReadinessPill tone={readiness.tone}>{readiness.label}</ReadinessPill>
            <span className="text-xs font-semibold text-slate-300">Educational research analytics. No trade execution.</span>
          </div>
          <h1 id="landing-hero-title" className="mt-5 max-w-3xl text-4xl font-black leading-[1.05] sm:text-5xl lg:text-6xl">StockPro research, from first screen to saved decision trail.</h1>
          <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-slate-200 sm:text-base">Screen Indian markets, run the free manual CRT workflow, connect your own broker for read-only data, and organize research without invented prices, promises, or signals.</p>
          <div className="mt-5 max-w-xl"><StockProSearch /></div>
          <div className="mt-5 flex flex-wrap gap-2">
            <TrackedLink to="/screener" icon={Search} showArrow className="inline-flex items-center gap-2 bg-blue-600 px-4 py-3 text-xs font-black text-white hover:bg-blue-500">Open Screener</TrackedLink>
            <TrackedLink to="/crt-scanner" event="crt_scan_click" icon={Radar} showArrow className="inline-flex items-center gap-2 border border-white/35 bg-white/10 px-4 py-3 text-xs font-black text-white hover:bg-white/20">Run CRT Scanner</TrackedLink>
            <TrackedLink to="/pro" icon={LayoutDashboard} showArrow className="inline-flex items-center gap-2 border border-white/35 bg-white/10 px-4 py-3 text-xs font-black text-white hover:bg-white/20">Explore Pro</TrackedLink>
            <TrackedLink to="/connect-broker" event="connect_broker_click" icon={KeyRound} showArrow className="inline-flex items-center gap-2 border border-emerald-300/60 bg-emerald-500/15 px-4 py-3 text-xs font-black text-emerald-100 hover:bg-emerald-500/25">Connect Broker</TrackedLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function MarketOverview({ market, loading }: { market?: MarketDataEnvelope<MarketIndex[]>; loading: boolean }) {
  const scheduled = useMemo(() => getMarketStatus(), []);
  const readiness = marketReadiness(market);
  const verified = isVerifiedProviderEnvelope(market);
  const requestedIndices = ['NIFTY 50', 'BANK NIFTY', 'FIN NIFTY', 'INDIA VIX'];
  return (
    <section data-landing-section="market-status" aria-labelledby="landing-market-title" className="border-b border-slate-200 bg-slate-50 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="Market status and index overview" id="landing-market-title" title="Know the source before reading the number" copy="Index values render only from a verified provider response. Scheduled exchange hours are labelled separately from provider market status." aside={<TrackedLink to="/screener" showArrow className="inline-flex items-center gap-2 text-sm font-black text-blue-700">Broader market tools</TrackedLink>} />
        <div className="mt-6 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          {requestedIndices.map((name) => {
            const needle = name.replace('INDIA ', '');
            const index = verified ? market?.data?.find((item) => item.name.toUpperCase().replace(/\s+/g, ' ').includes(needle)) : undefined;
            return (
              <div key={name} className="min-h-32 bg-white p-5">
                <p className="text-[10px] font-black uppercase text-slate-400">{name}</p>
                <p className="mt-3 font-mono text-xl font-black text-slate-950">{index ? index.price.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : loading ? 'Checking provider' : 'Unavailable'}</p>
                <p className={`mt-1 text-xs font-black ${index && index.changePercent >= 0 ? 'text-emerald-700' : index ? 'text-rose-700' : 'text-slate-500'}`}>{index ? `${index.changePercent >= 0 ? '+' : ''}${index.changePercent.toFixed(2)}%` : 'No substitute value shown'}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-5 grid gap-3 text-xs font-semibold text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
          <DataFact label="Market hours" value={`${scheduled.label} (schedule-based)`} />
          <DataFact label="Provider" value={market?.source && !/(sample|demo)/i.test(market.source) ? market.source : 'Not configured'} />
          <DataFact label="Timestamp" value={verified ? new Date(market!.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Unavailable'} />
          <div className="flex items-center"><ReadinessPill tone={readiness.tone}>{readiness.label}</ReadinessPill></div>
        </div>
      </div>
    </section>
  );
}

function DataFact({ label, value }: { label: string; value: string }) {
  return <div className="border-l-2 border-blue-600 pl-3"><span className="block text-[10px] font-black uppercase text-slate-400">{label}</span><span className="mt-1 block">{value}</span></div>;
}

function ToolGrid({ market }: { market?: MarketDataEnvelope<MarketIndex[]> }) {
  const providerReady = isVerifiedProviderEnvelope(market);
  return (
    <section data-landing-section="product-grid" aria-labelledby="landing-tools-title" className="border-b border-slate-200 bg-white py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="Product and research tools" id="landing-tools-title" title="One homepage, ten real destinations" copy="Every entry opens a working StockPro route. Tools that need market data, authentication, or content remain explicit about that dependency." />
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {toolCards.map(({ name, description, to, icon: Icon, requirement }) => (
            <TrackedLink key={to} to={to} className="group min-h-48 border border-slate-200 bg-white p-4 transition hover:border-blue-400 hover:shadow-md">
              <div className="flex items-start justify-between gap-3"><span className="flex h-9 w-9 items-center justify-center bg-slate-100 text-blue-700 group-hover:bg-blue-700 group-hover:text-white"><Icon size={18} aria-hidden /></span><ArrowRight size={15} className="text-slate-300 group-hover:text-blue-700" aria-hidden /></div>
              <h3 className="mt-5 text-sm font-black text-slate-950">{name}</h3>
              <p className="mt-2 text-xs font-medium leading-5 text-slate-600">{description}</p>
              <p className="mt-4 text-[10px] font-black uppercase text-amber-800">{requirement.includes('Provider') && providerReady ? 'Provider ready' : requirement}</p>
            </TrackedLink>
          ))}
        </div>
      </div>
    </section>
  );
}

function CrtFeature() {
  const { user } = useAuth();
  const visibility = useVisibleOnce<HTMLElement>();
  const runsQuery = useQuery({
    queryKey: ['landing-crt-runs', user?.id],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/crt-scanner/runs');
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || 'Saved runs unavailable.');
      return payload as { status: string; data?: Array<{ id: string; status: string; result_count?: number; created_at?: string }> };
    },
    enabled: Boolean(user && visibility.visible),
    retry: false,
  });
  const latest = runsQuery.data?.data?.[0];
  return (
    <section ref={visibility.ref} data-landing-section="crt-scanner" aria-labelledby="landing-crt-title" className="border-b border-slate-200 bg-[#eef6ff] py-14">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
        <div>
          <ReadinessPill tone="free">Free manual scanner</ReadinessPill>
          <h2 id="landing-crt-title" className="mt-4 text-3xl font-black text-slate-950">CRT research that starts only when you ask</h2>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600">Choose Forming, Confirmed, or Completed CRT across supported timeframes. A run captures one provider snapshot, persists a scan run ID, and reloads saved results without silently scanning again.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">{['Forming CRT', 'Confirmed CRT', 'Completed CRT'].map((label) => <div key={label} className="border-l-2 border-blue-600 bg-white p-4 text-sm font-black">{label}</div>)}</div>
          <TrackedLink to="/crt-scanner" event="crt_scan_click" icon={Radar} showArrow className="mt-7 inline-flex items-center gap-2 bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800">Run CRT Scanner</TrackedLink>
        </div>
        <div className="border border-blue-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-black">Readiness and saved run</h3><ReadinessPill tone={user ? 'setup' : 'login'}>{user ? 'Provider required' : 'Login required'}</ReadinessPill></div>
          <dl className="mt-5 divide-y divide-slate-200 text-sm">
            <RunFact label="Execution" value="Manual only; no page-load or filter-change run" />
            <RunFact label="Timeframes" value="1D, 1W, 1M, 3M, 6M, 12M" />
            <RunFact label="Last verified scan" value={latest?.created_at ? new Date(latest.created_at).toLocaleString('en-IN') : user ? 'No saved run available' : 'Sign in to load your runs'} />
            <RunFact label="Previous summary" value={latest ? `${latest.status}; ${latest.result_count ?? 0} verified results; run ${latest.id}` : 'No result invented'} />
            <RunFact label="Use" value="Educational analytics only; no directional recommendation" />
          </dl>
        </div>
      </div>
    </section>
  );
}

function RunFact({ label, value }: { label: string; value: string }) {
  return <div className="grid gap-1 py-3 sm:grid-cols-[150px_1fr]"><dt className="text-[10px] font-black uppercase text-slate-400">{label}</dt><dd className="font-semibold text-slate-700">{value}</dd></div>;
}

function ProWorkspace() {
  const { user, authStatus } = useAuth();
  const categories = ['Dashboard', 'Watchlist', 'Ideas', 'Screener', 'Data Explorer', 'Charts', 'Saved Work', 'AI Research', 'Getting Started'];
  return (
    <section data-landing-section="pro-workspace" aria-labelledby="landing-pro-title" className="border-b border-slate-200 bg-white py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="StockPro Pro workspace" id="landing-pro-title" title="A quiet workspace for repeatable research" copy="The original light Pro workspace organizes watchlists, screens, charts, saved work, and sourced AI research readiness without manufacturing recommendations or returns." aside={<TrackedLink to="/pro" icon={LayoutDashboard} showArrow className="inline-flex items-center gap-2 bg-slate-950 px-4 py-3 text-sm font-black text-white">Open Pro Workspace</TrackedLink>} />
        <div className="mt-7 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-3 lg:grid-cols-9">
          {categories.map((category, index) => <TrackedLink key={category} to={`/pro?tab=${encodeURIComponent(category.toLowerCase().replace(/\s+/g, '-'))}`} className="min-h-24 bg-slate-50 p-4 hover:bg-white"><span className="text-[10px] font-black text-blue-700">{String(index + 1).padStart(2, '0')}</span><span className="mt-3 block text-xs font-black text-slate-800">{category}</span></TrackedLink>)}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <ReadinessPill tone={user ? 'ready' : 'login'}>{user ? 'Authenticated session' : authStatus === 'setup_required' ? 'Auth setup required' : 'Visitor mode'}</ReadinessPill>
          <ReadinessPill tone="setup">Broker status checked per user</ReadinessPill>
          <ReadinessPill tone="setup">Trial readiness checked server-side</ReadinessPill>
          <ReadinessPill tone="setup">AI provider required for sourced responses</ReadinessPill>
        </div>
      </div>
    </section>
  );
}

function DeferredLandingMount() {
  const visibility = useVisibleOnce<HTMLDivElement>('500px');
  return (
    <div ref={visibility.ref} className="min-h-[420px]">
      {visibility.visible ? (
        <Suspense fallback={<div className="flex min-h-[420px] items-center justify-center bg-slate-50 text-sm font-bold text-slate-500">Loading product details...</div>}>
          <DeferredLandingSections />
        </Suspense>
      ) : <div className="min-h-[420px] bg-slate-50" aria-hidden />}
    </div>
  );
}

