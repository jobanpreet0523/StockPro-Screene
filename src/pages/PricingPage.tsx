import React from 'react';
import PricingView from '../components/PricingView';

export default function PricingPage() {
  return (
    <div className="lg:col-span-12 flex flex-col gap-6" id="pricing-section">
      <PricingView />
    </div>
  );
}
