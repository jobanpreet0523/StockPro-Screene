import React from 'react';
import ChartinkScannerHeaderLayer from '../components/ChartinkScannerHeaderLayer';
import ChartinkScannerUtilityPanel from '../components/ChartinkScannerUtilityPanel';
import StockProScannerFeatureLayer from '../components/StockProScannerFeatureLayer';
import ChartinkStyleScanner from '../components/ChartinkStyleScanner';
import { useDashboard } from '../components/Layout';

export default function ScannerPage() {
  const { stocks, stockData, handleSelectStock, handleSelectFoStock } = useDashboard();

  return (
    <div className="lg:col-span-12 flex flex-col gap-6" id="chartink_screener_view">
      <ChartinkScannerHeaderLayer />
      <ChartinkScannerUtilityPanel />
      <StockProScannerFeatureLayer stocks={stockData?.length ? stockData : stocks} />
      <ChartinkStyleScanner
        stocks={stocks}
        stockData={stockData}
        onSelectStock={handleSelectStock}
        onSelectFoStock={handleSelectFoStock}
      />
    </div>
  );
}
