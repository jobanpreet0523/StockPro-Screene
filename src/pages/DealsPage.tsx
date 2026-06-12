import React from 'react';
import DealsTracker from '../components/DealsTracker';

export default function DealsPage() {
  return (
    <div className="lg:col-span-12 flex flex-col gap-6" id="deals-section">
      <DealsTracker />
    </div>
  );
}
