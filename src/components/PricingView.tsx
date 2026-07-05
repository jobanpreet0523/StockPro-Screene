import React from "react";
import { useNavigate } from "react-router-dom";
import { Check, ShieldCheck, Zap, Radio } from "lucide-react";

export default function PricingView() {
  const navigate = useNavigate();
  const freeFeatures = ["Delayed data view", "Screening workspace", "Scanner", "Workspace tools", "Education tools"];
  const setupFeatures = ["Setup page", "Server verification required", "Advanced mode off by default", "Clear status labels", "Upgrade path prepared"];

  return (
    <div className="max-w-6xl mx-auto w-full py-8 text-slate-900 dark:text-white">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-black mb-4">Choose your StockPro mode</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">Start with the free delayed workspace. Advanced mode remains off until setup checks are complete.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card icon={Zap} title="Free Delayed" price="Free" text="Use the main workspace and education features." items={freeFeatures} button="Continue free" onClick={() => navigate('/screener')} />
        <Card icon={Radio} title="Verified Setup" price="Setup" text="Prepare the advanced path after server-side checks are connected." items={setupFeatures} button="View setup" onClick={() => navigate('/connect-broker')} dark />
      </div>
      <div className="mt-6 rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-start gap-3">
        <ShieldCheck size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Keep public status labels conservative until setup verification is complete.</p>
      </div>
    </div>
  );
}

function Card({ icon: Icon, title, price, text, items, button, onClick, dark = false }: { icon: typeof Zap; title: string; price: string; text: string; items: string[]; button: string; onClick: () => void; dark?: boolean }) {
  return (
    <div className={`rounded-3xl p-7 shadow-xl border ${dark ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 border-emerald-400' : 'bg-white/85 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800'}`}>
      <h3 className="text-2xl font-black flex items-center gap-2"><Icon size={22} className="text-emerald-500" /> {title}</h3>
      <p className="text-sm mt-2 leading-6 text-slate-500 dark:text-slate-400">{text}</p>
      <div className="my-6 text-4xl font-black text-emerald-500">{price}</div>
      <div className="grid gap-3 mb-8">{items.map((item) => <div key={item} className="flex items-start gap-3"><Check size={18} className="text-emerald-500 shrink-0 mt-0.5" /><span className="text-sm font-semibold">{item}</span></div>)}</div>
      <button onClick={onClick} className="w-full rounded-2xl px-4 py-3 text-sm font-black bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition">{button}</button>
    </div>
  );
}
