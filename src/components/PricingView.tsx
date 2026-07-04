import React from "react";
import { Check, ShieldCheck, Zap, Crown } from "lucide-react";

export default function PricingView() {
  const freeFeatures = [
    "Live market screener",
    "Chartink-style custom scanner",
    "F&O analytics and option chain",
    "Real-time option tools and Greeks",
    "IV calculator and risk calculator",
    "Heatmap, FII/DII data, signals, news, and deals",
    "Unlimited saved scanners and watchlist access",
  ];

  return (
    <div className="max-w-5xl mx-auto w-full py-8 text-slate-900 dark:text-white">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300 mb-4">
          <Crown size={14} /> All Tools Are Free
        </div>
        <h2 className="text-3xl md:text-4xl font-black mb-4">StockPro Free Access</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The paid lock has been removed. Every analytics module is now available for free so users can open all tabs and use all functions without upgrading.
        </p>
      </div>

      <div className="max-w-3xl mx-auto bg-white/85 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200/60 dark:shadow-emerald-950/20 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">
          <div>
            <h3 className="text-2xl font-black flex items-center gap-2">
              <Zap size={22} className="text-emerald-500" /> Full Platform Access
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">No subscription. No upgrade button. No hidden paid tab.</p>
          </div>
          <div className="text-left md:text-right">
            <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400">Free</div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">forever</div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {freeFeatures.map((feature) => (
            <div key={feature} className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4">
              <Check size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{feature}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20 p-4 flex items-center gap-3">
          <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
            All previous paid checks now resolve as unlocked. Login is only needed for real account/profile syncing, not for feature access.
          </p>
        </div>
      </div>
    </div>
  );
}
