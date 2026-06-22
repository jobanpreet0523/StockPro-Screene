import React from 'react';
import StrategyBuilder from '../components/StrategyBuilder';

export default function StrategyPage() {
  return (
    <div className="lg:col-span-12 flex flex-col gap-6" id="strategy-builder-section">
      <StrategyBuilder />
    </div>
  );
}
