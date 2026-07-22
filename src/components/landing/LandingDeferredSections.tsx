import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle, BarChart3, BellRing, BookOpen, Check, CircleDollarSign,
  Database, FileSearch, KeyRound, LockKeyhole, Mail, Newspaper, Radar,
  ShieldCheck, UserRound,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authenticatedFetch } from '../../core/supabaseClient';
import LandingSceneFallback from '../landing3d/LandingSceneFallback';
import { ReadinessPill, SectionHeading, TrackedLink } from './LandingPrimitives';

type ApiPayload = Record<string, unknown> & { status?: string; message?: string; data?: unknown[] };

async function readJson(path: string, authenticated = false): Promise<ApiPayload> {
  try {
    const response = authenticated ? await authenticatedFetch(path) : await fetch(path, { headers: { Accept: 'application/json' } });
    const payload = await response.json().catch(() => ({})) as ApiPayload;
    return { ...payload, httpStatus: response.status };
  } catch {
    return { status: 'unavailable', message: 'Service could not be reached.' };
  }
}

function statusLabel(payload: ApiPayload | undefined, fallback: string) {
  if (!payload) return fallback;
  if (payload.status === 'connected') return 'Connected for this user';
  if (payload.status === 'setup_pending') return 'Approval pending';
  if (payload.status === 'not_connected') return 'Not connected';
  if (payload.status === 'reconnect_required') return 'Reconnect required';
  if (payload.status === 'setup_required') return 'Setup required';
  return payload.status === 'unavailable' ? 'Unavailable' : fallback;
}

export default function LandingDeferredSections() {
  const { user, authStatus } = useAuth();
  const readinessQuery = useQuery({
    queryKey: ['landing-deferred-readiness', user?.id ?? 'visitor'],
    queryFn: async () => {
      const [trial, upstox, dhan, angel, watchlists, alerts] = await Promise.all([
        readJson('/api/trial/status'),
        user ? readJson('/api/broker/upstox/status', true) : Promise.resolve({ status: 'login_required' }),
        user ? readJson('/api/broker/dhan/status', true) : Promise.resolve({ status: 'login_required' }),
        readJson('/api/broker/angelone/status', Boolean(user)),
        user ? readJson('/api/watchlists', true) : Promise.resolve({ status: 'login_required', data: [] }),
        user ? readJson('/api/alerts', true) : Promise.resolve({ status: 'login_required', data: [] }),
      ]);
      return { trial, upstox, dhan, angel, watchlists, alerts };
    },
    staleTime: 60_000,
    retry: false,
  });
  const readiness = readinessQuery.data;

  return (
    <>
      <BrokerSection userReady={Boolean(user)} upstox={readiness?.upstox} dhan={readiness?.dhan} angel={readiness?.angel} />
      <ScreeningSection />
      <SavedWorkSection userReady={Boolean(user)} authSetupRequired={authStatus === 'setup_required'} watchlists={readiness?.watchlists} alerts={readiness?.alerts} />
      <TrustSection />
      <PricingSection trial={readiness?.trial} />
      <ContentSection />
      <FaqSection />
      <LandingFooter />
    </>
  );
}

