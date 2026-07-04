import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Cpu,
  Database,
  Gauge,
  Globe,
  Layers,
  LineChart,
  PlayCircle,
  Radar,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { getMarketStatus } from '../utils/marketStatus';

interface LiveIndex {
  symbol: string;
  name: string;
  price: number;
  change?: number;
  changePercent: number;
}

const fallbackIndices: LiveIndex[] = [
  { symbol: '^NSEI', name: 'NIFTY 50', price: 24270.85, change: 325.45, changePercent: 1.35 },
  { symbol: '^NSEBANK', name: 'BANK NIFTY', price: 57038.50, change: 621.2, changePercent: 1.10 },
  { symbol: '^BSESN', name: 'SENSEX', price: 77763.91, change: 1039.6, changePercent: 1.34 },
  { symbol: '^CNXIT', name: 'NIFTY IT', price: 27439.40, change: 399.2, changePercent: 1.48 },
];

const features = [
  {
    icon: Radar,
    title: 'Live F&O Intelligence',
    body: 'Option chain, PCR, max pain, OI shift, IV zones, and active strike pressure in one visual cockpit.',
  },
  {
    icon: BarChart3,
    title: 'Advanced Screener',
    body: 'Filter market movers, liquidity, delivery, F&O enabled stocks, and technical momentum faster.',
  },
  {
    icon: Gauge,
    title: 'Risk + Greeks Engine',
    body: 'Estimate payoff, IV sensitivity, Greeks exposure, risk bands, and scenario outcomes before entry.',
  },
  {
    icon: Layers,
    title: 'Heatmap + Flow',
    body: 'Track sector heat, institutional activity, FII/DII data, block deals, and signal clusters.',
  },
  {
    icon: Sparkles,
    title: 'Signal Workspace',
    body: 'Clean bullish, bearish, volatility, and breakout signals with fewer distractions and better hierarchy.',
  },
  {
    icon: ShieldCheck,
    title: 'Free Full Access',
    body: 'Every tool is unlocked for users. No paid lock, no hidden Pro tab, and no upgrade friction.',
  },
];

const workflow = [
  { label: 'Scan', detail: 'Find momentum, OI, volume, and volatility opportunities.', icon: LineChart },
  { label: 'Validate', detail: 'Cross-check chart, chain, heatmap, news, and institutional flow.', icon: Cpu },
  { label: 'Execute', detail: 'Use payoff, Greeks, and risk tools before taking a position.', icon: Zap },
];

