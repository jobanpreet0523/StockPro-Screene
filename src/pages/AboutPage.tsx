import React from 'react';
import TrustPageLayout, { TrustCard } from '../components/TrustPageLayout';

export default function AboutPage() {
  return (
    <TrustPageLayout eyebrow="About StockPro" title="Research clarity before market decisions" intro="StockPro’s mission is to make market data labels, screening workflows, and educational analytics easier to understand without presenting personalized investment advice.">
      <TrustCard title="Educational analytics"><p>Screeners, option-chain views, calculators, news, and research tools are provided for education and independent analysis. StockPro is not an investment advisor.</p></TrustCard>
      <TrustCard title="Honest data labels"><p>Every provider surface identifies whether data is delayed, unavailable, or verified live. StockPro does not substitute made-up values when a provider fails.</p></TrustCard>
      <TrustCard title="Your broker, your data"><p>Broker-connected data can use only the authenticated user’s own broker authorization. One user’s broker token or data must never be shared with another user.</p></TrustCard>
      <TrustCard title="No trade execution"><p>Current broker foundations are data-only and setup-required. StockPro does not place, modify, or cancel orders.</p></TrustCard>
    </TrustPageLayout>
  );
}