function BrokerSection({ userReady, upstox, dhan, angel }: { userReady: boolean; upstox?: ApiPayload; dhan?: ApiPayload; angel?: ApiPayload }) {
  const brokers = [
    {
      name: 'Upstox',
      status: userReady ? statusLabel(upstox, 'Checking setup') : 'Login required',
      copy: 'Per-user OAuth uses server-generated state, a server-side token exchange, and encrypted storage.',
      tone: upstox?.status === 'connected' ? 'ready' : userReady ? 'setup' : 'login',
    },
    {
      name: 'Dhan',
      status: userReady ? statusLabel(dhan, 'Checking sandbox/live readiness') : 'Login required',
      copy: 'Sandbox and live modes stay separate. Data API subscription and static-IP limits remain explicit.',
      tone: dhan?.status === 'connected' ? 'ready' : userReady ? 'setup' : 'login',
    },
    {
      name: 'Angel One',
      status: statusLabel(angel, 'Approval pending'),
      copy: 'Integration stays disabled until application approval and current official credentials are configured.',
      tone: 'pending',
    },
  ] as const;
  return (
    <section data-landing-section="broker-connect" data-landing-scene="broker-vault" data-scene-number="06" aria-labelledby="landing-broker-title" className="border-b border-slate-200 bg-slate-950 py-14 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 border-b border-slate-700 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl"><p className="text-[11px] font-black uppercase text-emerald-300">Connect your own broker</p><h2 id="landing-broker-title" className="mt-2 text-3xl font-black">Read-only data, isolated per user</h2><p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-300">Every user connects their own account. Tokens are encrypted server-side, never stored in the browser, and never shared across StockPro users.</p></div>
          <div className="flex flex-wrap gap-2"><TrackedLink to="/connect-broker" event="connect_broker_click" icon={KeyRound} showArrow className="inline-flex items-center gap-2 bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950">Connect Broker</TrackedLink><TrackedLink to="/data-methodology" icon={ShieldCheck} className="inline-flex items-center gap-2 border border-slate-600 px-4 py-3 text-sm font-black text-white">View Security Model</TrackedLink></div>
        </div>
        <div className="landing-scene-grid mt-7 grid items-center gap-7">
          <LandingSceneFallback scene="broker-vault" />
          <div className="grid gap-3 lg:grid-cols-3">
          {brokers.map((broker) => (
            <div key={broker.name} className="border border-slate-700 bg-slate-900 p-5">
              <div className="flex items-start justify-between gap-3"><h3 className="text-lg font-black">{broker.name}</h3><ReadinessPill tone={broker.tone}>{broker.status}</ReadinessPill></div>
              <p className="mt-4 text-sm font-medium leading-6 text-slate-300">{broker.copy}</p>
              {broker.name === 'Angel One' && <p className="mt-4 text-xs font-bold text-orange-200">Connect remains disabled while approval is pending.</p>}
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-3 text-xs font-semibold text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
          <SecurityFact icon={LockKeyhole} text="AES-GCM encrypted backend token storage" />
          <SecurityFact icon={UserRound} text="No shared StockPro broker token" />
          </div>
          <SecurityFact icon={ShieldCheck} text="No browser credential storage" />
          <SecurityFact icon={AlertTriangle} text="No order placement or trade execution" />
        </div>
      </div>
    </section>
  );
}

function SecurityFact({ icon: Icon, text }: { icon: typeof ShieldCheck; text: string }) {
  return <div className="flex items-center gap-2 border-l-2 border-emerald-400 pl-3"><Icon size={16} aria-hidden />{text}</div>;
}

function ScreeningSection() {
  const filters = ['Fundamental', 'Technical', 'Volume', 'Trend', 'Price', 'Sector', 'OI/PCR when supported', 'Saved screens after login'];
  return (
    <section data-landing-section="screening-analytics" data-landing-scene="screener-funnel" data-scene-number="07" aria-labelledby="landing-screening-title" className="border-b border-slate-200 bg-white py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="Screening and market analytics" id="landing-screening-title" title="Build a filter, then ask the provider" copy="The screener exposes real research capabilities without pre-populating fabricated companies or matches. Empty results remain a valid outcome." aside={<ReadinessPill tone="setup">Available count depends on configured services</ReadinessPill>} />
        <div className="landing-scene-grid mt-7 grid gap-8">
          <div className="grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">{filters.map((filter) => <div key={filter} className="flex min-h-20 items-center gap-3 bg-slate-50 p-4 text-sm font-black text-slate-800"><Check size={16} className="text-emerald-700" aria-hidden />{filter}</div>)}</div>
          <div className="space-y-3"><LandingSceneFallback scene="screener-funnel" /><div className="border border-slate-200 bg-[#fff7ed] p-5"><BarChart3 size={22} className="text-orange-700" aria-hidden /><h3 className="mt-4 text-lg font-black">Provider-gated results</h3><p className="mt-2 text-sm font-medium leading-6 text-slate-600">No company is shown as a match until a configured service returns validated data.</p><div className="mt-5 flex flex-wrap gap-2"><TrackedLink to="/screener" showArrow className="inline-flex items-center gap-2 bg-blue-700 px-4 py-3 text-xs font-black text-white">Open Screener</TrackedLink><TrackedLink to="/option-chain" showArrow className="inline-flex items-center gap-2 border border-slate-300 bg-white px-4 py-3 text-xs font-black text-slate-800">Open Option Chain</TrackedLink></div></div></div>
        </div>
      </div>
    </section>
  );
}

function SavedWorkSection({ userReady, authSetupRequired, watchlists, alerts }: { userReady: boolean; authSetupRequired: boolean; watchlists?: ApiPayload; alerts?: ApiPayload }) {
  const watchlistCount = userReady && Array.isArray(watchlists?.data) ? watchlists.data.length : null;
  const alertCount = userReady && Array.isArray(alerts?.data) ? alerts.data.length : null;
  const capabilities = ['Personal watchlists', 'Saved stocks', 'Saved screeners', 'Saved research', 'Price alerts', 'CRT alerts', 'OI alerts when data exists', 'Email delivery readiness'];
  return (
    <section data-landing-section="saved-work" data-landing-scene="personal-vault" data-scene-number="08" aria-labelledby="landing-saved-title" className="border-b border-slate-200 bg-[#f0fdfa] py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="Watchlist, saved work, and alerts" id="landing-saved-title" title="Your research stays attached to your account" copy="Authenticated counts come from user-isolated storage. Missing database or email setup remains informational and never becomes a fake saved item or sent alert." aside={<ReadinessPill tone={userReady ? 'ready' : authSetupRequired ? 'setup' : 'login'}>{userReady ? 'Authenticated' : authSetupRequired ? 'Auth setup required' : 'Login required'}</ReadinessPill>} />
        <div className="landing-scene-grid mt-7 grid gap-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{capabilities.map((item) => <div key={item} className="border border-teal-200 bg-white p-4 text-sm font-black text-slate-800">{item}</div>)}</div>
          <div className="space-y-3"><LandingSceneFallback scene="personal-vault" /><div className="border border-teal-300 bg-white p-5"><BellRing size={22} className="text-teal-700" aria-hidden /><dl className="mt-4 divide-y divide-slate-200"><Metric label="Watchlists" value={watchlistCount === null ? 'Login/setup required' : String(watchlistCount)} /><Metric label="Alerts" value={alertCount === null ? 'Login/setup required' : String(alertCount)} /><Metric label="Email" value="Configuration checked at send time" /></dl><div className="mt-5 flex gap-2"><TrackedLink to="/account" className="bg-teal-700 px-4 py-3 text-xs font-black text-white">Open Account</TrackedLink><TrackedLink to="/pro" className="border border-slate-300 px-4 py-3 text-xs font-black text-slate-800">Open Pro</TrackedLink></div></div></div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 py-3 text-xs"><dt className="font-black uppercase text-slate-400">{label}</dt><dd className="text-right font-bold text-slate-800">{value}</dd></div>;
}

function TrustSection() {
  const trustItems = [
    'Per-user encrypted broker-token storage', 'No shared broker tokens', 'No order placement',
    'No guaranteed returns', 'No false live labels', 'Transparent provider timestamps',
    'Supabase RLS and user isolation', 'Turnstile-protected public forms',
    'Sentry monitoring without PII', 'Privacy-safe analytics allowlist',
  ];
  const links = [
    ['Data methodology', '/data-methodology'], ['Risk disclosure', '/risk-disclosure'],
    ['Privacy', '/privacy'], ['Terms', '/terms'], ['Support policy', '/support-policy'], ['Status', '/status'],
  ];
  return (
    <section data-landing-section="trust" data-landing-scene="trust-core" data-scene-number="09" aria-labelledby="landing-trust-title" className="border-b border-slate-200 bg-[#fffdf5] py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="Trust, security, and data reality" id="landing-trust-title" title="Truthful states are part of the product" copy="StockPro is an educational analytics platform, not investment advice. It makes readiness, source, timestamp, and user isolation visible without claiming certifications it has not obtained." />
        <div className="landing-scene-grid mt-7 grid items-center gap-7"><div className="grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">{trustItems.map((item) => <div key={item} className="min-h-24 bg-white p-4"><ShieldCheck size={17} className="text-emerald-700" aria-hidden /><p className="mt-3 text-xs font-black leading-5 text-slate-800">{item}</p></div>)}</div><LandingSceneFallback scene="trust-core" /></div>
        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Trust and legal pages">{links.map(([label, to]) => <TrackedLink key={to} to={to} showArrow className="inline-flex items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:border-blue-400 hover:text-blue-700">{label}</TrackedLink>)}</nav>
      </div>
    </section>
  );
}

function PricingSection({ trial }: { trial?: ApiPayload }) {
  const steps = ['Create account', 'Verify email', 'Connect broker', 'Create watchlist', 'Run CRT Scanner', 'Open Pro workspace', 'Create alert'];
  const trialReady = trial?.status === 'ready' || trial?.status === 'configured' || trial?.status === 'test_ready';
  return (
    <section data-landing-section="pricing" data-landing-scene="getting-started" data-scene-number="10" aria-labelledby="landing-pricing-title" className="border-b border-slate-200 bg-white py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="Pricing, trial, and getting started" id="landing-pricing-title" title="Start free; test billing stays visibly disabled" copy="The CRT Scanner remains free. Pro trial readiness requires explicit auto-renew consent, and Razorpay live payment remains disabled." aside={<ReadinessPill tone="disabled">Payment live disabled</ReadinessPill>} />
        <div className="landing-scene-grid mt-7 grid items-center gap-6">
          <div className="border-2 border-blue-700 bg-white p-6"><CircleDollarSign size={24} className="text-blue-700" aria-hidden /><p className="mt-4 text-[10px] font-black uppercase text-blue-700">Free plan</p><h3 className="mt-2 text-2xl font-black">CRT Scanner and core research entry</h3><p className="mt-3 text-sm font-medium leading-6 text-slate-600">Pro preview and a 7-day test trial are visible only as readiness flows. Every user supplies their own broker connection.</p><div className="mt-5 flex flex-wrap gap-2"><TrackedLink to="/account" icon={UserRound} className="inline-flex items-center gap-2 bg-blue-700 px-4 py-3 text-xs font-black text-white">Create Account</TrackedLink><TrackedLink to="/start-trial" event="trial_click" className="border border-slate-300 px-4 py-3 text-xs font-black text-slate-800">Start Test/Trial Flow</TrackedLink></div><p className="mt-4 text-xs font-bold text-amber-800">{trialReady ? 'Test readiness configured; no live charge is enabled.' : trial?.message || 'Trial setup required; no charge can be created.'}</p></div>
          <div><LandingSceneFallback scene="getting-started" /><ol className="mt-4 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">{steps.map((step, index) => <li key={step} className="min-h-24 bg-slate-50 p-4"><span className="text-[10px] font-black text-blue-700">STEP {index + 1}</span><p className="mt-3 text-sm font-black text-slate-800">{step}</p></li>)}</ol><div className="mt-5 flex flex-wrap gap-2"><TrackedLink to="/pricing" className="border border-slate-300 px-4 py-3 text-xs font-black text-slate-800">View Pricing</TrackedLink><TrackedLink to="/pro" className="border border-slate-300 px-4 py-3 text-xs font-black text-slate-800">Open Pro</TrackedLink><TrackedLink to="/connect-broker" event="connect_broker_click" className="border border-slate-300 px-4 py-3 text-xs font-black text-slate-800">Connect Broker</TrackedLink></div></div>
        </div>
      </div>
    </section>
  );
}

function ContentSection() {
  const resources = [
    { title: 'Market news', copy: 'Provider-backed articles only; no fabricated headline or timestamp.', to: '/news', icon: Newspaper },
    { title: 'Daily Brief', copy: 'Dated editorial content appears only when it exists.', to: '/daily-brief', icon: Mail },
    { title: 'CRT education', copy: 'Learn the scanner modes without directional recommendations.', to: '/blog', icon: Radar },
    { title: 'Market-data methodology', copy: 'Understand source, delay, timestamp, and unavailable states.', to: '/data-methodology', icon: Database },
    { title: 'Broker security', copy: 'Review per-user encryption and disconnect behavior.', to: '/support-policy', icon: LockKeyhole },
    { title: 'Risk education', copy: 'Read the educational analytics and derivatives disclosure.', to: '/risk-disclosure', icon: BookOpen },
  ];
  return (
    <section data-landing-section="education" aria-labelledby="landing-content-title" className="border-b border-slate-200 bg-slate-50 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6"><SectionHeading eyebrow="News and educational content" id="landing-content-title" title="Source-first reading, never filler" copy="These routes expose actual provider or editorial readiness. They do not seed the homepage with fabricated stories or dates." /><div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{resources.map(({ title, copy, to, icon: Icon }) => <TrackedLink key={to} to={to} className="border border-slate-200 bg-white p-5 hover:border-blue-400"><Icon size={20} className="text-blue-700" aria-hidden /><h3 className="mt-4 text-sm font-black">{title}</h3><p className="mt-2 text-xs font-medium leading-5 text-slate-600">{copy}</p></TrackedLink>)}</div></div>
    </section>
  );
}

function FaqSection() {
  const faqs = [
    ['Is StockPro investment advice?', 'No. StockPro provides educational research analytics and does not guarantee outcomes.'],
    ['Is CRT Scanner free?', 'Yes. CRT Scanner remains free and runs only after a manual action.'],
    ['Does StockPro place trades?', 'No. Broker integrations are read-only and no order-placement route is enabled.'],
    ['Why connect my own broker?', 'Market-data permissions and tokens belong to each user; StockPro does not share an owner token.'],
    ['Which brokers are supported?', 'Upstox and Dhan are prepared for testing. Angel One remains approval pending.'],
    ['Is market data live?', 'Only a verified provider response with a valid timestamp may receive a live label.'],
    ['Is payment enabled?', 'Razorpay live payment is disabled. Only test readiness may be configured.'],
    ['How are broker tokens protected?', 'Tokens use authenticated encryption on the backend and are never returned to the browser.'],
    ['How do I disconnect?', 'Use the provider disconnect action on the Broker Connect page.'],
    ['How do I report a problem?', 'Use Contact for a submission or review the Support Policy and Status pages.'],
  ];
  return (
    <section data-landing-section="faq" aria-labelledby="landing-faq-title" className="border-b border-slate-200 bg-white py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6"><SectionHeading eyebrow="FAQ and support" id="landing-faq-title" title="Direct answers to the important questions" copy="Readiness language is intentionally plain: connected means verified, live means verified, and unavailable never gets a substitute value." /><div className="mt-7 divide-y divide-slate-200 border-y border-slate-200">{faqs.map(([question, answer]) => <details key={question} className="group py-4"><summary className="cursor-pointer list-none pr-8 text-sm font-black text-slate-900">{question}</summary><p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-600">{answer}</p></details>)}</div><div className="mt-6 flex flex-wrap gap-2"><TrackedLink to="/contact" className="bg-blue-700 px-4 py-3 text-xs font-black text-white">Contact</TrackedLink><TrackedLink to="/support-policy" className="border border-slate-300 px-4 py-3 text-xs font-black">Support Policy</TrackedLink><TrackedLink to="/status" className="border border-slate-300 px-4 py-3 text-xs font-black">Status</TrackedLink></div></div>
    </section>
  );
}

function LandingFooter() {
  const columns = [
    { title: 'Product', links: [['Screener', '/screener'], ['Scanner', '/scanner'], ['CRT Scanner', '/crt-scanner'], ['Option Chain', '/option-chain'], ['Pro', '/pro']] },
    { title: 'Research', links: [['Signals', '/signals'], ['Heatmap', '/heatmap'], ['News', '/news'], ['Daily Brief', '/daily-brief'], ['Blog', '/blog']] },
    { title: 'Company', links: [['About', '/about'], ['Pricing', '/pricing'], ['Account', '/account'], ['Contact', '/contact'], ['Status', '/status']] },
    { title: 'Legal and support', links: [['Privacy', '/privacy'], ['Terms', '/terms'], ['Risk disclosure', '/risk-disclosure'], ['Methodology', '/data-methodology'], ['Support policy', '/support-policy']] },
  ];
  return (
    <footer className="bg-slate-950 py-12 text-white"><div className="mx-auto max-w-7xl px-4 sm:px-6"><div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]"><div><div className="flex items-center gap-2 text-sm font-black uppercase"><span className="flex h-8 w-8 items-center justify-center bg-blue-600"><BarChart3 size={17} aria-hidden /></span>StockPro</div><p className="mt-4 max-w-xs text-xs font-medium leading-5 text-slate-400">Educational research analytics with provider transparency, per-user broker isolation, and no trade execution.</p></div>{columns.map((column) => <div key={column.title}><h2 className="text-[10px] font-black uppercase text-slate-500">{column.title}</h2><ul className="mt-3 space-y-2">{column.links.map(([label, to]) => <li key={to}><TrackedLink to={to} className="text-xs font-semibold text-slate-300 hover:text-white">{label}</TrackedLink></li>)}</ul></div>)}</div><div className="mt-10 border-t border-slate-800 pt-6 text-xs font-medium text-slate-500">2026 StockPro. Educational analytics only. No investment advice, guaranteed returns, order placement, or live payment.</div></div></footer>
  );
}

