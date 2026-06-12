import React from 'react';
import UsMarketsView from '../components/UsMarketsView';

export default function UsMarketsPage() {
  return (
    <div className="lg:col-span-12 flex flex-col gap-6" id="us-markets-section">
      <UsMarketsView />
    </div>
  );
}
