import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BarChart3, ChevronDown, KeyRound, LayoutDashboard, Menu, Radar, Search, UserRound, X,
} from 'lucide-react';
import { ReadinessPill, TrackedLink } from './landing/LandingPrimitives';
import LandingHero3D from './landing3d/LandingHero3D';
import LandingSceneFallback from './landing3d/LandingSceneFallback';
import '../styles/landing-story.css';

const StockProSearch = lazy(() => import('./search/StockProSearch'));
const LandingPrimarySections = lazy(() => import('./landing/LandingPrimarySections'));

class LandingSectionsErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    console.error('Optional homepage sections could not be loaded.');
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section data-landing-sections-error role="status" className="border-y border-amber-200 bg-amber-50 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-black text-slate-950">Additional research sections are temporarily unavailable</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">The homepage introduction and product routes remain available. Reload to retry the optional section download.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-6 bg-slate-950 px-5 py-3 text-sm font-black text-white">Reload sections</button>
        </div>
      </section>
    );
  }
}

function LandingSearch() {
  const [active, setActive] = useState(false);
  if (!active) {
    return (
      <label className="relative block">
        <span className="sr-only">Search StockPro</span>
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          aria-label="Search StockPro"
          readOnly
          placeholder="Search stocks, sectors, and guides"
          onFocus={() => setActive(true)}
          onPointerDown={() => setActive(true)}
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-950"
        />
      </label>
    );
  }
  return (
    <Suspense fallback={<div className="h-10 w-full border border-slate-300 bg-white/90" aria-label="Search loading" />}>
      <StockProSearch autoFocus />
    </Suspense>
  );
}

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

export default function LandingProductPage() {
  const [belowFoldReady, setBelowFoldReady] = useState(false);

  useEffect(() => {
    const staticShell = document.getElementById('stockpro-static-shell');
    if (staticShell?.classList.contains('stockpro-static-overlay')) {
      staticShell.classList.add('stockpro-static-ready');
      staticShell.setAttribute('aria-hidden', 'true');
    }
    const root = document.documentElement;
    const restoreDark = root.classList.contains('dark');
    root.classList.remove('dark');
    let timer = 0;
    const reveal = () => {
      window.clearTimeout(timer);
      setBelowFoldReady(true);
    };
    // Keep optional below-fold modules off the initial main-thread path. Real user
    // intent reveals them immediately; the timeout only hydrates an idle page.
    const schedule = () => { timer = window.setTimeout(reveal, 10_000); };
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });
    window.addEventListener('pointerdown', reveal, { once: true, passive: true });
    window.addEventListener('scroll', reveal, { once: true, passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('load', schedule);
      window.removeEventListener('pointerdown', reveal);
      window.removeEventListener('scroll', reveal);
      if (restoreDark) root.classList.add('dark');
    };
  }, []);

  return (
    <div id="landing-page" className="landing-shell min-h-screen bg-white text-slate-950">
      <LandingNavigation />
      <LandingHero3D />
      <main id="main-content" className="landing-story">
        <LandingHero />
        {belowFoldReady ? (
          <LandingSectionsErrorBoundary>
            <Suspense fallback={<div className="min-h-[420px] bg-slate-50" aria-hidden />}>
              <LandingPrimarySections />
            </Suspense>
          </LandingSectionsErrorBoundary>
        ) : <div className="min-h-[420px] bg-slate-50" aria-hidden />}
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
    <header className="landing-nav sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
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
        <div className="ml-auto hidden w-64 xl:block"><LandingSearch /></div>
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
            <div className="mt-5"><LandingSearch /></div>
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

function LandingHero() {
  return (
    <section data-landing-section="hero" data-landing-scene="research-universe" data-scene-number="01" aria-labelledby="landing-hero-title" className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden bg-slate-950 py-8 text-white">
      <div className="landing-scene-grid relative mx-auto grid w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:gap-8">
        <div className="landing-hero-copy relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <ReadinessPill tone="setup">Provider checked before values render</ReadinessPill>
            <span className="text-xs font-semibold text-slate-300">Educational research analytics. No trade execution.</span>
          </div>
          <h1 id="landing-hero-title" className="mt-5 max-w-3xl text-4xl font-black leading-[1.05] sm:text-5xl lg:text-6xl">StockPro research, from first screen to saved decision trail.</h1>
          <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-slate-200 sm:text-base">Screen Indian markets, run the free manual CRT workflow, connect your own broker for read-only data, and organize research without invented prices, promises, or signals.</p>
          <div className="mt-5 max-w-xl"><LandingSearch /></div>
          <div className="mt-5 flex flex-wrap gap-2">
            <TrackedLink to="/screener" icon={Search} showArrow className="inline-flex items-center gap-2 bg-blue-600 px-4 py-3 text-xs font-black text-white hover:bg-blue-500">Open Screener</TrackedLink>
            <TrackedLink to="/crt-scanner" event="crt_scan_click" icon={Radar} showArrow className="inline-flex items-center gap-2 border border-white/35 bg-white/10 px-4 py-3 text-xs font-black text-white hover:bg-white/20">Run CRT Scanner</TrackedLink>
            <TrackedLink to="/pro" icon={LayoutDashboard} showArrow className="inline-flex items-center gap-2 border border-white/35 bg-white/10 px-4 py-3 text-xs font-black text-white hover:bg-white/20">Explore Pro</TrackedLink>
            <TrackedLink to="/connect-broker" event="connect_broker_click" icon={KeyRound} showArrow className="inline-flex items-center gap-2 border border-emerald-300/60 bg-emerald-500/15 px-4 py-3 text-xs font-black text-emerald-100 hover:bg-emerald-500/25">Connect Broker</TrackedLink>
          </div>
        </div>
        <LandingSceneFallback scene="research-universe" />
      </div>
    </section>
  );
}
