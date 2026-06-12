import React from 'react';
import GreeksCalculator from '../components/GreeksCalculator';

export default function GreeksPage() {
  return (
    <div className="lg:col-span-12 flex flex-col gap-6" id="greeks-calculator-section">
      <GreeksCalculator />
    </div>
  );
}
