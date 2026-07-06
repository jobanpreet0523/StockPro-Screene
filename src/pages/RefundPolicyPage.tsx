import React from 'react';
import TrustPageLayout, { TrustCard } from '../components/TrustPageLayout';

export default function RefundPolicyPage() {
  return (
    <TrustPageLayout eyebrow="Billing trust" title="Refund policy — launch placeholder" intro="Real payment and checkout are currently disabled. No StockPro subscription charge should occur while billing remains setup_required.">
      <TrustCard title="Current launch state"><p>StockPro does not currently accept live subscription payments. Trial APIs collect no money and create no recurring mandate.</p></TrustCard>
      <TrustCard title="Before paid launch"><p>A final refund, cancellation, billing-error, and charge-dispute policy must be reviewed and published before real payment is enabled.</p></TrustCard>
      <TrustCard title="Trial cancellation"><p>Future trial users must be able to cancel before renewal. The final policy must explain effective dates, access after cancellation, and any eligible refund window.</p></TrustCard>
      <TrustCard title="Payment questions"><p>Use the Contact page for launch questions. Never send card details, bank credentials, OTPs, or payment authentication codes.</p></TrustCard>
    </TrustPageLayout>
  );
}
