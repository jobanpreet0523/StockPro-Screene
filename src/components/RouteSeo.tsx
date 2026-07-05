import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://stockpro1.qzz.io';

const defaultSeo = {
  title: 'StockPro — Free NSE F&O Screener | Delayed Data + Broker Live Setup',
  description: 'NSE and F&O analytics with delayed/cached free data, option-chain tools, stock screener, scanner, signals, and paid broker-live setup for Indian traders.',
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
};

const routeSeo: Record<string, { title: string; description: string; robots?: string }> = {
  '/': defaultSeo,
  '/landing': defaultSeo,
  '/screener': {
    title: 'Free NSE Stock Screener — StockPro',
    description: 'Scan NSE stocks with delayed/cached prices, gainers, losers, market breadth, F&O filters, watchlists, and trading analytics on StockPro.',
  },
  '/scanner': {
    title: 'Smart Market Scanner for NSE Stocks — StockPro',
    description: 'Run smart scanner views for Indian stocks, signals, momentum, technical setups, and market opportunities using StockPro.',
  },
  '/option-chain': {
    title: 'NIFTY & BANKNIFTY Option Chain Tools — StockPro',
    description: 'Analyze NIFTY, BANKNIFTY, FINNIFTY, and stock option chains with PCR, OI buildup, IV movement, support, resistance, and max pain tools using delayed/cached or broker-connected data.',
  },
  '/us-markets': {
    title: 'US Markets Dashboard — StockPro',
    description: 'Track US market indices, global market context, and cross-market signals from the StockPro analytics workspace.',
  },
  '/strategy-builder': {
    title: 'Options Strategy Builder — StockPro',
    description: 'Build and compare options strategies for educational analysis with payoff views, risk zones, and derivatives workflow support.',
  },
  '/greeks-calculator': {
    title: 'Options Greeks Calculator — StockPro',
    description: 'Calculate option Greeks and understand delta, gamma, theta, vega, implied volatility, and risk sensitivity for derivatives education.',
  },
  '/risk-calculator': {
    title: 'Trading Risk Calculator — StockPro',
    description: 'Estimate position risk, reward, exposure, and trading discipline metrics before analyzing any trade setup.',
  },
  '/heatmap': {
    title: 'Stock Market Heatmap India — StockPro',
    description: 'View market heatmap insights for sectors, stock movement, gainers, losers, breadth, and market mood.',
  },
  '/fii-dii': {
    title: 'FII/DII Data India — StockPro',
    description: 'Track FII and DII activity, institutional flows, market participation, and Indian equity trend context.',
  },
  '/deals': {
    title: 'Bulk and Block Deals — StockPro',
    description: 'Monitor bulk deals and block deals for Indian stocks with transaction context and market activity insights.',
  },
  '/news': {
    title: 'Stock Market News India — StockPro',
    description: 'Read market news, stock updates, and trading headlines connected to the StockPro analytics workflow.',
  },
  '/pricing': {
    title: 'StockPro Pricing — Free NSE F&O Tools + ₹299 Live Setup',
    description: 'Compare StockPro plans: free delayed/cached stock screening and option-chain analytics, plus ₹299 paid broker-live setup when backend verification is active.',
  },
  '/blog': {
    title: 'F&O Strategic Blog — StockPro',
    description: 'Learn option-chain analysis, NSE screening, PCR ratio, IV rank, risk management, and market strategy concepts on the StockPro blog.',
  },
  '/signals': {
    title: 'StockPro Signals — NSE Market Signals',
    description: 'Explore NSE market signals, scanner alerts, momentum observations, and market intelligence for educational analysis.',
  },
  '/connect-broker': {
    title: 'Connect Broker for Live NSE Data Setup — StockPro',
    description: 'Set up Upstox or Zerodha broker-live mode for paid StockPro users after payment verification and secure backend authorization are connected.',
  },
  '/privacy': {
    title: 'Privacy Policy — StockPro',
    description: 'Read how StockPro handles account data, analytics, cookies, local storage, support messages, and third-party services.',
  },
  '/terms': {
    title: 'Terms of Use — StockPro',
    description: 'Read the StockPro terms of use for market analytics, screeners, option-chain tools, payments, accounts, and user responsibilities.',
  },
  '/risk-disclosure': {
    title: 'Risk Disclosure — StockPro',
    description: 'StockPro is not SEBI registered investment advice. Read important risks before using stock, futures, and options analytics tools.',
  },
  '/contact': {
    title: 'Contact StockPro Support',
    description: 'Contact StockPro for support, product feedback, broken links, UI issues, data concerns, and launch questions.',
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
