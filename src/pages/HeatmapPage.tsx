import React from 'react';
import Heatmap from '../components/Heatmap';

export default function HeatmapPage() {
  return (
    <div className="lg:col-span-12 flex flex-col gap-6" id="heatmap-section">
      <Heatmap />
    </div>
  );
}
