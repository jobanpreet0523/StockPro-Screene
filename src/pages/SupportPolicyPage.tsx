import React from 'react';
import { Link } from 'react-router-dom';
import TrustPageLayout, { TrustCard } from '../components/TrustPageLayout';

export default function SupportPolicyPage() {
  return (
    <TrustPageLayout eyebrow="Support" title="Support policy" intro="StockPro support covers account, access, data-label, and product questions. A verified launch support channel must be published before paid access is enabled.">
      <TrustCard title="Support channel"><p>Until a verified support inbox is configured, use the <Link to="/contact" className="font-black text-emerald-600 underline">Contact page</Link>. Do not send passwords, OTPs, broker tokens, or payment credentials.</p></TrustCard>
      <TrustCard title="Response expectations"><p>During launch preparation, the target is an initial response within two business days. This is an operating target, not a guaranteed service level.</p></TrustCard>
      <TrustCard title="No emergency trading support"><p>StockPro cannot provide time-critical trade execution, position management, outage recovery, or emergency market support.</p></TrustCard>
      <TrustCard title="No investment advice"><p>Support can explain product behavior and data labels, but cannot recommend securities, strategies, entries, exits, or position sizes.</p></TrustCard>
    </TrustPageLayout>
  );
}
