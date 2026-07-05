import React from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Crown, Download, ShieldCheck, Zap } from "lucide-react";

export default function PricingView() {
  const navigate = useNavigate();
  const freeFeatures = ["15-minute delayed dashboard", "Basic screener presets", "Limited watchlist", "Education tools", "CSV export preview"];
  const proFeatures = ["Saved screens roadmap", "Watchlist expansion", "Alert center roadmap", "Advanced F&O workspace", "Cleaner export workflow"];
  const premiumFeatures = ["Custom dashboards roadmap", "Priority alert roadmap", "Sector and options desk", "Research notebook roadmap", "Founder pricing access"];

  return (
    <div className="max-w-6xl mx-auto w-full py-8 text-slate-900 dark:text-white">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900/40">
          <Crown size={13} /> Monetization funnel
        </div>
        <h2 className="mt-4 text-3xl md:text-4xl font-black mb-4">Choose your StockPro workflow</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
          Keep the free workspace useful enough to build trust, then offer serious users saved screens, alerts, exports, and advanced research tools.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card icon={Zap} title="Free" price="₹0" text="Best for first-time visitors and students exploring market research." items={freeFeatures} button="Use free workspace" onClick={() => navigate('/screener')} />
        <Card icon={Bell} title="Pro" price="₹799/mo" text="Designed for repeat users who want saved workflows and cleaner daily research." items={proFeatures} button="Join Pro waitlist" onClick={() => navigate('/contact')} highlighted />
        <Card icon={Download} title="Premium" price="₹1,999/mo" text="For power users who need a more complete research workspace." items={premiumFeatures} button="Request access" onClick={() => navigate('/contact')} dark />
      </div>

      <div className="mt-6 rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-start gap-3">
        <ShieldCheck size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
          Stage 1 keeps paid features clearly labeled as roadmap or waitlist until the backend, billing, and verification flows are fully ready.
        </p>
      </div>
    </div>
  );
}

function Card({ icon: Icon, title, price, text, items, button, onClick, dark = false, highlighted = false }: { icon: typeof Zap; title: string; price: string; text: string; items: string[]; button: string; onClick: () => void; dark?: boolean; highlighted?: boolean }) {
  const shell = dark
    ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 border-emerald-400'
    : highlighted
    ? 'bg-emerald-50/90 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/10'
    : 'bg-white/85 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800';

  return (
    <div className={`rounded-3xl p-7 shadow-xl border ${shell}`}>
      <h3 className="text-2xl font-black flex items-center gap-2"><Icon size={22} className="text-emerald-500" /> {title}</h3>
      <p className="text-sm mt-2 leading-6 text-slate-500 dark:text-slate-400">{text}</p>
      <div className="my-6 text-4xl font-black text-emerald-500">{price}</div>
      <div className="grid gap-3 mb-8">{items.map((item) => <div key={item} className="flex items-start gap-3"><Check size={18} className="text-emerald-500 shrink-0 mt-0.5" /><span className="text-sm font-semibold">{item}</span></div>)}</div>
      <button onClick={onClick} className="w-full rounded-2xl px-4 py-3 text-sm font-black bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition">{button}</button>
    </div>
  );
}
