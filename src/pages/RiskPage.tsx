import React from 'react';
import RiskCalculator from '../components/RiskCalculator';

export default function RiskPage() {
  return (
    <div className="lg:col-span-12 flex flex-col gap-6" id="risk-calculator-section">
      <RiskCalculator />
    </div>
  );
}
