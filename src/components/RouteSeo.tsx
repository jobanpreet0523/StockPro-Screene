import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://stockpro1.qzz.io';

const defaultSeo = {
  title: 'StockPro — Market Research Workspace',
  description: 'StockPro is a professional market research workspace with delayed dashboards, screeners, watchlist workflow, F&O education, risk tools, and a Pro waitlist.',
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
};

const routeSeo: Record<string, { title: string; description: string; robots?: string }> = {
  '/': defaultSeo,
  '/landing': { ...defaultSeo, robots: 'noindex, nofollow' },
  '/screener': {
    title: 'Screening Workspace — StockPro',
    description: 'Use delayed data views, filters, watchlists, and analytics tables inside the StockPro workspace.',
  },
  '/scanner': {
    title: 'Scanner Workspace — StockPro',
    description: 'Explore scanner views, momentum tables, saved views, and workspace signals using delayed data labels.',
  },
  '/option-chain': {
    title: 'Chain Workspace — StockPro',
    description: 'Analyze chain-style tables, open interest views, volatility context, support zones, and resistance zones using delayed or verified data labels.',
  },
  '/us-markets': {
    title: 'Global Markets Dashboard — StockPro',
    description: 'Track global dashboard context, cross-market views, and summary tables from the StockPro analytics workspace.',
  },
  '/strategy-builder': {
    title: 'Strategy Builder — StockPro',
    description: 'Build and compare educational strategy views with payoff zones, risk areas, and scenario support.',
  },
  '/greeks-calculator': {
    title: 'Greeks Calculator — StockPro',
    description: 'Use an educational calculator for delta, gamma, theta, vega, implied volatility, and sensitivity context.',
  },
  '/risk-calculator': {
    title: 'Risk Calculator — StockPro',
    description: 'Estimate position size, exposure, reward, and discipline metrics before reviewing a setup.',
  },
  '/heatmap': {
    title: 'Heatmap — StockPro',
    description: 'View heatmap insights, sector movement, gainers, losers, breadth, and workspace mood.',
  },
  '/fii-dii': {
    title: 'Institutional Flow View — StockPro',
    description: 'Track institutional flow context, participation data, and dashboard summaries.',
  },
  '/deals': {
    title: 'Deals Dashboard — StockPro',
    description: 'Review large deal activity, transaction context, and market activity summaries.',
  },
  '/news': {
    title: 'Market News — StockPro',
    description: 'Read dashboard-connected news, updates, and headlines in the StockPro workflow.',
  },
  '/pricing': {
    title: 'StockPro Upgrade Center — Free, Pro, Premium',
    description: 'Compare the free delayed workspace with Pro and Premium roadmap features including saved screens, alerts, exports, and advanced research workflows.',
  },
  '/pro': {
    title: 'StockPro Pro Readiness',
    description: 'Review verified Pro workspace readiness without synthetic entitlements, live data, alerts, or saved-screen counts.',
  },
  '/start-trial': {
    title: '7-Day Pro Trial Disclosure — StockPro',
    description: 'Review the StockPro Pro trial price, duration, cancellation timing, and explicit auto-renew consent disclosure. Payment remains disabled until setup is complete.',
  },
  '/blog': {
    title: 'StockPro Education Hub — Screener, Option Chain, Risk Guides',
    description: 'Learn market-screening workflows, option-chain basics, watchlist routines, risk discipline, and how to use StockPro tools for educational research.',
  },
  '/daily-brief': {
    title: 'Daily Brief - StockPro',
    description: 'Review educational market context, provider-status labels, and dashboard summaries without fake live news or investment advice.',
  },
  '/signals': {
    title: 'Signals Workspace — StockPro',
    description: 'Explore scanner alerts, observations, and educational workspace intelligence.',
  },
  '/connect-broker': {
    title: 'Connect Your Broker for Data — StockPro',
    description: 'Review the per-user broker connection foundation for future data access. StockPro does not place trades or share broker tokens between users.',
  },
  '/about': {
    title: 'About StockPro — Educational Market Analytics',
    description: 'Learn how StockPro approaches educational analytics, honest market-data labels, per-user broker authorization, and non-advisory research tools.',
  },
  '/data-methodology': {
    title: 'Market-Data Methodology — StockPro',
    description: 'Understand StockPro delayed and sample data, external provider mode, broker-connected mode, timestamps, staleness, and provider-status labels.',
  },
  '/support-policy': {
    title: 'Support Policy — StockPro',
    description: 'Read StockPro support channels, response expectations, security guidance, and limits on emergency trading or investment-advice support.',
  },
  '/refund-policy': {
    title: 'Refund Policy — StockPro Launch Placeholder',
    description: 'Review the StockPro pre-launch refund-policy placeholder. Real payment and checkout remain disabled until a final policy is published.',
  },
  '/status': {
    title: 'Service Status — StockPro',
    description: 'Check current StockPro market-data, waitlist, auth, broker vault, billing, ads, and news-service setup or availability states.',
  },
  '/account': {
    robots: 'noindex, nofollow',
    title: 'Account — StockPro',
    description: 'Review StockPro account, subscription, billing readiness, and per-user broker setup states without fake login or payment status.',
  },
  '/login': {
    robots: 'noindex, nofollow',
    title: 'Login - StockPro',
    description: 'Check StockPro account session setup through server-verified Supabase Auth state. No fake login state is created.',
  },
  '/signup': {
    robots: 'noindex, nofollow',
    title: 'Signup - StockPro',
    description: 'Create a StockPro account only after Supabase Auth is configured. Signup never creates fake users or broker state.',
  },
  '/beta': {
    robots: 'noindex, nofollow',
    title: 'Closed Beta Readiness - StockPro',
    description: 'Review StockPro closed beta readiness across auth, waitlist, broker, billing, market data, news, ads, and setup-required states.',
  },
  '/admin/waitlist': {
    title: 'Waitlist Administration - StockPro',
    description: 'Restricted waitlist administration setup.',
    robots: 'noindex, nofollow',
  },
  '/privacy': {
    title: 'Privacy Policy — StockPro',
    description: 'Read how StockPro handles account data, analytics, cookies, local storage, support messages, and third-party services.',
  },
  '/terms': {
    title: 'Terms of Use — StockPro',
    description: 'Read the StockPro terms of use for analytics, dashboards, setup flows, accounts, and user responsibilities.',
  },
  '/risk-disclosure': {
    title: 'Risk Disclosure — StockPro',
    description: 'Read important risks and non-advisory information before using analytics dashboards or educational tools.',
  },
  '/contact': {
    title: 'Join StockPro Waitlist or Contact Support',
    description: 'Contact StockPro support, join the Pro or Premium waitlist, request early access, report product feedback, or ask launch questions.',
  },
};

