import React from 'react';
import StrategyBuilder from '../components/StrategyBuilder';
import { useSeoTags } from '../hooks/useSeoTags';

export default function StrategyPage() {
  useSeoTags({
    title: "Options Strategy Builder | Payoff Visualization",
    description: "Design, backtest, and visualize complex option strategies with real-time Greek sensitivities."
  });
  return (
    <div className="lg:col-span-12 flex flex-col gap-6" id="strategy-builder-section">
      <StrategyBuilder />
    </div>
  );
}
