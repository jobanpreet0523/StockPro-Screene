import React from 'react';
import { ShieldCheck } from 'lucide-react';

const sections = [
  {
    title: 'Information we collect',
    body: 'StockPro may collect basic account details, authentication identifiers, saved preferences, watchlists, scanner settings, device/browser data, analytics events, and support messages when you use the platform.'
  },
  {
    title: 'How we use information',
    body: 'We use information to operate the website, save user preferences, improve market tools, debug errors, understand feature usage, prevent abuse, and respond to support requests.'
  },
  {
    title: 'Market data and third-party services',
    body: 'StockPro may use third-party market-data, authentication, hosting, analytics, payment, and monitoring providers. Their processing is governed by their own policies and availability.'
  },
  {
    title: 'Cookies and local storage',
    body: 'The website may use cookies or browser local storage for theme preference, saved views, session state, analytics, and product experience improvements.'
  },
  {
    title: 'Data retention and security',
    body: 'We retain data only as needed for product operation, support, analytics, legal, and security purposes. No internet service can guarantee absolute security, but we use reasonable safeguards.'
  },
  {
    title: 'Contact',
    body: 'For privacy or data requests, contact the StockPro team through the Contact page. Replace the listed support email with your verified launch email before accepting paid users.'
  }
];

export default function PrivacyPage() {
  return (
    <div className="lg:col-span-12">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-500">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400">Legal</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Privacy Policy</h1>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Last updated: July 2026</p>
          </div>
        </div>

        <p className="mt-6 max-w-4xl text-sm leading-7 text-slate-600 dark:text-slate-300">
          This Privacy Policy explains how StockPro handles information when users access stock screeners, option-chain analytics, watchlists, scanner tools, news, and related finance education features.
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