function upsertMeta(selector: string, create: () => HTMLMetaElement, value: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = create();
    document.head.appendChild(element);
  }
  element.setAttribute('content', value);
}

function upsertLink(selector: string, create: () => HTMLLinkElement, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(selector);
  if (!element) {
    element = create();
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

export default function RouteSeo() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname.replace(/\/$/, '') || '/';
    const config = routeSeo[pathname] || defaultSeo;
    const canonical = `${SITE_URL}${pathname === '/' ? '/' : pathname}`;

    document.title = config.title;

    upsertMeta('meta[name="description"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      return meta;
    }, config.description);

    upsertMeta('meta[name="robots"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      return meta;
    }, config.robots || defaultSeo.robots);

    upsertMeta('meta[property="og:title"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:title');
      return meta;
    }, config.title);

    upsertMeta('meta[property="og:description"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:description');
      return meta;
    }, config.description);

    upsertMeta('meta[property="og:url"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:url');
      return meta;
    }, canonical);

    upsertMeta('meta[name="twitter:title"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'twitter:title');
      return meta;
    }, config.title);

    upsertMeta('meta[name="twitter:description"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'twitter:description');
      return meta;
    }, config.description);

    upsertLink('link[rel="canonical"]', () => {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      return link;
    }, canonical);
  }, [location.pathname]);

  return null;
}
