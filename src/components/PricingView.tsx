import React from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CircleCheckBig, Crown, Download, LockKeyhole, ShieldCheck, Users, Zap } from "lucide-react";
import ProFeatureGate from './ProFeatureGate';
import type { ProFeature } from '../core/proAccess';
import { canEnableCheckout, launchChecklist, paidAccessEnabled } from '../core/launchChecklist';

const futureProFeatures: ProFeature[] = ['saved_screens', 'expanded_watchlist', 'alerts', 'exports', 'advanced_research'];

export default function PricingView() {
  const navigate = useNavigate();
  const paymentEnabled = paidAccessEnabled();
  const checkoutReady = canEnableCheckout();
  const freeFeatures = ["Provider-backed dashboard when configured", "Basic screener presets", "Limited watchlist", "Education tools", "CSV export preview"];
  const proFeatures = ["Saved screens roadmap", "Watchlist expansion", "Alert center roadmap", "Advanced F&O workspace", "Cleaner export workflow"];
  const premiumFeatures = ["Custom dashboards roadmap", "Priority alert roadmap", "Sector and options desk", "Research notebook roadmap", "Founder pricing access"];

  return (
    <div className="max-w-6xl mx-auto w-full py-8 text-slate-900 dark:text-white">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900/40">
          <Crown size={13} /> Upgrade center
        </div>
        <h2 className="mt-4 text-3xl md:text-4xl font-black mb-4">Choose your StockPro workflow</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
          Keep the free workspace useful, then invite serious repeat users into Pro workflows with saved screens, alerts, exports, and advanced research tools.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card icon={Zap} title="Free" price="₹0" text="Best for first-time visitors and students exploring market research." items={freeFeatures} button="Use free workspace" onClick={() => navigate('/screener')} />
        <Card icon={Bell} title="Pro" price="₹0 today" text="A 7-day trial foundation for repeat users who want saved workflows and cleaner daily research." items={proFeatures} button="Review Pro trial" onClick={() => navigate('/start-trial')} analyticsEvent="trial_cta_click" highlighted />
        <Card icon={Download} title="Premium" price="Request access" text="For power users who need a more complete research workspace." items={premiumFeatures} button="Request access" onClick={() => navigate('/contact?interest=premium')} dark />
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <InfoCard icon={Users} title="Free users" value="Trust first" text="Make the free product useful enough that users return to screen, watch, and learn." />
        <InfoCard icon={Bell} title="Pro users" value="Repeat workflow" text="Pro is for users who want saved screens, alerts, exports, and cleaner daily research." />
        <InfoCard icon={Crown} title="Premium users" value="Power workspace" text="Premium is the future path for custom dashboards and deeper research tools." />
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/75">
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-600 dark:text-amber-300">Pro feature locks</div>
        <h3 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">Future tools stay gated until access is ready.</h3>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
          Basic screening, news, education, and Daily Brief remain available. These future workflow upgrades use the waitlist path only.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {futureProFeatures.map((feature) => <ProFeatureGate key={feature} plan="free" feature={feature} />)}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/75">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400">Launch readiness</div>
            <h3 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">Payment is not enabled yet.</h3>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
              Paid access will be activated only after support, policy, account, and access checks are ready.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 lg:items-end">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              <LockKeyhole size={12} /> {checkoutReady && paymentEnabled ? 'Checkout ready' : 'Checkout disabled'}
            </span>
            <button onClick={() => navigate('/contact?interest=waitlist')} className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400">
              Join waitlist
            </button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {launchChecklist.map((item) => (
            <div key={item.key} className={`rounded-2xl border p-3 text-xs font-black ${item.ready ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200' : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300'}`}>
              {item.ready ? <CircleCheckBig size={14} className="mr-2 inline" /> : <LockKeyhole size={14} className="mr-2 inline" />}
              {item.label}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-start gap-3">
        <ShieldCheck size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
          Payment is not enabled yet. The Pro trial page collects disclosure consent only; Premium requests use the contact path.
        </p>
      </div>
    </div>
  );
}

function Card({ icon: Icon, title, price, text, items, button, onClick, analyticsEvent, dark = false, highlighted = false }: { icon: typeof Zap; title: string; price: string; text: string; items: string[]; button: string; onClick: () => void; analyticsEvent?: string; dark?: boolean; highlighted?: boolean }) {
  const shell = dark
    ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 border-emerald-400'
    : highlighted
    ? 'bg-emerald-50/90 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/10'
    : 'bg-white/85 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800';

  return (
    <div className={`rounded-3xl p-7 shadow-xl border ${shell}`}>
      <h3 className="text-2xl font-black flex items-center gap-2"><Icon size={22} className="text-emerald-500" /> {title}</h3>
      <p className={`text-sm mt-2 leading-6 ${dark ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}>{text}</p>
      <div className={`my-6 text-4xl font-black ${dark ? 'text-emerald-300 dark:text-emerald-700' : 'text-emerald-500'}`}>{price}</div>
      <div className="grid gap-3 mb-8">{items.map((item) => <div key={item} className="flex items-start gap-3"><Check size={18} className="text-emerald-500 shrink-0 mt-0.5" /><span className="text-sm font-semibold">{item}</span></div>)}</div>
      <button onClick={onClick} data-analytics-event={analyticsEvent} data-analytics-label={analyticsEvent ? `${title}:${button}` : undefined} className="w-full rounded-2xl px-4 py-3 text-sm font-black bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition">{button}</button>
    </div>
  );
}

function InfoCard({ icon: Icon, title, value, text }: { icon: typeof Users; title: string; value: string; text: string }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/75">
      <Icon size={20} className="text-emerald-500" />
      <h3 className="mt-3 text-sm font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{title}</h3>
      <div className="mt-2 text-xl font-black text-slate-950 dark:text-white">{value}</div>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{text}</p>
    </article>
  );
}
