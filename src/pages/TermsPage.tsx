import React from 'react';
import { FileText } from 'lucide-react';

const sections = [
  {
    title: 'Educational use only',
    body: 'StockPro provides market analytics, screeners, option-chain views, calculators, and news for education and research. It does not provide investment, legal, tax, or financial advisory services.'
  },
  {
    title: 'No trading guarantee',
    body: 'Markets are risky and data can be delayed, incomplete, or unavailable. You are responsible for your own trading decisions and for verifying data with official exchanges, brokers, or advisors.'
  },
  {
    title: 'User responsibilities',
    body: 'Do not misuse the platform, scrape it aggressively, bypass access controls, upload malicious content, or use the service for illegal or manipulative market activity.'
  },
  {
    title: 'Accounts and access',
    body: 'Some features may require sign-in or a paid plan. Access can be limited, changed, or suspended if usage harms the service, violates terms, or creates security risk.'
  },
  {
    title: 'Payments and subscriptions',
    body: 'Paid features, refunds, cancellations, and billing rules should be clearly displayed before payment. Test the payment flow before accepting paid users.'
  },
  {
    title: 'Limitation of liability',
    body: 'To the maximum extent permitted by law, StockPro is not liable for trading losses, missed opportunities, data inaccuracies, outages, or indirect damages from use of the platform.'
  }
];

export default function TermsPage() {
  return (
    <div className="lg:col-span-12">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-500">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600 dark:text-blue-400">Legal</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Terms of Use</h1>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Last updated: July 2026</p>
          </div>
        </div>

        <p className="mt-6 max-w-4xl text-sm leading-7 text-slate-600 dark:text-slate-300">
          By using StockPro, you agree to these terms. If you do not agree, do not use the platform. These terms should be reviewed by a qualified professional before commercial launch.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <h2 className="text-sm font-black text-slate-900 dark:text-white">{section.title}</h2>
              <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-400">{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
