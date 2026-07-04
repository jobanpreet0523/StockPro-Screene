import React from 'react';
import ChartinkStyleScanner from '../components/ChartinkStyleScanner';
import { useDashboard } from '../components/Layout';

export default function ScannerPage() {
  const { stocks, stockData, handleSelectStock, handleSelectFoStock } = useDashboard();

  return (
    <div className="lg:col-span-12 flex flex-col gap-6" id="chartink_screener_view">
      <ChartinkStyleScanner
        stocks={stocks}
        stockData={stockData}
        onSelectStock={handleSelectStock}
        onSelectFoStock={handleSelectFoStock}
      />
    </div>
  );
}
