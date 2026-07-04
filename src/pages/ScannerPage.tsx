import React from 'react';
import ChartinkScannerHeaderLayer from '../components/ChartinkScannerHeaderLayer';
import StockProScannerFeatureLayer from '../components/StockProScannerFeatureLayer';
import { useDashboard } from '../components/Layout';

export default function ScannerPage() {
  const { stocks, stockData } = useDashboard();
  const scannerRows = stockData?.length ? stockData : stocks;

  return (
    <div className="lg:col-span-12 flex flex-col gap-6" id="chartink_screener_view">
      <ChartinkScannerHeaderLayer />
      <StockProScannerFeatureLayer stocks={scannerRows} />
    </div>
  );
}
