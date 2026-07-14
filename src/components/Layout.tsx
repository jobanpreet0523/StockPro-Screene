import { lazy, Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';

const DashboardWorkspace = lazy(() => import('./DashboardWorkspace'));

const routeTitles: Record<string, string> = {
  '/screener': 'Turn market noise into a focused daily research workflow.',
  '/scanner': 'Build focused screens without pretending setup data is live.',
  '/crt-scanner': 'Run CRT research only with your own authorized provider.',
  '/option-chain': 'Study option-chain context with clearly sourced market data.',
};

const primaryLinks = [
  ['Screener', '/screener'],
  ['Scanner', '/scanner'],
  ['CRT Scanner', '/crt-scanner'],
  ['Option Chain', '/option-chain'],
  ['Pro', '/pro'],
  ['News', '/news'],
  ['Pricing', '/pricing'],
] as const;

export default function Layout() {
  const location = useLocation();
  const title = routeTitles[location.pathname] || 'A focused workspace for educational market research.';
  const hasStaticShell = Boolean(document.getElementById('stockpro-static-shell'));

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white" id="core_app_layer">
      {!hasStaticShell && <header className="sticky top-0 z-50 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950" id="app_header">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-4 px-4">
          <Link to="/" className="shrink-0 text-lg font-black">Stock<span className="text-emerald-600">Pro</span></Link>
          <nav className="hidden flex-1 items-center gap-1 overflow-x-auto md:flex" id="main_navigation" aria-label="Product navigation">
            {primaryLinks.map(([label, path]) => <Link key={path} to={path} className="shrink-0 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">{label}</Link>)}
          </nav>
          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <Link to="/connect-broker" className="bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Setup provider</Link>
            <Link to="/account" className="border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">Account</Link>
          </div>
          <details className="relative ml-auto md:hidden">
            <summary className="cursor-pointer text-sm font-bold">Menu</summary>
            <nav className="absolute right-0 top-10 grid w-52 border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-950" aria-label="Mobile product navigation">
              {primaryLinks.map(([label, path]) => <Link key={path} to={path} className="px-3 py-2 text-sm font-bold">{label}</Link>)}
              <Link to="/account" className="px-3 py-2 text-sm font-bold">Account</Link>
            </nav>
          </details>
        </div>
      </header>}

      {!hasStaticShell && <section className="border-b border-slate-800 bg-slate-950 px-4 py-8 text-white" aria-labelledby="workspace-title">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase text-emerald-400">Educational analytics only | Provider checked before values render</p>
          <h1 id="workspace-title" className="mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Market values appear only when a configured authorized provider returns them. StockPro does not execute trades.</p>
        </div>
      </section>}

      <Suspense fallback={<div className="min-h-[720px] bg-slate-50 dark:bg-slate-950" aria-label="Loading research tools" />}>
        <DashboardWorkspace />
      </Suspense>

      <footer className="mt-auto border-t border-slate-200 bg-white px-4 py-6 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-4">
          <span>Educational analytics, not investment advice.</span>
          <Link to="/data-methodology">Data methodology</Link>
          <Link to="/risk-disclosure">Risk disclosure</Link>
          <Link to="/contact">Support</Link>
        </div>
      </footer>
    </div>
  );
}