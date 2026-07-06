import React from 'react';
import TrustPageLayout, { TrustCard } from '../components/TrustPageLayout';

export default function DataMethodologyPage() {
  return (
    <TrustPageLayout eyebrow="Data trust" title="Market-data methodology" intro="StockPro separates delayed/sample data, external-provider data, and per-user broker-connected data so the interface never needs to pretend a static value is live.">
      <TrustCard title="Delayed and sample mode"><p>The default public workspace may use clearly labelled 15-minute delayed or sample datasets. These values are educational context and can be stale.</p></TrustCard>
      <TrustCard title="External provider mode"><p>A licensed external gateway can supply standardized quotes, indices, option chains, and provider health. Missing credentials return setup_required; provider failures return unavailable.</p></TrustCard>
      <TrustCard title="Broker-connected mode"><p>Future live data must be authorized per user through that user’s own broker account. A connected label appears only after server verification.</p></TrustCard>
      <TrustCard title="Timestamps and status"><p>Data envelopes include source, timestamp, delay, live/stale flags, and provider status. “Live” is shown only when the provider explicitly verifies live data.</p></TrustCard>
      <TrustCard title="No substitute values"><p>If a source is missing or fails, StockPro shows setup_required or unavailable. It does not manufacture market prices, open interest, news, or performance.</p></TrustCard>
    </TrustPageLayout>
  );
}