const optionRows = [
  { strike: 24150, ce: '42.1L', pe: '19.4L', tone: 'down' },
  { strike: 24200, ce: '55.8L', pe: '33.8L', tone: 'neutral' },
  { strike: 24250, ce: '31.6L', pe: '64.2L', tone: 'up' },
  { strike: 24300, ce: '22.4L', pe: '78.9L', tone: 'up' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [market, setMarket] = useState(() => getMarketStatus());
  const [indices, setIndices] = useState<LiveIndex[]>(fallbackIndices);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setMarket(getMarketStatus()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadLandingData() {
      try {
        const res = await fetch('/api/indices', { signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error('indices fetch failed');
        const json = await res.json();
        const next = Array.isArray(json?.data) ? json.data : [];
        if (mounted && next.length) {
          setIndices(next.slice(0, 6));
        }
      } catch (error) {
        console.warn('Landing live data fallback active:', error);
      } finally {
        if (mounted) setLoaded(true);
      }
    }
    loadLandingData();
    const id = setInterval(loadLandingData, 60000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const leadIndex = indices[0] || fallbackIndices[0];
  const marketPulse = useMemo(() => {
    const gainers = indices.filter((item) => (item.changePercent ?? 0) >= 0).length;
    return Math.round((gainers / Math.max(1, indices.length)) * 100);
  }, [indices]);

  const formatPrice = (value: number) =>
    Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const openDashboard = () => navigate('/screener');

  return (
    <main className="ultra-landing relative min-h-screen overflow-hidden bg-[#030712] text-white">
      <style>{`
        .ultra-landing {
          background:
            radial-gradient(circle at 12% 8%, rgba(16, 185, 129, 0.26), transparent 28rem),
            radial-gradient(circle at 86% 12%, rgba(59, 130, 246, 0.24), transparent 30rem),
            radial-gradient(circle at 50% 80%, rgba(139, 92, 246, 0.16), transparent 34rem),
            #030712;
        }
        .landing-grid {
          background-image:
            linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
          background-size: 46px 46px;
          mask-image: radial-gradient(circle at center, black, transparent 78%);
        }
        .landing-perspective { perspective: 1400px; }
        .terminal-3d {
          transform-style: preserve-3d;
          animation: terminalFloat 8s ease-in-out infinite;
        }
        .terminal-3d::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 32px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(52, 211, 153, 0.9), rgba(34, 211, 238, 0.55), rgba(99, 102, 241, 0.75));
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .terminal-shadow {
          transform: rotateX(72deg) translateZ(-90px);
          filter: blur(28px);
        }
        .orbit-ring {
          position: absolute;
          inset: 12%;
          border: 1px solid rgba(52, 211, 153, 0.2);
          border-radius: 999px;
          transform: rotateX(72deg) rotateZ(18deg);
          animation: orbitSpin 18s linear infinite;
        }
        .orbit-ring:nth-child(2) {
          inset: 22%;
          border-color: rgba(96, 165, 250, 0.2);
          animation-duration: 13s;
          animation-direction: reverse;
        }
        .glass-panel {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(2, 6, 23, 0.78));
          border: 1px solid rgba(148, 163, 184, 0.18);
          box-shadow: 0 28px 90px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.06);
          backdrop-filter: blur(22px) saturate(150%);
        }
        .shine-card { position: relative; overflow: hidden; }
        .shine-card::after {
          content: '';
          position: absolute;
          inset: -120% -40%;
          background: linear-gradient(120deg, transparent 35%, rgba(255,255,255,0.16), transparent 62%);
          transform: translateX(-45%) rotate(12deg);
          animation: cardShine 6s ease-in-out infinite;
        }
        .ticker-track { animation: tickerMove 32s linear infinite; }
        .ticker-track:hover { animation-play-state: paused; }
        .floating-cube {
          transform-style: preserve-3d;
          animation: cubeFloat 6s ease-in-out infinite;
        }
        .pulse-dot::before {
          content: '';
          position: absolute;
          inset: -5px;
          border-radius: 999px;
          background: rgba(52, 211, 153, 0.28);
          animation: pingSoft 1.8s ease-in-out infinite;
        }
        @keyframes terminalFloat {
          0%, 100% { transform: rotateX(8deg) rotateY(-12deg) translateY(0); }
          50% { transform: rotateX(4deg) rotateY(-7deg) translateY(-14px); }
        }
        @keyframes orbitSpin {
          from { transform: rotateX(72deg) rotateZ(0deg); }
          to { transform: rotateX(72deg) rotateZ(360deg); }
        }
        @keyframes cardShine {
          0%, 60% { transform: translateX(-55%) rotate(12deg); }
          78%, 100% { transform: translateX(55%) rotate(12deg); }
        }
        @keyframes tickerMove {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes cubeFloat {
          0%, 100% { transform: translate3d(0, 0, 38px) rotateX(0deg) rotateY(0deg); }
          50% { transform: translate3d(10px, -18px, 72px) rotateX(13deg) rotateY(18deg); }
        }
        @keyframes pingSoft {
          0%, 100% { opacity: 0; transform: scale(0.78); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @media (prefers-reduced-motion: reduce) {
          .terminal-3d, .orbit-ring, .shine-card::after, .ticker-track, .floating-cube, .pulse-dot::before { animation: none !important; }
        }
      `}</style>

      <div className="landing-grid pointer-events-none fixed inset-0 opacity-70" />
      <div className="pointer-events-none fixed -left-32 top-1/4 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none fixed -right-32 top-20 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5">
        <button onClick={() => navigate('/landing')} className="flex items-center gap-3 text-left">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/20">
            <TrendingUp size={24} strokeWidth={2.8} />
          </span>
          <span>
            <span className="block text-lg font-black tracking-tight">Stock<span className="text-emerald-300">Pro</span></span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Free F&O terminal</span>
          </span>
        </button>

        <div className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl md:flex">
          <span className="pulse-dot relative h-2.5 w-2.5 rounded-full" style={{ backgroundColor: market.color }} />
          <span className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: market.color }}>{market.label}</span>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-black text-emerald-300">YAHOO LIVE</span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/news')} className="hidden rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 backdrop-blur-xl transition hover:bg-white/10 sm:inline-flex">
            Market News
          </button>
          <button onClick={openDashboard} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-950 shadow-xl shadow-white/10 transition hover:-translate-y-0.5 hover:bg-emerald-50">
            Open Dashboard <ArrowRight size={15} />
          </button>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-8 lg:grid-cols-[1.02fr_0.98fr] lg:pb-24 lg:pt-16">
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.26em] text-emerald-300">
            <Sparkles size={14} /> Ultra 3D Market Command Center
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.07em] text-white sm:text-6xl lg:text-7xl">
            Trade smarter with a cinematic F&O analytics cockpit.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            A premium, motion-rich landing experience for live indices, option-chain intelligence, Greeks, scanners, heatmaps, institutional flow, and market news — now fully free for every user.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button onClick={openDashboard} className="shine-card inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 py-4 text-sm font-black text-slate-950 shadow-2xl shadow-emerald-500/25 transition hover:-translate-y-1 hover:bg-emerald-300">
              <PlayCircle size={18} /> Launch Free Terminal
            </button>
            <button onClick={() => navigate('/option-chain')} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/8 px-6 py-4 text-sm font-black text-white backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/12">
              Explore Option Chain <ArrowRight size={18} />
            </button>
          </div>

          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {[
              ['29+', 'Live instruments'],
              [`${marketPulse}%`, 'Market breadth'],
              ['FREE', 'All tools'],
            ].map(([value, label], index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 + index * 0.08 }}
                className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-xl"
              >
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="landing-perspective relative min-h-[560px]">
          <div className="orbit-ring" />
          <div className="orbit-ring" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateX: 18, rotateY: -22 }}
            animate={{ opacity: 1, scale: 1, rotateX: 8, rotateY: -12 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="terminal-3d glass-panel absolute left-1/2 top-10 w-[min(92vw,620px)] -translate-x-1/2 rounded-[2rem] p-5"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                Live cockpit
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                <Activity className="mb-3 text-emerald-300" size={18} />
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nifty 50</div>
                <div className="mt-1 text-xl font-black">{formatPrice(leadIndex.price)}</div>
                <div className="mt-1 text-xs font-bold text-emerald-300">+{Number(leadIndex.changePercent || 0).toFixed(2)}%</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                <Radar className="mb-3 text-cyan-300" size={18} />
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">PCR</div>
                <div className="mt-1 text-xl font-black">1.34</div>
                <div className="mt-1 text-xs font-bold text-cyan-300">Bullish bias</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                <Database className="mb-3 text-violet-300" size={18} />
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Max Pain</div>
                <div className="mt-1 text-xl font-black">24,250</div>
                <div className="mt-1 text-xs font-bold text-violet-300">Active zone</div>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/70 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Option Chain Pulse</span>
                <span className="text-[10px] font-black text-emerald-300">ATM LIVE</span>
              </div>
              <div className="space-y-2">
                {optionRows.map((row) => (
                  <div key={row.strike} className="grid grid-cols-[1fr_0.8fr_1fr] items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.035] px-3 py-2 text-xs font-bold">
                    <span className="text-cyan-300">CE {row.ce}</span>
                    <span className={`rounded-xl px-2 py-1 text-center font-black ${row.tone === 'neutral' ? 'bg-emerald-400 text-slate-950' : 'bg-white/8 text-white'}`}>{row.strike}</span>
                    <span className="text-right text-emerald-300">PE {row.pe}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 h-28 rounded-3xl border border-emerald-400/10 bg-gradient-to-r from-emerald-400/10 via-cyan-400/10 to-violet-400/10 p-4">
              <div className="flex h-full items-end gap-2">
                {[42, 64, 50, 78, 58, 88, 69, 96, 74, 82, 92, 70].map((height, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 8 }}
                    animate={{ height }}
                    transition={{ delay: i * 0.035, duration: 0.5, repeat: Infinity, repeatType: 'mirror', repeatDelay: 2 }}
                    className="flex-1 rounded-t-lg bg-gradient-to-t from-emerald-500 to-cyan-300 opacity-85"
                  />
                ))}
              </div>
            </div>
          </motion.div>

          <div className="terminal-shadow absolute bottom-4 left-1/2 h-36 w-[520px] -translate-x-1/2 rounded-full bg-emerald-500/20" />
          <motion.div className="floating-cube absolute right-4 top-16 hidden h-24 w-24 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 backdrop-blur-xl lg:block" />
          <motion.div className="floating-cube absolute bottom-24 left-0 hidden h-20 w-20 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 backdrop-blur-xl lg:block" style={{ animationDelay: '1.2s' }} />
        </div>
      </section>

      <section className="relative z-10 border-y border-white/10 bg-white/[0.035] py-4 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl overflow-hidden px-5">
          <div className="ticker-track flex min-w-max items-center gap-4">
            {[...indices, ...indices, ...fallbackIndices, ...fallbackIndices].map((item, index) => {
              const up = (item.changePercent ?? 0) >= 0;
              return (
                <div key={`${item.symbol}-${index}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">{item.name}</span>
                  <span className="font-mono text-sm font-black text-white">{formatPrice(item.price)}</span>
                  <span className={`font-mono text-xs font-black ${up ? 'text-emerald-300' : 'text-rose-300'}`}>{up ? '+' : ''}{Number(item.changePercent || 0).toFixed(2)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-20">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-emerald-300">Platform Modules</div>
            <h2 className="max-w-2xl text-4xl font-black tracking-[-0.05em] text-white md:text-5xl">Everything a trader needs, redesigned for speed.</h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-slate-400">Clean information hierarchy, motion feedback, and premium cards make the product feel like a real trading terminal instead of a static website.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.button
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: index * 0.06, duration: 0.45 }}
                whileHover={{ y: -8, rotateX: 2, rotateY: -2 }}
                onClick={openDashboard}
                className="shine-card group rounded-3xl border border-white/10 bg-white/[0.055] p-6 text-left backdrop-blur-xl transition hover:border-emerald-400/40 hover:bg-white/[0.08]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300 transition group-hover:scale-110">
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-black text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{feature.body}</p>
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-20">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <div className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-cyan-300">3-Step Trading Flow</div>
              <h2 className="text-4xl font-black tracking-[-0.05em] text-white">From scan to decision in one workspace.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-400">Your landing page now explains the product clearly: discover opportunities, validate with analytics, then control risk before taking action.</p>
              <button onClick={() => navigate('/scanner')} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-emerald-50">
                Try Smart Scanner <ArrowRight size={16} />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {workflow.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="relative rounded-3xl border border-white/10 bg-slate-950/70 p-5"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950"><Icon size={20} /></span>
                      <span className="font-mono text-xs font-black text-slate-500">0{index + 1}</span>
                    </div>
                    <h3 className="text-xl font-black text-white">{step.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{step.detail}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-24">
        <div className="overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-gradient-to-r from-emerald-400 via-cyan-300 to-indigo-400 p-[1px] shadow-2xl shadow-emerald-500/20">
          <div className="rounded-[2rem] bg-slate-950 px-6 py-10 text-center md:px-12 md:py-14">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950">
              <CheckCircle2 size={28} />
            </div>
            <h2 className="mx-auto max-w-3xl text-4xl font-black tracking-[-0.05em] text-white md:text-5xl">All advanced tools are unlocked and ready.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-400">No Pro lock, no hidden premium features, and no payment wall. Launch the dashboard and access the full StockPro workspace.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button onClick={openDashboard} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-emerald-300">
                Start Free Now <ArrowRight size={18} />
              </button>
              <button onClick={() => navigate('/pricing')} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/8 px-6 py-4 text-sm font-black text-white backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/12">
                View Free Access
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
