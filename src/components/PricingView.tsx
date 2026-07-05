import React from "react";
import { useNavigate } from "react-router-dom";
import { Check, ShieldCheck, Zap, Crown, Radio, LockKeyhole } from "lucide-react";

export default function PricingView() {
  const navigate = useNavigate();

  const freeFeatures = [
    "Delayed/cached market snapshots",
    "Stock screener and scanner access",
    "Option-chain analysis workspace",
    "Heatmap, FII/DII, signals, news, and deals",
    "Education and research tools",
  ];

  const liveFeatures = [
    "Broker-connected real-time mode",
    "Live-enabled screener and watchlist foundation",
    "Live option-chain workflow foundation",
    "Backend relay required before real ticks are shown",
    "Clear data-source badge on every page",
  ];

  return (
    <div className="max-w-6xl mx-auto w-full py-8 text-slate-900 dark:text-white">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300 mb-4">
          <Crown size={14} /> Free delayed data + paid live mode
        </div>
        <h2 className="text-3xl md:text-4xl font-black mb-4">Choose your StockPro data mode</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Delayed/cached data stays free for everyone. Real-time market data needs the ₹299 live plan and a secure broker connection.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <PlanCard
          icon={Zap}
          title="Free Delayed Data"
          price="₹0"
          period="forever"
          description="Best for exploring StockPro tools, learning option-chain analysis, and using scanner workflows with delayed/cached snapshots."
          features={freeFeatures}
          button="Continue free"
          onClick={() => navigate('/screener')}
        />

        <PlanCard
          icon={Radio}
          title="Live Data Plan"
          price="₹299"
          period="per month"
          description="For users who need real-time mode. The live plan unlocks the broker connection workflow used by live-enabled features."
          features={liveFeatures}
          button="Set up live mode"
          highlighted
          onClick={() => navigate('/connect-broker')}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-start gap-3">
        <ShieldCheck size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
          Do not paste broker credentials in chat, GitHub, or public frontend code. Paid live users should connect through the secure broker setup page only after the backend relay and payment verification are configured.
        </p>
      </div>
    </div>
  );
}

function PlanCard({ icon: Icon, title, price, period, description, features, button, highlighted = false, onClick }: {
  icon: typeof Zap;
  title: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  button: string;
  highlighted?: boolean;
  onClick: () => void;
}) {
  return (
    <div className={`rounded-3xl p-7 shadow-xl relative overflow-hidden ${highlighted ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 border border-emerald-400' : 'bg-white/85 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800'}`}>
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400" />
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-black flex items-center gap-2">
            <Icon size={22} className="text-emerald-500" /> {title}
          </h3>
          <p className={`text-sm mt-2 leading-6 ${highlighted ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}>{description}</p>
        </div>
        {highlighted && <LockKeyhole size={22} className="text-emerald-400 shrink-0" />}
      </div>

      <div className="mb-6">
        <span className="text-4xl font-black text-emerald-500">{price}</span>
        <span className={`ml-2 text-xs font-bold uppercase tracking-widest ${highlighted ? 'text-slate-400 dark:text-slate-500' : 'text-slate-400'}`}>{period}</span>
      </div>

      <div className="grid gap-3 mb-8">
        {features.map((feature) => (
          <div key={feature} className="flex items-start gap-3">
            <Check size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            <span className={`text-sm font-semibold ${highlighted ? 'text-slate-200 dark:text-slate-700' : 'text-slate-700 dark:text-slate-200'}`}>{feature}</span>
          </div>
        ))}
      </div>

      <button onClick={onClick} className={`w-full rounded-2xl px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 ${highlighted ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' : 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'}`}>
        {button}
      </button>
    </div>
  );
}
