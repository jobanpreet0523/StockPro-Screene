import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Bell, BookOpen, Crown, LineChart, Search, ShieldCheck, Sparkles, Star, TrendingUp } from 'lucide-react';

const workflow = [
  { title: 'Explore', text: 'Start with a clean overview of market breadth, movers, and context.', icon: Search, path: '/screener' },
  { title: 'Screen', text: 'Use screeners and scanner views to narrow the daily research list.', icon: BarChart3, path: '/scanner' },
  { title: 'Study', text: 'Open F&O, risk, Greeks, and strategy tools for educational analysis.', icon: LineChart, path: '/option-chain' },
  { title: 'Upgrade', text: 'Join the Pro waitlist for saved workflows, alerts, and exports.', icon: Crown, path: '/pricing' },
];

const trust = ['15-minute delayed free data', 'Educational analytics only', 'No guaranteed outcomes', 'Trust pages and risk labels included'];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_36%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_32%)]" />

      <header className="relative z-10 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-3">
            <span className="rounded-2xl bg-emerald-400 p-2 text-slate-950"><TrendingUp size={22} /></span>
            <span className="text-xl font-black tracking-tight">Stock<span className="text-emerald-300">Pro</span></span>
          </button>
          <div className="hidden items-center gap-6 text-xs font-black uppercase tracking-[0.18em] text-slate-300 md:flex">
            <button onClick={() => navigate('/screener')} className="hover:text-white">Screener</button>
            <button onClick={() => navigate('/blog')} className="hover:text-white">Learn</button>
            <button onClick={() => navigate('/pricing')} className="hover:text-white">Pricing</button>
            <button onClick={() => navigate('/contact')} className="hover:text-white">Waitlist</button>
          </div>
          <button onClick={() => navigate('/screener')} className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-300">Open app</button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-12 md:py-16">
        <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
              <Sparkles size={13} /> Professional market research workspace
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.055em] md:text-6xl">
              A cleaner way to research markets every day.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
              StockPro brings dashboard context, screeners, watchlist habits, F&O education, risk tools, and a Pro waitlist into one focused workflow.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={() => navigate('/screener')} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-100">
                Start free research <ArrowRight size={16} />
              </button>
              <button onClick={() => navigate('/contact?interest=pro')} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10">
                Join Pro waitlist <Crown size={16} />
              </button>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {trust.map((item) => <span key={item} className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-slate-300">{item}</span>)}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Product workflow</div>
                <div className="mt-1 text-2xl font-black">From first visit to repeat use</div>
              </div>
              <span className="rounded-full bg-amber-400/10 px-3 py-1 text-[10px] font-black text-amber-200">DELAYED MODE</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {workflow.map((step) => {
                const Icon = step.icon;
                return (
                  <button key={step.title} onClick={() => navigate(step.path)} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-left transition hover:border-emerald-400/40 hover:bg-slate-900">
                    <Icon size={18} className="text-emerald-300" />
                    <div className="mt-3 text-lg font-black">{step.title}</div>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">{step.text}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          <InfoCard icon={Star} title="Why users return" text="Daily research desk, watchlist habit, scanner presets, signals, and educational tools create repeat usage." />
          <InfoCard icon={Bell} title="How it grows" text="Blog education links users back to tools, while waitlist CTAs collect Pro demand before checkout." />
          <InfoCard icon={ShieldCheck} title="Why it is safer" text="The product uses trust labels, delayed-data wording, risk disclosure, terms, and privacy pages." />
        </section>

        <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-200"><BookOpen size={14} /> Growth loop</div>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">Learn, open tools, join waitlist.</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">Stage 4 and Stage 5 connect education, product usage, pricing interest, and waitlist demand into one measurable funnel.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <button onClick={() => navigate('/blog')} className="rounded-2xl bg-white/10 p-4 text-left text-sm font-black hover:bg-white/15">Read guides</button>
              <button onClick={() => navigate('/pricing')} className="rounded-2xl bg-white/10 p-4 text-left text-sm font-black hover:bg-white/15">Compare plans</button>
              <button onClick={() => navigate('/contact')} className="rounded-2xl bg-emerald-400 p-4 text-left text-sm font-black text-slate-950 hover:bg-emerald-300">Join waitlist</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 px-4 py-8 text-center text-xs font-semibold text-slate-400">
        StockPro © {new Date().getFullYear()} · Educational analytics · Delayed free data · Pro roadmap
      </footer>
    </div>
  );
}

function InfoCard({ icon: Icon, title, text }: { icon: typeof Star; title: string; text: string }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
      <Icon size={22} className="text-emerald-300" />
      <h3 className="mt-4 text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{text}</p>
    </article>
  );
}
